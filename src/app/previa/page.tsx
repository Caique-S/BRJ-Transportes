"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Truck,
  Save,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Sun,
  Moon,
  RefreshCw,
  TrendingUp,
  Users
} from "lucide-react";

// ============================================
// TIPOS E INTERFACES
// ============================================
interface PreviaOperacao {
  _id?: string;
  turno: "SBA02" | "SBA04";
  totalVeiculos: number;
  data: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

interface PreviaExistente {
  turno: "SBA02" | "SBA04";
  totalVeiculos: number;
  existe: boolean;
}

// ============================================
// PÁGINA PRÉVIA OPERACIONAL
// ============================================
export default function PreviaOperacional() {
  const router = useRouter();
  
  // Estados do formulário
  const [turno, setTurno] = useState<"SBA02" | "SBA04">("SBA02");
  const [totalVeiculos, setTotalVeiculos] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuscando, setIsBuscando] = useState(true);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  
  // Estado para prévia existente
  const [previaExistente, setPreviaExistente] = useState<PreviaExistente | null>(null);
  
  // Data atual formatada
  const [dataAtual, setDataAtual] = useState<string>("");
  const [horaAtual, setHoraAtual] = useState<number>(0);

  // ============================================
  // CONEXÃO COM BANCO DE DADOS - INSTRUÇÕES:
  // ============================================
  /* 
    PARA CONECTAR AO BANCO DE DADOS, ESTA PÁGINA PRECISA:
    
    1. API PARA BUSCAR PRÉVIA EXISTENTE:
       - Endpoint: GET /api/operacao/previa?turno=SBA02&data=2024-01-29
       - Retorna: { turno, totalVeiculos, data, existe: boolean }
       - PRECISA CRIAR: app/api/operacao/previa/route.ts
    
    2. API PARA SALVAR/ATUALIZAR PRÉVIA:
       - Endpoint: POST /api/operacao/previa
       - Body: { turno, totalVeiculos }
       - Retorna: { success, message, data }
       - Já existe parcialmente: routes(5).ts (precisa ajustar)
       
    3. MONGODB - COLEÇÃO NECESSÁRIA:
       - previaOperacao: Armazena as previsões de cada turno
       - Schema: { turno, totalVeiculos, data, criadoEm, atualizadoEm }
       
    4. VARIÁVEIS DE AMBIENTE (.env.local):
       - MONGODB_URI=sua_string_de_conexao
       - MONGODB_DB_NAME=brj_transportes
    
    5. ESTRUTURA DA COLEÇÃO previaOperacao:
    {
      _id: ObjectId,
      turno: "SBA02" | "SBA04",
      totalVeiculos: number,
      data: ISODate,  // Data da operação (00:00:00)
      criadoEm: ISODate,
      atualizadoEm: ISODate
    }
  */

