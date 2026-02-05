import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'brj_transportes';
const COLLECTION = 'carregamentos';

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  return { client, db };
}

// Função para calcular diferença de tempo
function calcularDiferencaHoras(inicio: string, fim: string): string {
  if (!inicio || !fim) return "00:00";
  
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fim.split(':').map(Number);
  
  const inicioMinutos = h1 * 60 + m1;
  const fimMinutos = h2 * 60 + m2;
  
  if (fimMinutos < inicioMinutos) return "00:00";
  
  const diferencaMinutos = fimMinutos - inicioMinutos;
  const horas = Math.floor(diferencaMinutos / 60);
  const minutos = diferencaMinutos % 60;
  
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
}

function calcularTempoMedio(docas: any[]): string {
  const docasEmUso = docas.filter(d => d.status === "em_uso" && d.horarios?.encostouDoca);
  
  if (docasEmUso.length === 0) return "00:00";
  
  let totalMinutos = 0;
  const agora = new Date();
  const horaAtual = agora.getHours();
  const minutoAtual = agora.getMinutes();
  
  docasEmUso.forEach(doca => {
    if (doca.horarios?.encostouDoca) {
      const [h, m] = doca.horarios.encostouDoca.split(':').map(Number);
      const inicioMinutos = h * 60 + m;
      const atualMinutos = horaAtual * 60 + minutoAtual;
      
      if (atualMinutos > inicioMinutos) {
        totalMinutos += (atualMinutos - inicioMinutos);
      }
    }
  });
  
  const mediaMinutos = Math.floor(totalMinutos / docasEmUso.length);
  const horas = Math.floor(mediaMinutos / 60);
  const minutos = mediaMinutos % 60;
  
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
}

function calcularEficiencia(docas: any[]): number {
  const docasLiberadas = docas.filter(d => d.status === "liberada");
  const docasEmUso = docas.filter(d => d.status === "em_uso");
  
  if (docasLiberadas.length + docasEmUso.length === 0) return 0;
  
  const totalProcessadas = docasLiberadas.length + docasEmUso.length;
  const eficiencia = (docasLiberadas.length / totalProcessadas) * 100;
  
  return Math.min(Math.round(eficiencia), 100);
}

export async function GET(request: Request) {
  let client;
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    const { client: mongoClient, db } = await connectToDatabase();
    client = mongoClient;
    
    const collection = db.collection(COLLECTION);
    
    // Construir query com filtro de data
    const query: any = {};
    
    if (date) {
      // Criar data no fuso horário do Brasil (UTC-3)
      const startDate = new Date(date + 'T00:00:00-03:00');
      const endDate = new Date(date + 'T23:59:59.999-03:00');
      
      console.log('Filtrando por data:', {
        date,
        startDate,
        endDate,
        startDateISO: startDate.toISOString(),
        endDateISO: endDate.toISOString()
      });
      
      query.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    } else {
      // Se não há data especificada, buscar registros do dia atual (Brasil)
      const hoje = new Date();
      const hojeBrasil = new Date(hoje.getTime() - (3 * 60 * 60 * 1000));
      const startDate = new Date(hojeBrasil.setHours(0, 0, 0, 0));
      const endDate = new Date(hojeBrasil.setHours(23, 59, 59, 999));
      
      query.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    console.log('Query MongoDB:', JSON.stringify(query));
    
    const carregamentos = await collection.find(query).sort({ doca: 1 }).toArray();
    
    console.log(`Encontrados ${carregamentos.length} carregamentos`);
  
    // Transformar dados para o formato do dashboard
    const todasDocas = carregamentos.map((item) => {
      let status: "ocupada" | "liberada" | "disponivel" = "disponivel";
  
      if (item.status === "em_uso") {
        status = "ocupada";
      } else if (item.status === "liberada") {
        status = "liberada";
      }
      
      let tempoTotal = "";
      if (item.horarios?.encostouDoca && item.horarios?.liberacao) {
        tempoTotal = calcularDiferencaHoras(item.horarios.encostouDoca, item.horarios.liberacao);
      }
      
      // Determinar qual placa mostrar
      let placaExibicao = "";
      if (item.tipoVeiculo === "CARROCERIA") {
        placaExibicao = item.placas?.cavaloMecanico || "";
        if (item.placas?.bau) {
          placaExibicao += ` / ${item.placas.bau}`;
        }
      } else {
        placaExibicao = item.placas?.placaSimples || "";
      }
      
      return {
        id: item.doca,
        doca: item.doca,
        status,
        motorista: item.motorista?.nome || "N/A",
        cidadeDestino: item.cidadeDestino,
        placaVeiculo: placaExibicao,
        tipoVeiculo: item.tipoVeiculo,
        placas: item.placas,
        horarioEntrada: item.horarios?.encostouDoca,
        horarioSaida: item.horarios?.liberacao,
        tempoTotal,
        carga: {
          gaiolas: item.cargas?.gaiolas || 0,
          volumosos: item.cargas?.volumosos || 0,
          mangaPallets: item.cargas?.mangaPallets || 0,
        },
        sequenciaCarro: item.sequenciaCarro,
        horarios: item.horarios,
        lacres: item.lacres,
        _id: item._id.toString(),
        createdAt: item.createdAt,
      };
    });
    
    // Calcular estatísticas
    const stats = {
      docasEmUso: todasDocas.filter((d) => d.status === "ocupada").length,
      rotasLiberadas: todasDocas.filter((d) => d.status === "liberada").length,
      docasDisponiveis: Math.max(0, 20 - todasDocas.filter((d) => d.status === "ocupada").length),
      tempoMedio: calcularTempoMedio(carregamentos),
      eficiencia: calcularEficiencia(carregamentos),
      cargaTotal: {
        gaiolas: todasDocas.reduce((sum, d) => sum + (d.carga?.gaiolas || 0), 0),
        volumosos: todasDocas.reduce((sum, d) => sum + (d.carga?.volumosos || 0), 0),
        mangaPallets: todasDocas.reduce((sum, d) => sum + (d.carga?.mangaPallets || 0), 0),
      },
    };
    
    return NextResponse.json({
      stats,
      todasDocas,
      timestamp: new Date().toISOString(),
      totalRegistros: carregamentos.length,
      success: true,
      queryDate: query.createdAt,
    });
    
  } catch (error) {
    console.error('Erro na API do dashboard:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao carregar dados do dashboard',
        success: false,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}