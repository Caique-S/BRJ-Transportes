import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const MONGODB_DB = process.env.MONGODB_DB || "brj_transportes";
const COLLECTION = "carregamentos";

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  return { client, db };
}

// GET - Buscar um carregamento específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let client;
  try {
    const { id } = await params;

    const { client: mongoClient, db } = await connectToDatabase();
    client = mongoClient;

    const collection = db.collection(COLLECTION);
    const carregamento = await collection.findOne({
      _id: new ObjectId(id),
    });

    if (!carregamento) {
      return NextResponse.json(
        { error: "Carregamento não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(carregamento);
  } catch (error) {
    console.error("Erro ao buscar carregamento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar carregamento" },
      { status: 500 },
    );
  } finally {
    if (client) await client.close();
  }
}

// PUT - Atualizar carregamento
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let client;
  try {
    const { id } = await params;
    const body = await request.json();

    console.log("Recebendo atualização para carregamento ID:", id);
    console.log("Dados recebidos:", JSON.stringify(body, null, 2));

    const { client: mongoClient, db } = await connectToDatabase();
    client = mongoClient;
    const collection = db.collection(COLLECTION);

    // 1. Buscar o documento existente
    const existingDoc = await collection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingDoc) {
      return NextResponse.json(
        { error: "Carregamento não encontrado" },
        { status: 404 },
      );
    }

    console.log("Documento existente:", JSON.stringify(existingDoc, null, 2));

    // 2. Preparar dados de atualização
    const updateSet: any = {
      updatedAt: new Date(),
    };

    // 3. Campos que podem ser atualizados normalmente
    const camposAtualizaveis = [
      'cidadeDestino',
      'sequenciaCarro',
      'tipoVeiculo',
      'status'
    ];

    camposAtualizaveis.forEach(campo => {
      if (body[campo] !== undefined) {
        updateSet[campo] = body[campo];
      }
    });

    // 4. Campos que precisam de tratamento especial

    // a) Motorista
    if (body.motorista) {
      if (typeof body.motorista === 'string') {
        updateSet['motorista.nome'] = body.motorista;
      } else {
        if (body.motorista.nome !== undefined) {
          updateSet['motorista.nome'] = body.motorista.nome;
        }
        if (body.motorista.cpf !== undefined) {
          updateSet['motorista.cpf'] = body.motorista.cpf;
        }
      }
    }

    // b) Placas - lógica condicional
    if (body.tipoVeiculo || existingDoc.tipoVeiculo) {
      const tipoVeiculo = body.tipoVeiculo || existingDoc.tipoVeiculo;
      
      if (tipoVeiculo === "CARROCERIA") {
        // Atualizar placas para carroceria
        if (body.placas?.cavaloMecanico !== undefined) {
          updateSet['placas.cavaloMecanico'] = body.placas.cavaloMecanico;
          updateSet['placas.placaSimples'] = ""; // Limpar placa simples se for carroceria
        }
        if (body.placas?.bau !== undefined) {
          updateSet['placas.bau'] = body.placas.bau;
        }
      } else {
        // Atualizar placa simples para outros tipos
        if (body.placas?.placaSimples !== undefined) {
          updateSet['placas.placaSimples'] = body.placas.placaSimples;
          updateSet['placas.cavaloMecanico'] = ""; // Limpar campos de carroceria
          updateSet['placas.bau'] = "";
        }
      }
    }

    // c) Lacres
    if (body.lacres) {
      if (body.lacres.traseiro !== undefined) {
        updateSet['lacres.traseiro'] = body.lacres.traseiro;
      }
      if (body.lacres.lateralEsquerdo !== undefined) {
        updateSet['lacres.lateralEsquerdo'] = body.lacres.lateralEsquerdo;
      }
      if (body.lacres.lateralDireito !== undefined) {
        updateSet['lacres.lateralDireito'] = body.lacres.lateralDireito;
      }
    }

    // d) Cargas
    if (body.cargas) {
      if (body.cargas.gaiolas !== undefined) {
        updateSet['cargas.gaiolas'] = Number(body.cargas.gaiolas) || 0;
      }
      if (body.cargas.volumosos !== undefined) {
        updateSet['cargas.volumosos'] = Number(body.cargas.volumosos) || 0;
      }
      if (body.cargas.mangaPallets !== undefined) {
        updateSet['cargas.mangaPallets'] = Number(body.cargas.mangaPallets) || 0;
      }
    }

    // e) Horários - NÃO permitir atualizar encostouDoca, apenas preencher os outros se estiverem vazios
    if (body.horarios) {
      if (body.horarios.inicioCarregamento && !existingDoc.horarios?.inicioCarregamento) {
        updateSet['horarios.inicioCarregamento'] = body.horarios.inicioCarregamento;
      }

      if (body.horarios.fimCarregamento && !existingDoc.horarios?.fimCarregamento) {
        updateSet['horarios.fimCarregamento'] = body.horarios.fimCarregamento;
      }

      if (body.horarios.liberacao && !existingDoc.horarios?.liberacao) {
        updateSet['horarios.liberacao'] = body.horarios.liberacao;
        updateSet.status = "liberada";
      }
    }

    console.log("Dados que serão atualizados:", JSON.stringify(updateSet, null, 2));

    // 5. Executar a atualização
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateSet },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Carregamento não encontrado" },
        { status: 404 },
      );
    }

    // 6. Buscar o documento atualizado
    const carregamentoAtualizado = await collection.findOne({
      _id: new ObjectId(id),
    });

    console.log("Carregamento atualizado com sucesso");

    return NextResponse.json({
      success: true,
      message: "Carregamento atualizado com sucesso",
      data: carregamentoAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar carregamento:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao atualizar carregamento",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  } finally {
    if (client) await client.close();
  }
}