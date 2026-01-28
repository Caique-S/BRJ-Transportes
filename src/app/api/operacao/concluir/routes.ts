// app/api/operacao/concluir/route.ts
import { NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { carregamentoId } = await request.json();
    
    if (!carregamentoId) {
      return NextResponse.json({
        success: false,
        message: 'ID do carregamento é obrigatório'
      }, { status: 400 });
    }
    
    const db = await getDatabase();
    const carregamentosCollection = db.collection('carregamentos');
    
    const agora = new Date();
    
    // Primeiro, buscar o carregamento atual para pegar o histórico existente
    const carregamentoAtual = await carregamentosCollection.findOne({
      _id: new ObjectId(carregamentoId)
    });
    
    if (!carregamentoAtual) {
      return NextResponse.json({
        success: false,
        message: 'Carregamento não encontrado'
      }, { status: 404 });
    }
    
    // Criar novo array de histórico (forma mais simples e segura)
    const novoHistorico = [
      ...(carregamentoAtual.progresso?.historico || []),
      {
        porcentagem: 100,
        status: 'liberado',
        timestamp: agora,
        descricao: 'Carregamento concluído e liberado'
      }
    ];
    
    // Atualizar carregamento para concluído
    const result = await carregamentosCollection.updateOne(
      { _id: new ObjectId(carregamentoId) },
      {
        $set: {
          status: 'concluido',
          'progresso.porcentagem': 100,
          'progresso.status': 'liberado',
          'progresso.ultimaAtualizacao': agora,
          'progresso.historico': novoHistorico,
          'timestamps.liberadoEm': agora,
          'timestamps.atualizadoEm': agora
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao atualizar carregamento'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Carregamento marcado como concluído',
      data: { carregamentoId }
    });
    
  } catch (error) {
    console.error('Erro ao concluir carregamento:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao concluir carregamento'
    }, { status: 500 });
  }
}