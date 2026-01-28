import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { Carregamento, CarregamentoInput } from '../../lib/models/carregamento';

export async function POST(request: NextRequest) {
  try {
    const data: CarregamentoInput = await request.json();
    const now = new Date();
    const diaOperacao = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Determinar turno baseado na hora
    const hora = now.getHours();
    let turno: "SBA04" | "SBA02"  = "SBA04";
    if (hora >= 12 && hora < 23) turno = "SBA04";
    if (hora >= 1 || hora < 12) turno = "SBA02";

    // Validações básicas (mantenha suas validações existentes)
    const errors: string[] = [];
    
    if (!data.doca || data.doca < 1 || data.doca > 20) {
      errors.push('Doca inválida (1-20)');
    }
    
    if (!data.cidadeDestino || data.cidadeDestino.trim() === '') {
      errors.push('Cidade de destino é obrigatória');
    }
    
    if (!data.motorista?.nome || data.motorista.nome.trim() === '') {
      errors.push('Nome do motorista é obrigatório');
    }
    
    // Validação específica por tipo de veículo
    if (data.tipoVeiculo === 'CARROCERIA') {
      if (!data.placas?.cavaloMecanico || !data.placas?.bau) {
        errors.push('Para carroceria, informe cavalo mecânico e baú');
      }
    } else {
      // Para 3/4, TOCO, TRUCK
      if (!data.placas?.placaSimples) {
        errors.push(`Informe a placa do ${data.tipoVeiculo}`);
      }
    }
    
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Dados inválidos',
        errors
      }, { status: 400 });
    }

    // Criar carregamento completo com progresso e timestamps
    const carregamento: Omit<Carregamento, '_id'> = {
      ...data,
      
      // NOVO: Progresso inicial
      progresso: {
        porcentagem: 0,
        status: "na_fila",
        ultimaAtualizacao: now,
        historico: [{
          porcentagem: 0,
          status: "na_fila",
          timestamp: now,
          descricao: "Carregamento cadastrado na fila"
        }]
      },
      
      status: 'pendente',
      
      // NOVO: Timestamps detalhados
      timestamps: {
        criadoEm: now,
        atualizadoEm: now
        // encostouEm, inicioCarregamentoEm, etc serão preenchidos depois
      },
      
      // NOVO: Metadata
      metadata: {
        diaOperacao,
        turno,
        operador: "sistema" // Você pode pegar do usuário logado depois
      },
      
      observacoes: data.observacoes || ""
    };

    // Conectar e salvar
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'brj_transportes');
    
    const result = await db.collection<Carregamento>('carregamentos').insertOne(carregamento);

    return NextResponse.json({
      success: true,
      message: 'Carregamento salvo com sucesso',
      data: {
        id: result.insertedId.toString(),
        ...carregamento,
        timestamps: {
          ...carregamento.timestamps,
          criadoEm: carregamento.timestamps.criadoEm.toISOString(),
          atualizadoEm: carregamento.timestamps.atualizadoEm.toISOString()
        },
        progresso: {
          ...carregamento.progresso,
          ultimaAtualizacao: carregamento.progresso.ultimaAtualizacao.toISOString(),
          historico: carregamento.progresso.historico.map(h => ({
            ...h,
            timestamp: h.timestamp.toISOString()
          }))
        }
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao salvar carregamento:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}