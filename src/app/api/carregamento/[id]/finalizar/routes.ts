import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

// app/api/carregamento/[id]/finalizar/route.ts
export async function POST(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const now = new Date();
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'brj_transportes');
    
    // Buscar carregamento
    const carregamento = await db.collection('carregamentos').findOne({ 
      _id: new ObjectId(id) 
    });
    
    if (!carregamento) {
      return NextResponse.json({ 
        success: false, 
        message: 'Carregamento não encontrado' 
      }, { status: 404 });
    }
    
    const horarios = carregamento.horarios || {};
    const camposObrigatorios = ['encostouDoca', 'inicioCarregamento', 'fimCarregamento', 'liberacao'];
    const todosPreenchidos = camposObrigatorios.every(campo => 
      horarios[campo] && horarios[campo].trim() !== ''
    );
    
    if (!todosPreenchidos) {
      const horariosFaltando = camposObrigatorios.filter(campo => 
        !horarios[campo] || horarios[campo].trim() === ''
      );
      
      return NextResponse.json({
        success: false,
        message: 'Todos os horários devem estar preenchidos para finalizar',
        horariosFaltando
      }, { status: 400 });
    }
    
    const historicoAtual = Array.isArray(carregamento.progresso?.historico) 
      ? carregamento.progresso.historico 
      : [];
    
    const novoHistoricoItem = {
      porcentagem: 100,
      status: 'liberado',
      timestamp: now,
      descricao: 'Carregamento finalizado com botão - Veículo liberado para viagem'
    };
    
    const historicoAtualizado = [...historicoAtual, novoHistoricoItem];
    
    const result = await db.collection('carregamentos').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'concluido',
          'progresso.porcentagem': 100,
          'progresso.status': 'liberado',
          'progresso.ultimaAtualizacao': now,
          'progresso.historico': historicoAtualizado, // ← histórico atualizado
          'metadata.finalizadoComBotao': true,
          'timestamps.liberadoEm': now,
          'timestamps.atualizadoEm': now,
          updatedAt: now // Se seu modelo tiver este campo
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum documento foi atualizado'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Carregamento finalizado e liberado para viagem',
      data: { 
        id,
        status: 'concluido',
        finalizadoComBotao: true,
        atualizadoEm: now.toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('Erro ao finalizar carregamento:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao finalizar carregamento',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}