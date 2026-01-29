// app/api/operacao/previa/route.ts
// API para buscar e salvar prévia operacional

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

// ============================================
// INTERFACE DA PRÉVIA
// ============================================
interface PreviaOperacao {
  _id?: ObjectId;
  turno: "SBA02" | "SBA04";
  totalVeiculos: number;
  data: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

// ============================================
// GET: Buscar prévia existente
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const turno = searchParams.get('turno') as "SBA02" | "SBA04" | null;
    
    // Validação do turno
    if (!turno || (turno !== "SBA02" && turno !== "SBA04")) {
      return NextResponse.json({
        success: false,
        message: 'Turno inválido. Use SBA02 ou SBA04'
      }, { status: 400 });
    }
    
    // Conectar ao MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'brj_transportes');
    
    // Preparar datas para o dia atual
    const agora = new Date();
    const hojeInicio = new Date(agora);
    hojeInicio.setHours(0, 0, 0, 0);
    
    const hojeFim = new Date(agora);
    hojeFim.setHours(23, 59, 59, 999);
    
    // Buscar prévia existente
    const previa = await db.collection<PreviaOperacao>('previaOperacao').findOne({
      turno,
      data: {
        $gte: hojeInicio,
        $lte: hojeFim
      }
    });
    
    if (previa) {
      return NextResponse.json({
        success: true,
        existe: true,
        turno: previa.turno,
        totalVeiculos: previa.totalVeiculos,
        data: previa.data,
        criadoEm: previa.criadoEm,
        atualizadoEm: previa.atualizadoEm
      });
    }
    
    // Não encontrou prévia
    return NextResponse.json({
      success: true,
      existe: false,
      turno,
      message: 'Nenhuma previsão encontrada para este turno hoje'
    });
    
  } catch (error: any) {
    console.error('Erro ao buscar prévia:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar previsão',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// ============================================
// POST: Criar ou atualizar prévia
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { turno, totalVeiculos } = body;
    
    // Validações
    if (!turno || (turno !== "SBA02" && turno !== "SBA04")) {
      return NextResponse.json({
        success: false,
        message: 'Turno inválido. Use SBA02 ou SBA04'
      }, { status: 400 });
    }
    
    if (!totalVeiculos || totalVeiculos <= 0 || totalVeiculos > 100) {
      return NextResponse.json({
        success: false,
        message: 'Quantidade de veículos inválida. Use um valor entre 1 e 100'
      }, { status: 400 });
    }
    
    // Conectar ao MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'brj_transportes');
    
    const agora = new Date();
    const hojeInicio = new Date(agora);
    hojeInicio.setHours(0, 0, 0, 0);
    
    const hojeFim = new Date(agora);
    hojeFim.setHours(23, 59, 59, 999);
    
    // Verificar se já existe prévia para hoje
    const previaExistente = await db.collection<PreviaOperacao>('previaOperacao').findOne({
      turno,
      data: {
        $gte: hojeInicio,
        $lte: hojeFim
      }
    });
    
    let result;
    let operacao: string;
    
    if (previaExistente) {
      // Atualizar prévia existente
      result = await db.collection<PreviaOperacao>('previaOperacao').updateOne(
        { _id: previaExistente._id },
        {
          $set: {
            totalVeiculos,
            atualizadoEm: agora
          }
        }
      );
      operacao = 'atualizada';
    } else {
      // Criar nova prévia
      const novaPrevia: PreviaOperacao = {
        turno,
        totalVeiculos,
        data: hojeInicio, // Data sem hora (00:00:00)
        criadoEm: agora,
        atualizadoEm: agora
      };
      
      result = await db.collection<PreviaOperacao>('previaOperacao').insertOne(novaPrevia);
      operacao = 'criada';
    }
    
    if (result.acknowledged) {
      return NextResponse.json({
        success: true,
        message: `Previsão ${operacao} com sucesso`,
        data: {
          turno,
          totalVeiculos,
          operacao,
          timestamp: agora.toISOString()
        }
      });
    }
    
    throw new Error('Operação não reconhecida pelo banco de dados');
    
  } catch (error: any) {
    console.error('Erro ao salvar prévia:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao salvar previsão',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// ============================================
// DELETE: Remover prévia (opcional)
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const turno = searchParams.get('turno') as "SBA02" | "SBA04" | null;
    
    if (!turno || (turno !== "SBA02" && turno !== "SBA04")) {
      return NextResponse.json({
        success: false,
        message: 'Turno inválido'
      }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'brj_transportes');
    
    const agora = new Date();
    const hojeInicio = new Date(agora);
    hojeInicio.setHours(0, 0, 0, 0);
    
    const hojeFim = new Date(agora);
    hojeFim.setHours(23, 59, 59, 999);
    
    const result = await db.collection<PreviaOperacao>('previaOperacao').deleteOne({
      turno,
      data: {
        $gte: hojeInicio,
        $lte: hojeFim
      }
    });
    
    if (result.deletedCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'Previsão removida com sucesso'
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Nenhuma previsão encontrada para remover'
    }, { status: 404 });
    
  } catch (error: any) {
    console.error('Erro ao remover prévia:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao remover previsão',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
