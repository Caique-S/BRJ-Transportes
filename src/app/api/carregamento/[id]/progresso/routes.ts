import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../../lib/mongodb';

interface ProgressoUpdate {
  porcentagem: number;
  status: "na_fila" | "encostado" | "carregando" | "finalizado" | "liberado";
  descricao?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data: ProgressoUpdate = await request.json();
    const now = new Date();

    // Validar porcentagem
    if (data.porcentagem < 0 || data.porcentagem > 100) {
      return NextResponse.json({
        success: false,
        message: 'Porcentagem deve estar entre 0 e 100'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'brj_transportes');

    // Preparar item do histórico
    const historicoItem = {
      porcentagem: data.porcentagem,
      status: data.status,
      timestamp: now,
      descricao: data.descricao || `Progresso atualizado para ${data.porcentagem}%`
    };

    // Preparar atualização baseada no status
    const updateData: any = {
      $set: { 
        "progresso.porcentagem": data.porcentagem,
        "progresso.status": data.status,
        "progresso.ultimaAtualizacao": now,
        "timestamps.atualizadoEm": now
      },
      $push: {
        "progresso.historico": historicoItem
      }
    };

    // Adicionar timestamps específicos baseado no status
    if (data.status === "encostado") {
      updateData.$set["timestamps.encostouEm"] = now;
    } else if (data.status === "carregando") {
      updateData.$set["timestamps.inicioCarregamentoEm"] = now;
    } else if (data.status === "finalizado") {
      updateData.$set["timestamps.fimCarregamentoEm"] = now;
    } else if (data.status === "liberado") {
      updateData.$set["timestamps.liberadoEm"] = now;
      updateData.$set["status"] = "concluido";
    }

    // Atualizar progresso
    const result = await db.collection('carregamentos').updateOne(
      { _id: new ObjectId(id) },
      updateData
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Carregamento não encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Progresso atualizado com sucesso',
      data: {
        id,
        porcentagem: data.porcentagem,
        status: data.status,
        atualizadoEm: now.toISOString()
      }
    });

  } catch (error: any) {
    console.error('Erro ao atualizar progresso:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// GET para obter progresso de um carregamento específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'brj_transportes');

    const carregamento = await db.collection('carregamentos').findOne(
      { _id: new ObjectId(id) },
      { projection: { progresso: 1, timestamps: 1, doca: 1, sequenciaCarro: 1, motorista: 1 } }
    );

    if (!carregamento) {
      return NextResponse.json({
        success: false,
        message: 'Carregamento não encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: carregamento._id.toString(),
        doca: carregamento.doca,
        sequenciaCarro: carregamento.sequenciaCarro,
        motorista: carregamento.motorista,
        progresso: carregamento.progresso,
        timestamps: carregamento.timestamps
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar progresso:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}