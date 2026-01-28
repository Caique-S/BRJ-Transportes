import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dia = searchParams.get('dia') || new Date().toISOString().split('T')[0];
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'brj_transportes');

    // Buscar carregamentos do dia
    const carregamentos = await db.collection('carregamentos')
      .find({ 
        "metadata.diaOperacao": dia,
        status: { $ne: "cancelado" }
      })
      .toArray();

    // Calcular estatísticas
    const total = carregamentos.length;
    const concluidos = carregamentos.filter(c => c.status === "concluido").length;
    const emAndamento = carregamentos.filter(c => c.status === "em_andamento").length;
    const pendentes = carregamentos.filter(c => c.status === "pendente").length;
    
    // Calcular porcentagem média de progresso
    const progressoTotal = carregamentos.reduce((sum, c) => sum + (c.progresso?.porcentagem || 0), 0);
    const progressoMedio = total > 0 ? progressoTotal / total : 0;

    // Agrupar por doca
    const porDoca = carregamentos.reduce((acc, c) => {
      if (!acc[c.doca]) {
        acc[c.doca] = { total: 0, concluidos: 0, progressoMedio: 0 };
      }
      acc[c.doca].total++;
      if (c.status === "concluido") acc[c.doca].concluidos++;
      acc[c.doca].progressoMedio += c.progresso?.porcentagem || 0;
      return acc;
    }, {} as Record<number, { total: number; concluidos: number; progressoMedio: number }>);

    // Calcular progresso médio por doca
    Object.keys(porDoca).forEach(doca => {
      const numDoca = parseInt(doca);
      if (porDoca[numDoca].total > 0) {
        porDoca[numDoca].progressoMedio = porDoca[numDoca].progressoMedio / porDoca[numDoca].total;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        dia,
        total,
        concluidos,
        emAndamento,
        pendentes,
        progressoMedio: Math.round(progressoMedio),
        porDoca,
        timeline: carregamentos
          .filter(c => c.timestamps?.criadoEm)
          .map(c => ({
            id: c._id.toString(),
            doca: c.doca,
            sequencia: c.sequenciaCarro,
            motorista: c.motorista.nome,
            status: c.status,
            progresso: c.progresso?.porcentagem || 0,
            criadoEm: c.timestamps.criadoEm,
            atualizadoEm: c.timestamps.atualizadoEm
          }))
          .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}