import { NextRequest, NextResponse } from "next/server";
import clientPromise, { getDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

interface PreviaOperacao {
  _id?: ObjectId;
  turno: "SBA02" | "SBA04";
  totalVeiculos: number;
  data: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

export async function POST(request: Request) {
  try {
    const { turno, totalVeiculos } = await request.json();

    if (!turno || !totalVeiculos || totalVeiculos <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Turno e total de veículos são obrigatórios",
        },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const previaCollection = db.collection<PreviaOperacao>("previaOperacao");

    const agora = new Date();
    const hojeInicio = new Date(agora);
    hojeInicio.setHours(0, 0, 0, 0);

    const hojeFim = new Date(agora);
    hojeFim.setHours(23, 59, 59, 999);

    const previaExistente = await previaCollection.findOne({
      turno: turno,
      data: {
        $gte: hojeInicio,
        $lte: hojeFim,
      },
    });

    let result;

    if (previaExistente) {
      result = await previaCollection.updateOne(
        { _id: previaExistente._id },
        {
          $set: {
            totalVeiculos,
            atualizadoEm: agora,
          },
        },
      );
    } else {
      const novaPrevia: PreviaOperacao = {
        turno,
        totalVeiculos,
        data: agora,
        criadoEm: agora,
        atualizadoEm: agora,
      };

      result = await previaCollection.insertOne(novaPrevia);
    }

    return NextResponse.json({
      success: true,
      message: previaExistente ? "Previsão atualizada" : "Previsão criada",
      data: {
        turno,
        totalVeiculos,
      },
    });
  } catch (error) {
    console.error("Erro ao salvar previsão:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao salvar previsão",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const turno = searchParams.get("turno");

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);

    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);

    const hojeFim = new Date();
    hojeFim.setHours(23, 59, 59, 999);

    const previa = await db.collection("previaOperacao").findOne({
      turno,
      data: { $gte: hojeInicio, $lte: hojeFim },
    });

    return NextResponse.json({
      success: true,
      existe: !!previa,
      turno: previa?.turno,
      totalVeiculos: previa?.totalVeiculos,
      data: previa?.data,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error });
  }
}