  // ============================================
  // EFFECT: Determinar turno baseado na hora
  // ============================================
  useEffect(() => {
    const agora = new Date();
    const hora = agora.getHours();
    
    setHoraAtual(hora);
    setDataAtual(agora.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
    
    // SBA02: 1h-12h | SBA04: 12h-23h
    if (hora >= 12 && hora < 23) {
      setTurno("SBA04");
    } else {
      setTurno("SBA02");
    }
  }, []);

  // ============================================
  // FUNÇÃO: Buscar prévia existente
  // ============================================
  const buscarPreviaExistente = async () => {
    setIsBuscando(true);
    
    try {
      /* 
        CHAMADA API: GET /api/operacao/previa
        
        IMPLEMENTAÇÃO DA API NECESSÁRIA:
        --------------------------------
        // app/api/operacao/previa/route.ts
        
        export async function GET(request: NextRequest) {
          try {
            const { searchParams } = new URL(request.url);
            const turno = searchParams.get('turno');
            
            const client = await clientPromise;
            const db = client.db(process.env.MONGODB_DB_NAME);
            
            const hojeInicio = new Date();
            hojeInicio.setHours(0, 0, 0, 0);
            
            const hojeFim = new Date();
            hojeFim.setHours(23, 59, 59, 999);
            
            const previa = await db.collection('previaOperacao').findOne({
              turno,
              data: { $gte: hojeInicio, $lte: hojeFim }
            });
            
            return NextResponse.json({
              success: true,
              existe: !!previa,
              turno: previa?.turno,
              totalVeiculos: previa?.totalVeiculos,
              data: previa?.data
            });
          } catch (error) {
            return NextResponse.json({ success: false, error: error.message });
          }
        }
      */
      
      const response = await fetch(`/api/operacao/previa?turno=${turno}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.existe && data.totalVeiculos) {
          setPreviaExistente({
            turno: data.turno,
            totalVeiculos: data.totalVeiculos,
            existe: true
          });
          setTotalVeiculos(data.totalVeiculos);
        } else {
          setPreviaExistente(null);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar prévia:", error);
      // Fallback: assume que não existe prévia
      setPreviaExistente(null);
    } finally {
      setIsBuscando(false);
    }
  };

  // ============================================
  // EFFECT: Buscar prévia quando turno muda
  // ============================================
  useEffect(() => {
    if (turno) {
      buscarPreviaExistente();
    }
  }, [turno]);

  // ============================================
  // FUNÇÃO: Salvar prévia operacional
  // ============================================
  const handleSalvar = async () => {
    // Validações
    if (totalVeiculos <= 0) {
      setMensagem({
        tipo: "erro",
        texto: "A quantidade de veículos deve ser maior que zero"
      });
      return;
    }

    if (totalVeiculos > 100) {
      setMensagem({
        tipo: "erro",
        texto: "A quantidade máxima é de 100 veículos por turno"
      });
      return;
    }

    setIsLoading(true);
    setMensagem(null);

    try {
      /* 
        CHAMADA API: POST /api/operacao/previa
        
        Body enviado:
        {
          turno: "SBA02" | "SBA04",
          totalVeiculos: number
        }
        
        IMPLEMENTAÇÃO DA API (routes(5).ts já existe, precisa ajustar):
        ---------------------------------------------------------------
        - Verifica se já existe prévia para o turno hoje
        - Se existe: atualiza (updateOne)
        - Se não existe: cria nova (insertOne)
        - Retorna sucesso com os dados salvos
      */
      
      const response = await fetch('/api/operacao/previa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          turno,
          totalVeiculos
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMensagem({
          tipo: "sucesso",
          texto: previaExistente?.existe 
            ? "Previsão atualizada com sucesso!" 
            : "Previsão criada com sucesso!"
        });
        
        setPreviaExistente({
          turno,
          totalVeiculos,
          existe: true
        });

        // Limpar mensagem após 3 segundos
        setTimeout(() => setMensagem(null), 3000);
      } else {
        throw new Error(data.message || "Erro ao salvar previsão");
      }
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      setMensagem({
        tipo: "erro",
        texto: error.message || "Erro ao salvar previsão. Tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER: Loading inicial
  // ============================================
  if (isBuscando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ============================================
            CABEÇALHO
        ============================================ */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-8 h-8 mr-3 text-blue-600" />
            Prévia Operacional
          </h1>
          <p className="text-gray-600 mt-2">
            Defina a meta de carregamento para o turno
          </p>
        </div>

        {/* ============================================
            CARD DE INFORMAÇÕES
        ============================================ */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Como funciona:</h3>
              <p className="text-blue-800 text-sm mt-1">
                O supervisor define a quantidade total de veículos previstos para o turno. 
                Esta meta será usada para calcular o progresso da operação no dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================
            FORMULÁRIO
        ============================================ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Data Atual */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="font-medium">{dataAtual}</span>
            </div>
          </div>

          {/* Seleção de Turno */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecione o Turno
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTurno("SBA02")}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  turno === "SBA02"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Sun className={`w-8 h-8 mx-auto mb-2 ${
                  turno === "SBA02" ? "text-blue-600" : "text-gray-400"
                }`} />
                <div className={`font-bold ${
                  turno === "SBA02" ? "text-blue-700" : "text-gray-700"
                }`}>
                  SBA02
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  01:00 - 12:00
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Turno Diurno
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTurno("SBA04")}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  turno === "SBA04"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Moon className={`w-8 h-8 mx-auto mb-2 ${
                  turno === "SBA04" ? "text-blue-600" : "text-gray-400"
                }`} />
                <div className={`font-bold ${
                  turno === "SBA04" ? "text-blue-700" : "text-gray-700"
                }`}>
                  SBA04
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  12:00 - 23:00
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Turno Noturno
                </div>
              </button>
            </div>
            
            {/* Indicador de turno atual */}
            <div className="mt-3 text-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                (turno === "SBA02" && (horaAtual >= 1 && horaAtual < 12)) ||
                (turno === "SBA04" && (horaAtual >= 12 && horaAtual < 23))
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {(turno === "SBA02" && (horaAtual >= 1 && horaAtual < 12)) ||
                 (turno === "SBA04" && (horaAtual >= 12 && horaAtual < 23))
                  ? "🟢 Turno em andamento"
                  : "⚪ Turno futuro"}
              </span>
            </div>
          </div>

          {/* Quantidade de Veículos */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quantidade Total de Veículos Previstos
            </label>
            <div className="relative">
              <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="number"
                min="1"
                max="100"
                value={totalVeiculos}
                onChange={(e) => setTotalVeiculos(parseInt(e.target.value) || 0)}
                className="w-full pl-14 pr-4 py-4 text-2xl font-bold text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="30"
              />
            </div>
            
            {/* Slider para facilitar */}
            <input
              type="range"
              min="1"
              max="100"
              value={totalVeiculos}
              onChange={(e) => setTotalVeiculos(parseInt(e.target.value))}
              className="w-full mt-4 accent-blue-600"
            />
            
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>1</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          {/* Resumo da Meta */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Resumo da Meta
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{totalVeiculos}</div>
                <div className="text-sm text-gray-600">Veículos Previstos</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-3xl font-bold text-green-600">{turno}</div>
                <div className="text-sm text-gray-600">Turno Selecionado</div>
              </div>
            </div>
          </div>

          {/* Alerta de Prévia Existente */}
          {previaExistente?.existe && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Atenção!</h3>
                  <p className="text-yellow-800 text-sm mt-1">
                    Já existe uma previsão de <strong>{previaExistente.totalVeiculos} veículos</strong> para o turno {previaExistente.turno} hoje.
                    <br />
                    Ao salvar, você irá <strong>atualizar</strong> esta previsão.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mensagem de Sucesso/Erro */}
          {mensagem && (
            <div className={`mb-6 p-4 rounded-lg ${
              mensagem.tipo === "sucesso"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}>
              <div className="flex items-center">
                {mensagem.tipo === "sucesso" ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                )}
                <span className={mensagem.tipo === "sucesso" ? "text-green-800" : "text-red-800"}>
                  {mensagem.texto}
                </span>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/home')}
              className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={isLoading}
              className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {previaExistente?.existe ? "Atualizar Previsão" : "Salvar Previsão"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* ============================================
            INFORMAÇÕES ADICIONAIS
        ============================================ */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Para Supervisores
            </h3>
            <p className="text-sm text-gray-600">
              Defina a meta antes do início do turno para melhor acompanhamento da operação.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Atualização
            </h3>
            <p className="text-sm text-gray-600">
              Você pode atualizar a previsão a qualquer momento durante o turno.
            </p>
          </div>
        </div>

        {/* ============================================
            RODAPÉ
        ============================================ */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>BRJ Transportes • Sistema de Gestão Operacional</p>
        </div>
      </div>
    </div>
  );
}