import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'brj_transportes';
const COLLECTION = 'carregamentos';

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  return { client, db };
}

// Função para obter data/hora atual no Brasil (UTC-3)
function getBrasilDateTime() {
  const now = new Date();
  // Ajustar para UTC-3 (Brasília)
  const brasilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  return brasilTime;
}

// GET - Listar todos os carregamentos
export async function GET() {
  let client;
  try {
    const { client: mongoClient, db } = await connectToDatabase();
    client = mongoClient;

    const collection = db.collection(COLLECTION);
    const carregamentos = await collection.find({}).sort({ doca: 1 }).toArray();

    return NextResponse.json(carregamentos, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erro na API de carregamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dados de carregamentos' },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}

// POST - Criar novo carregamento
export async function POST(request: Request) {
  let client;
  try {
    const body = await request.json();

    console.log('Recebendo dados para criar carregamento:', body);

    // Validar campos obrigatórios
    if (!body.doca) {
      return NextResponse.json(
        {
          success: false,
          error: 'Número da Doca é obrigatório.'
        },
        { status: 400 }
      );
    }

    if (!body.cidadeDestino) {
      return NextResponse.json(
        {
          success: false,
          error: 'A Cidade de destino é obrigatória.'
        },
        { status: 400 }
      );
    }

    if (!body.motorista || (typeof body.motorista === 'object' && !body.motorista.nome)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome do motorista é obrigatório'
        },
        { status: 400 }
      );
    }

    const { client: mongoClient, db } = await connectToDatabase();
    client = mongoClient;
    const collection = db.collection(COLLECTION);

    // Verificar se a doca já está em uso
    const docaEmUso = await collection.findOne({
      doca: Number(body.doca),
      status: "em_uso"
    });

    if (docaEmUso) {
      return NextResponse.json(
        {
          success: false,
          error: `Doca ${body.doca} já está em uso por ${docaEmUso.motorista.nome}`
        },
        { status: 400 }
      );
    }

    // Preparar dados para inserção
    const now = getBrasilDateTime();
    const horaAtual = now.toLocaleTimeString('pt-BR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    // Lógica condicional para placas
    let placas;
    if (body.tipoVeiculo === "CARROCERIA") {
      placas = {
        placaSimples: "",
        cavaloMecanico: body.placas?.cavaloMecanico || body.placaVeiculo || "",
        bau: body.placas?.bau || ""
      };
    } else {
      placas = {
        placaSimples: body.placas?.placaSimples || body.placaVeiculo || "",
        cavaloMecanico: "",
        bau: ""
      };
    }

    const novoCarregamento = {
      doca: Number(body.doca),
      cidadeDestino: body.cidadeDestino,
      sequenciaCarro: body.sequenciaCarro || 0,
      motorista: {
        nome: typeof body.motorista === 'string' ? body.motorista : body.motorista.nome || "",
        cpf: typeof body.motorista === 'string' ? "" : body.motorista.cpf || ""
      },
      tipoVeiculo: body.tipoVeiculo || "3/4",
      placas: placas,
      horarios: {
        encostouDoca: horaAtual,
        inicioCarregamento: body.horarios?.inicioCarregamento || "",
        fimCarregamento: body.horarios?.fimCarregamento || "",
        liberacao: body.horarios?.liberacao || ""
      },
      lacres: {
        traseiro: body.lacres?.traseiro || "",
        lateralEsquerdo: body.lacres?.lateralEsquerdo || "",
        lateralDireito: body.lacres?.lateralDireito || ""
      },
      cargas: {
        gaiolas: Number(body.cargas?.gaiolas || body.gaiolas || 0),
        volumosos: Number(body.cargas?.volumosos || body.volumosos || 0),
        mangaPallets: Number(body.cargas?.mangaPallets || body.mangaPallets || 0)
      },
      status: "em_uso",
      createdAt: now,
      updatedAt: now
    };

    console.log('Inserindo no MongoDB:', novoCarregamento);

    // Inserir no MongoDB
    const result = await collection.insertOne(novoCarregamento);

    console.log('Carregamento criado no MongoDB:', result.insertedId);

    // Buscar o documento inserido para retornar com _id
    const carregamentoInserido = await collection.findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'Carregamento criado com sucesso',
      data: carregamentoInserido
    }, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Erro ao criar carregamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar a solicitação',
        details: error instanceof Error ? error.message : String(error)
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } finally {
    if (client) await client.close();
  }
}