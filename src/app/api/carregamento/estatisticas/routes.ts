// app/api/carregamento/estatisticas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dia = searchParams.get('dia') || new Date().toISOString().split('T')[0];
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'brj_transportes');

    // Determinar turno atual
    const agora = new Date();
    const horaAtual = agora.getHours();
    let turnoAtual: "SBA02" | "SBA04" = "SBA02";
    if (horaAtual >= 12 && horaAtual < 23) {
      turnoAtual = "SBA04";
    }

    // Buscar carregamentos do dia
    const carregamentos = await db.collection('carregamentos')
      .find({ 
        "metadata.diaOperacao": dia,
        status: { $ne: "cancelado" }
      })
      .toArray();

    // Estatísticas gerais
    const total = carregamentos.length;
    const concluidos = carregamentos.filter(c => c.status === "concluido" && c.metadata?.finalizadoComBotao === true).length;
    const emAndamento = carregamentos.filter(c => c.status === "em_andamento").length;
    const pendentes = carregamentos.filter(c => c.status === "pendente").length;
    
    // Estatísticas por progresso
    const naFila = carregamentos.filter(c => c.progresso?.status === "na_fila").length;
    const encostados = carregamentos.filter(c => c.progresso?.status === "encostado").length;
    const carregando = carregamentos.filter(c => c.progresso?.status === "carregando").length;
    const finalizados = carregamentos.filter(c => c.progresso?.status === "finalizado").length;
    const liberados = carregamentos.filter(c => c.progresso?.status === "liberado").length;

    // Agrupar por cidade
    const porCidade = carregamentos.reduce((acc: any, c) => {
      const cidade = c.cidadeDestino;
      if (!acc[cidade]) {
        acc[cidade] = {
          nome: cidade,
          quantidade: 0,
          estado: "BA", // Pode ser extraído do nome da cidade
          tipoCarga: [] as string[]
        };
      }
      acc[cidade].quantidade++;
      
      // Adicionar tipos de carga
      if (c.cargas?.gaiolas > 0 && !acc[cidade].tipoCarga.includes("Gaiolas")) {
        acc[cidade].tipoCarga.push("Gaiolas");
      }
      if (c.cargas?.volumosos > 0 && !acc[cidade].tipoCarga.includes("Volumosos")) {
        acc[cidade].tipoCarga.push("Volumosos");
      }
      if (c.cargas?.mangaPallets > 0 && !acc[cidade].tipoCarga.includes("Manga Palets")) {
        acc[cidade].tipoCarga.push("Manga Palets");
      }
      
      return acc;
    }, {});

    // Converter para array e calcular percentuais
    const cidadesArray = Object.values(porCidade).map((c: any) => ({
      ...c,
      percentual: total > 0 ? Math.round((c.quantidade / total) * 100 * 10) / 10 : 0
    })).sort((a: any, b: any) => b.quantidade - a.quantidade);

    // Buscar prévia do turno
    const hojeInicio = new Date(agora);
    hojeInicio.setHours(0, 0, 0, 0);
    const hojeFim = new Date(agora);
    hojeFim.setHours(23, 59, 59, 999);

    const previa = await db.collection('previaOperacao').findOne({
      turno: turnoAtual,
      data: {
        $gte: hojeInicio,
        $lte: hojeFim
      }
    });

    // Carregamentos ativos para a tabela
    const carregamentosAtivos = carregamentos
      .filter(c => c.status !== "cancelado")
      .slice(0, 10)
      .map(c => ({
        id: c._id.toString(),
        placa: c.placas?.placaSimples || c.placas?.cavaloMecanico || "N/A",
        status: c.progresso?.status === "liberado" ? "completo" : 
                c.progresso?.status === "carregando" || c.progresso?.status === "finalizado" ? "andamento" : "aguardando",
        cidadeOrigem: "Feira De Santana", // Pode vir de config
        cidadeDestino: c.cidadeDestino,
        tipoVeiculo: c.tipoVeiculo,
        carga: [
          c.cargas?.gaiolas > 0 ? "Gaiolas" : null,
          c.cargas?.volumosos > 0 ? "Volumosos" : null,
          c.cargas?.mangaPallets > 0 ? "Manga Palets" : null
        ].filter(Boolean).join(", ") || "N/A",
        horaEntrada: c.timestamps?.criadoEm ? new Date(c.timestamps.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "--:--",
        tempoEspera: calcularTempoEspera(c.timestamps?.criadoEm)
      }));

    // Calcular tempo médio de operação
    const temposOperacao = carregamentos
      .filter(c => c.timestamps?.criadoEm && c.timestamps?.liberadoEm)
      .map(c => {
        const inicio = new Date(c.timestamps.criadoEm).getTime();
        const fim = new Date(c.timestamps.liberadoEm).getTime();
        return (fim - inicio) / (1000 * 60); // em minutos
      });
    
    const tempoMedioMinutos = temposOperacao.length > 0 
      ? Math.round(temposOperacao.reduce((a, b) => a + b, 0) / temposOperacao.length)
      : 0;
    
    const tempoMedioHoras = Math.floor(tempoMedioMinutos / 60);
    const tempoMedioResto = tempoMedioMinutos % 60;

    return NextResponse.json({
      success: true,
      data: {
        dia,
        turno: turnoAtual,
        totalPrevisto: previa?.totalVeiculos || 0,
        estatisticas: {
          total,
          concluidos,
          emAndamento,
          pendentes,
          naFila,
          encostados,
          carregando,
          finalizados,
          liberados
        },
        cidades: cidadesArray,
        carregamentos: carregamentosAtivos,
        tempoMedio: {
          minutos: tempoMedioMinutos,
          formatado: temposOperacao.length > 0 
            ? `${tempoMedioHoras}h ${tempoMedioResto}m`
            : "N/A"
        },
        cidadeMaiorVolume: cidadesArray[0] || null
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Função auxiliar para calcular tempo de espera
function calcularTempoEspera(criadoEm: any): string {
  if (!criadoEm) return "N/A";
  
  const agora = new Date().getTime();
  const criado = new Date(criadoEm).getTime();
  const diffMs = agora - criado;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHoras = Math.floor(diffMin / 60);
  const minRestantes = diffMin % 60;
  
  if (diffHoras > 0) {
    return `${diffHoras}h ${minRestantes}m`;
  }
  return `${diffMin}m`;
}
