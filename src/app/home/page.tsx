"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Clock,
  Loader2,
  CheckCircle,
  MapPin,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Package,
  Calendar,
  Target,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Building2,
  Users
} from "lucide-react";

// ============================================
// TIPOS E INTERFACES
// ============================================
interface StatusCard {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface CidadeInfo {
  nome: string;
  quantidade: number;
  percentual: number;
  estado: string;
  tipoCarga: string[];
}

interface CarregamentoStatus {
  id: string;
  placa: string;
  status: "aguardando" | "andamento" | "completo";
  cidadeOrigem: string;
  cidadeDestino: string;
  tipoVeiculo: string;
  carga: string;
  horaEntrada: string;
  tempoEspera: string;
  doca: number;
  motorista: string;
}

interface ProgressoOperacao {
  totalPrevisto: number;
  concluidos: number;
  percentualConclusao: number;
  turno: string;
  ultimaAtualizacao: string;
  pendentes: number;
}

interface DocaInfo {
  numero: number;
  status: "livre" | "ocupada" | "concluida";
  carregamento?: {
    cidadeDestino: string;
    sequenciaCarro: number;
    placa: string;
    progresso: number;
  };
}

// ============================================
// COMPONENTE BARRA DE PROGRESSO CIRCULAR
// ============================================
function CircularProgress({ 
  value, 
  size = 180, 
  strokeWidth = 14,
  totalPrevisto,
  concluidos,
  turno 
}: { 
  value: number; 
  size?: number; 
  strokeWidth?: number;
  totalPrevisto: number;
  concluidos: number;
  turno: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  const getColor = (val: number) => {
    if (val === 0) return "#9ca3af";
    if (val < 30) return "#ef4444"; // Vermelho
    if (val < 70) return "#f59e0b"; // Amarelo
    return "#10b981"; // Verde
  };

  const getStatusText = (val: number) => {
    if (val === 0) return "Operação não iniciada";
    if (val < 30) return "Iniciando operação";
    if (val < 70) return "Operação em andamento";
    if (val < 100) return "Operação avançada";
    return "Meta atingida!";
  };

  return (
    <div className="flex  flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Fundo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="fill-none stroke-gray-200"
          />
          {/* Progresso */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="fill-none transition-all duration-1000 ease-out"
            style={{
              stroke: getColor(value),
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
            strokeLinecap="round"
          />
        </svg>
        {/* Conteúdo central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-800">{value}%</span>
          <span className="text-sm text-gray-500 mt-1">{concluidos}/{totalPrevisto}</span>
        </div>
      </div>
      
      {/* Informações do Turno */}
      <div className="mt-4 text-center">
        <div className="text-2xl font-bold text-blue-700">{turno}</div>
        <div className="text-sm text-gray-600">Turno Atual</div>
      </div>
      
      {/* Status */}
      <div className={`mt-3 px-4 py-2 rounded-full text-sm font-medium ${
        value === 0 ? "bg-gray-100 text-gray-700" :
        value < 30 ? "bg-red-100 text-red-700" :
        value < 70 ? "bg-yellow-100 text-yellow-700" :
        value < 100 ? "bg-blue-100 text-blue-700" :
        "bg-green-100 text-green-700"
      }`}>
        {getStatusText(value)}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE VISUALIZAÇÃO DE DOCAS
// ============================================
function DocasGrid({ docas }: { docas: DocaInfo[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Building2 className="w-6 h-6 mr-2 text-blue-600" />
          Status das Docas
        </h2>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center">
            <span className="w-3 h-3 bg-orange-400 rounded-full mr-2"></span>
            Em andamento
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Concluída
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
            Livre
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-3">
        {docas.map((doca) => (
          <div
            key={doca.numero}
            className={`relative p-3 rounded-lg border-2 transition-all ${
              doca.status === "livre" 
                ? "bg-gray-50 border-gray-200" 
                : doca.status === "concluida"
                  ? "bg-green-50 border-green-300"
                  : "bg-orange-50 border-orange-300"
            }`}
          >
            {/* Cidade no topo esquerdo */}
            {doca.carregamento && (
              <span className="absolute top-1 left-1 text-[10px] font-medium text-gray-600 truncate max-w-[80%]">
                {doca.carregamento.cidadeDestino.split(' - ')[0]}
              </span>
            )}
            
            {/* Número da doca centralizado */}
            <div className={`text-2xl font-bold text-center mt-3 ${
              doca.status === "livre" ? "text-gray-400" :
              doca.status === "concluida" ? "text-green-700" :
              "text-orange-700"
            }`}>
              {doca.numero}
            </div>
            
            {/* Sequência do carro embaixo */}
            {doca.carregamento && (
              <div className="text-center mt-1">
                <span className="text-xs text-gray-500">
                  {doca.carregamento.sequenciaCarro}º
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL - DASHBOARD
// ============================================
export default function HomeDashboard() {
  // Estados para dados da API
  const [progressoOperacao, setProgressoOperacao] = useState<ProgressoOperacao>({
    totalPrevisto: 0,
    concluidos: 0,
    percentualConclusao: 0,
    turno: "SBA02",
    ultimaAtualizacao: new Date().toISOString(),
    pendentes: 0
  });
  
  const [estatisticas, setEstatisticas] = useState<StatusCard[]>([]);
  const [cidades, setCidades] = useState<CidadeInfo[]>([]);
  const [carregamentos, setCarregamentos] = useState<CarregamentoStatus[]>([]);
  const [docas, setDocas] = useState<DocaInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tempoAtualizado, setTempoAtualizado] = useState<string>("");

  // ============================================
  // CONEXÃO COM BANCO DE DADOS - INSTRUÇÕES:
  // ============================================
  /* 
    PARA CONECTAR AO BANCO DE DADOS, ESTA PÁGINA PRECISA:
    
    1. API DE PROGRESSO DA OPERAÇÃO:
       - Endpoint: GET /api/operacao/progresso
       - Retorna: { totalPrevisto, concluidos, percentualConclusao, turno, ultimaAtualizacao, pendentes }
       - Já existe: routes(6).ts (corrigido)
    
    2. API DE ESTATÍSTICAS:
       - Endpoint: GET /api/carregamento/estatisticas
       - Retorna: { estatisticas, cidades, carregamentos, tempoMedio }
       - Arquivo gerado: estatisticas-route.ts
       
    3. API DE DOCAS:
       - Endpoint: GET /api/carregamento/docas
       - Retorna: Array de docas com status e carregamentos
       - Precisa criar se não existir
       
    4. MONGODB - COLEÇÕES NECESSÁRIAS:
       - carregamentos: Dados dos carregamentos
       - previaOperacao: Previsão do turno
       
    5. VARIÁVEIS DE AMBIENTE (.env.local):
       - MONGODB_URI=sua_string_de_conexao
       - MONGODB_DB_NAME=brj_transportes
  */

  // ============================================
  // FUNÇÃO: Buscar progresso da operação
  // ============================================
  const buscarProgressoOperacao = async () => {
    try {
      // CHAMADA API: GET /api/operacao/progresso
      const response = await fetch('/api/operacao/progresso');
      
      if (response.ok) {
        const data = await response.json();
        setProgressoOperacao({
          totalPrevisto: data.totalPrevisto || 0,
          concluidos: data.concluidos || 0,
          percentualConclusao: data.percentualConclusao || 0,
          turno: data.turno || "SBA02",
          ultimaAtualizacao: data.ultimaAtualizacao || new Date().toISOString(),
          pendentes: data.pendentes || 0
        });
      }
    } catch (error) {
      console.error("Erro ao buscar progresso:", error);
    }
  };

  // ============================================
  // FUNÇÃO: Buscar estatísticas completas
  // ============================================
  const buscarEstatisticas = async () => {
    try {
      // CHAMADA API: GET /api/carregamento/estatisticas
      const response = await fetch('/api/carregamento/estatisticas');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Mapear estatísticas para cards
          const stats: StatusCard[] = [
            {
              title: "Total de Veículos",
              value: data.data.estatisticas.total || 0,
              change: 0,
              icon: <Truck className="w-6 h-6" />,
              color: "bg-indigo-500"
            },
            {
              title: "Na Fila",
              value: data.data.estatisticas.naFila || 0,
              change: 0,
              icon: <Clock className="w-6 h-6" />,
              color: "bg-gray-500"
            },
            {
              title: "Encostados",
              value: data.data.estatisticas.encostados || 0,
              change: 0,
              icon: <MapPin className="w-6 h-6" />,
              color: "bg-orange-500"
            },
            {
              title: "Carregando",
              value: data.data.estatisticas.carregando || 0,
              change: 0,
              icon: <Loader2 className="w-6 h-6" />,
              color: "bg-blue-500"
            },
            {
              title: "Finalizados",
              value: data.data.estatisticas.finalizados || 0,
              change: 0,
              icon: <Package className="w-6 h-6" />,
              color: "bg-purple-500"
            },
            {
              title: "Concluídos",
              value: data.data.estatisticas.concluidos || 0,
              change: 0,
              icon: <CheckCircle className="w-6 h-6" />,
              color: "bg-green-500"
            }
          ];
          
          setEstatisticas(stats);
          setCidades(data.data.cidades || []);
          
          // Mapear carregamentos
          const mappedCarregamentos: CarregamentoStatus[] = (data.data.carregamentos || []).map((c: any) => ({
            id: c.id,
            placa: c.placa,
            status: c.status,
            cidadeOrigem: c.cidadeOrigem,
            cidadeDestino: c.cidadeDestino,
            tipoVeiculo: c.tipoVeiculo,
            carga: c.carga,
            horaEntrada: c.horaEntrada,
            tempoEspera: c.tempoEspera,
            doca: c.doca || 0,
            motorista: c.motorista || ""
          }));
          
          setCarregamentos(mappedCarregamentos);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  // ============================================
  // FUNÇÃO: Buscar status das docas
  // ============================================
  const buscarDocas = async () => {
    try {
      // CHAMADA API: GET /api/carregamento/docas
      // Se não existir, pode usar os dados de estatísticas
      const response = await fetch('/api/carregamento/estatisticas');
      
      if (response.ok) {
        const data = await response.json();
        
        // Criar array de 20 docas
        const docasArray: DocaInfo[] = Array.from({ length: 20 }, (_, i) => {
          const docaNum = i + 1;
          // Procurar carregamento nesta doca
          const carregamento = data.data?.carregamentos?.find((c: any) => c.doca === docaNum);
          
          if (carregamento) {
            return {
              numero: docaNum,
              status: carregamento.status === "completo" ? "concluida" : "ocupada",
              carregamento: {
                cidadeDestino: carregamento.cidadeDestino,
                sequenciaCarro: 1, // Pode vir do banco
                placa: carregamento.placa,
                progresso: carregamento.status === "completo" ? 100 : 50
              }
            };
          }
          
          return {
            numero: docaNum,
            status: "livre"
          };
        });
        
        setDocas(docasArray);
      }
    } catch (error) {
      console.error("Erro ao buscar docas:", error);
      // Fallback: criar docas vazias
      setDocas(Array.from({ length: 20 }, (_, i) => ({
        numero: i + 1,
        status: "livre"
      })));
    }
  };

  // ============================================
  // FUNÇÃO: Atualizar todos os dados
  // ============================================
  const atualizarDados = async () => {
    setIsLoading(true);
    await Promise.all([
      buscarProgressoOperacao(),
      buscarEstatisticas(),
      buscarDocas()
    ]);
    
    setTempoAtualizado(new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
    
    setIsLoading(false);
  };

  // ============================================
  // EFFECT: Carregar dados iniciais
  // ============================================
  useEffect(() => {
    atualizarDados();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(atualizarDados, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // RENDER: Loading
  // ============================================
  if (isLoading && estatisticas.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-18 min-h-screen bg-gray-50 p-4 md:p-6">
      {/* ============================================
          CABEÇALHO
      ============================================ */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <p className="text-gray-600 mt-1">
              Monitoramento em tempo real das operações de carregamento
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span className="text-sm text-gray-500">
              Atualizado em: {tempoAtualizado}
            </span>
            <button 
              onClick={atualizarDados}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* ============================================
          SEÇÃO PRINCIPAL: PROGRESSO + DOCAS
      ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Barra de Progresso Circular */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Meta do Turno
          </h2>
          <CircularProgress 
            value={progressoOperacao.percentualConclusao}
            totalPrevisto={progressoOperacao.totalPrevisto}
            concluidos={progressoOperacao.concluidos}
            turno={progressoOperacao.turno}
          />
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Previsto:</span>
              <span className="font-semibold">{progressoOperacao.totalPrevisto} veículos</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">Concluídos:</span>
              <span className="font-semibold text-green-600">{progressoOperacao.concluidos} veículos</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">Pendentes:</span>
              <span className="font-semibold text-orange-600">{progressoOperacao.pendentes} veículos</span>
            </div>
          </div>
        </div>

        {/* Visualização de Docas */}
        <div className="lg:col-span-2">
          <DocasGrid docas={docas} />
        </div>
      </div>

      {/* ============================================
          CARDS DE ESTATÍSTICAS
      ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {estatisticas.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-4 md:p-5 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <div className="text-white">{stat.icon}</div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-gray-600 text-sm mt-1">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* ============================================
          DISTRIBUIÇÃO POR CIDADES + CARREGAMENTOS ATIVOS
      ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Distribuição por Cidades */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <MapPin className="w-6 h-6 mr-2 text-blue-600" />
            Distribuição por Cidades
          </h2>
          
          {cidades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma cidade registrada hoje</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cidades.slice(0, 5).map((cidade, index) => (
                <div
                  key={index}
                  className="border-b border-gray-200 pb-4 last:border-0"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {index + 1}º {cidade.nome}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {cidade.tipoCarga.join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg text-blue-600">
                        {cidade.quantidade}
                      </span>
                      <p className="text-sm text-gray-600">
                        {cidade.percentual}% do total
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(cidade.percentual, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Carregamentos Ativos */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Truck className="w-6 h-6 mr-2 text-blue-600" />
            Carregamentos Ativos
          </h2>
          
          {carregamentos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum carregamento ativo</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-gray-600 font-medium text-sm">
                      Placa
                    </th>
                    <th className="text-left py-3 px-2 text-gray-600 font-medium text-sm">
                      Status
                    </th>
                    <th className="text-left py-3 px-2 text-gray-600 font-medium text-sm">
                      Destino
                    </th>
                    <th className="text-left py-3 px-2 text-gray-600 font-medium text-sm">
                      Tempo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {carregamentos.slice(0, 5).map((carregamento) => (
                    <tr
                      key={carregamento.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-2 font-medium">
                        {carregamento.placa}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            carregamento.status === "aguardando"
                              ? "bg-yellow-100 text-yellow-800"
                              : carregamento.status === "andamento"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {carregamento.status === "aguardando"
                            ? "⏳ Aguardando"
                            : carregamento.status === "andamento"
                              ? "🔄 Em Andamento"
                              : "✅ Completo"}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm">
                          <div className="font-medium">
                            {carregamento.cidadeDestino?.split(' - ')[0] || "N/A"}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {carregamento.tipoVeiculo}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm text-gray-600">
                          {carregamento.tempoEspera}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {carregamentos.length > 5 && (
            <div className="mt-4 text-center">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Ver todos ({carregamentos.length}) →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          ANÁLISE DE DESEMPENHO
      ============================================ */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
            Análise de Desempenho
          </h2>
          <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm">
            Exportar Relatório
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cidade com Maior Volume */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">
              Cidade com Maior Volume
            </h3>
            {cidades.length > 0 ? (
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-blue-600">1º</span>
                </div>
                <div>
                  <div className="font-bold text-lg">{cidades[0].nome}</div>
                  <div className="text-gray-600 text-sm">
                    {cidades[0].quantidade} veículos ({cidades[0].percentual}%)
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Sem dados disponíveis</p>
            )}
          </div>

          {/* Tipo de Carga Predominante */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">
              Tipo de Carga Predominante
            </h3>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="font-bold text-lg">Gaiolas</div>
                <div className="text-gray-600 text-sm">Principal carga do dia</div>
              </div>
            </div>
          </div>

          {/* Tempo Médio de Operação */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">
              Tempo Médio de Operação
            </h3>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="font-bold text-lg">2h 15m</div>
                <div className="text-gray-600 text-sm">
                  Média do turno atual
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>
          Dashboard atualizado automaticamente • Dados processados em tempo real
          • BRJ Transportes
        </p>
      </div>
    </div>
  );
}
