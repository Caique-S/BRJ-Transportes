import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../../../lib/mongodb';

interface PreviaOperacao {
  _id?: ObjectId;
  turno: "SBA02" | "SBA04";
  totalVeiculos: number;
  data: Date;
  criadoEm: Date;
}

export async function GET() {
  try {

    const db = await getDatabase();
    
    const agora = new Date();
    const horaAtual = agora.getHours();
    
    let turnoAtual: "SBA02" | "SBA04" = "SBA02";

    if (horaAtual >= 12 && horaAtual < 23) {
      turnoAtual = "SBA04";
    } else if (horaAtual >= 1 && horaAtual < 12) {
      turnoAtual = "SBA02";
    }
    
    const hojeInicio = new Date(agora);
    hojeInicio.setHours(0, 0, 0, 0);
    
    const hojeFim = new Date(agora);
    hojeFim.setHours(23, 59, 59, 999);
        
    const previaCollection = db.collection<PreviaOperacao>('previaOperacao');
    const previa = await previaCollection.findOne({
      turno: turnoAtual,
      data: {
        $gte: hojeInicio,
        $lte: hojeFim
      }
    });
    
    const carregamentosCollection = db.collection('carregamentos');
    
    const carregamentosConcluidos = await carregamentosCollection.countDocuments({
      $and: [
        { 'metadata.turno': turnoAtual },
        { 
          'metadata.diaOperacao': agora.toISOString().split('T')[0]
        },
        { 
          $or: [
            { status: 'concluido' },
            { 
              'progresso.status': 'liberado', 
              'progresso.porcentagem': 100
            }
          ]
        }
      ]
    });
    
    let totalPrevisto = previa?.totalVeiculos || 0;
    
    if (totalPrevisto === 0) {
      const totalCarregamentosTurno = await carregamentosCollection.countDocuments({
        'metadata.turno': turnoAtual,
        'metadata.diaOperacao': agora.toISOString().split('T')[0]
      });
      
      if (totalCarregamentosTurno > 0) {
        totalPrevisto = Math.max(totalCarregamentosTurno + 5, 10);
      } else {
        totalPrevisto = 15;
      }
    }
    
    const percentualConclusao = totalPrevisto > 0 
      ? Math.round((carregamentosConcluidos / totalPrevisto) * 100)
      : 0;
    
    const percentualFinal = Math.min(percentualConclusao, 100);
    
    return NextResponse.json({
      totalPrevisto,
      concluidos: carregamentosConcluidos,
      turno: turnoAtual,
      ultimaAtualizacao: agora,
      percentualConclusao: percentualFinal,
      pendentes: Math.max(0, totalPrevisto - carregamentosConcluidos)
    });
    
  } catch (error) {
    console.error('Erro ao buscar progresso da operação:', error);
    
    const agora = new Date();
    const horaAtual = agora.getHours();
    const turnoAtual = (horaAtual >= 12 && horaAtual < 23) ? "SBA04" : "SBA02";
    
    return NextResponse.json({
      totalPrevisto: 15,
      concluidos: 0,
      turno: turnoAtual,
      ultimaAtualizacao: agora,
      percentualConclusao: 0,
      pendentes: 15
    }, { status: 200 }); 
  }
}