// app/api/operacao/progresso/route.ts
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';

export async function GET() {
  try {
    // Conectar ao MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'brj_transportes');
    
    // 1. Determinar turno atual baseado na hora
    const agora = new Date();
    const horaAtual = agora.getHours();
    
    let turnoAtual: "SBA02" | "SBA04" = "SBA02";
    
    // Baseado na sua lógica: SBA02 (1h-12h), SBA04 (12h-23h)
    if (horaAtual >= 12 && horaAtual < 23) {
      turnoAtual = "SBA04";
    } else if (horaAtual >= 1 && horaAtual < 12) {
      turnoAtual = "SBA02";
    }
    
    console.log(`📊 Buscando progresso para turno: ${turnoAtual} (hora: ${horaAtual})`);
    
    // 2. Preparar datas para o dia atual
    const hojeInicio = new Date(agora);
    hojeInicio.setHours(0, 0, 0, 0);
    
    const hojeFim = new Date(agora);
    hojeFim.setHours(23, 59, 59, 999);
    
    const diaOperacao = agora.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 3. Buscar prévia da operação do turno atual
    const previaCollection = db.collection('previaOperacao');
    const previa = await previaCollection.findOne({
      turno: turnoAtual,
      data: {
        $gte: hojeInicio,
        $lte: hojeFim
      }
    });
    
    console.log(`📋 Previa encontrada:`, previa);
    
    // 4. Buscar carregamentos concluídos hoje neste turno
    const carregamentosCollection = db.collection('carregamentos');
    
    // Query para carregamentos concluídos/liberados
    const carregamentosConcluidos = await carregamentosCollection.countDocuments({
      $and: [
        { 'metadata.turno': turnoAtual },
        { 
          'metadata.diaOperacao': diaOperacao
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
    
    console.log(`🚚 Carregamentos concluídos: ${carregamentosConcluidos}`);
    
    // 5. Se não houver previsão, estimar
    let totalPrevisto = previa?.totalVeiculos || 0;
    
    if (totalPrevisto === 0) {
      // Estimar baseado no total de carregamentos do turno hoje
      const totalCarregamentosTurno = await carregamentosCollection.countDocuments({
        'metadata.turno': turnoAtual,
        'metadata.diaOperacao': diaOperacao
      });
      
      console.log(`📈 Total carregamentos no turno: ${totalCarregamentosTurno}`);
      
      // Estimativa: mínimo 10, ou total atual + 5
      if (totalCarregamentosTurno > 0) {
        totalPrevisto = Math.max(totalCarregamentosTurno + 5, 10);
      } else {
        totalPrevisto = 15; // Valor padrão
      }
    }
    
    // 6. Calcular percentual
    const percentualConclusao = totalPrevisto > 0 
      ? Math.round((carregamentosConcluidos / totalPrevisto) * 100)
      : 0;
    
    const percentualFinal = Math.min(percentualConclusao, 100);
    const pendentes = Math.max(0, totalPrevisto - carregamentosConcluidos);
    
    console.log(`📊 Resultado: ${carregamentosConcluidos}/${totalPrevisto} = ${percentualFinal}%`);
    
    // 7. Retornar dados
    return NextResponse.json({
      totalPrevisto,
      concluidos: carregamentosConcluidos,
      turno: turnoAtual,
      ultimaAtualizacao: agora,
      percentualConclusao: percentualFinal,
      pendentes,
      debug: process.env.NODE_ENV === 'development' ? {
        query: {
          turno: turnoAtual,
          diaOperacao,
          horaAtual
        }
      } : undefined
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar progresso da operação:', error);
    
    // Retornar valores padrão em caso de erro
    const agora = new Date();
    const horaAtual = agora.getHours();
    const turnoAtual = (horaAtual >= 12 && horaAtual < 23) ? "SBA04" : "SBA02";
    
    return NextResponse.json({
      totalPrevisto: 15,
      concluidos: 0,
      turno: turnoAtual,
      ultimaAtualizacao: agora,
      percentualConclusao: 0,
      pendentes: 15,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 200 });
  }
}