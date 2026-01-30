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
// TIPOS E INTERFACES ATUALIZADOS
// ============================================
interface PreviaResponse {
  success: boolean;
  existe: boolean;
  turno?: "SBA02" | "SBA04";
  totalVeiculos?: number;
  data?: string;
  criadoEm?: string;
  atualizadoEm?: string;
  message?: string;
}

interface SavePreviaResponse {
  success: boolean;
  message: string;
  data?: {
    turno: "SBA02" | "SBA04";
    totalVeiculos: number;
    operacao: string;
    timestamp: string;
  };
}

interface PreviaExistente {
  turno: "SBA02" | "SBA04";
  totalVeiculos: number;
  existe: boolean;
}

// ============================================
// PÁGINA PRÉVIA OPERACIONAL - VERSÃO CORRIGIDA
// ============================================
export default function PreviaOperacional() {
  const router = useRouter();
  
  // Estados do formulário
  const [turno, setTurno] = useState<"SBA02" | "SBA04">("SBA02");
  const [totalVeiculos, setTotalVeiculos] = useState<number>(20);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuscando, setIsBuscando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  
  // Estado para prévia existente
  const [previaExistente, setPreviaExistente] = useState<PreviaExistente | null>(null);
  
  // Data atual formatada
  const [dataAtual, setDataAtual] = useState<string>("");
  const [horaAtual, setHoraAtual] = useState<number>(0);

  // ============================================
  // EFFECT: Determinar turno baseado na hora
  // ============================================
  useEffect(() => {
    const atualizarDataHora = () => {
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
    };

    atualizarDataHora();
    // Atualizar a hora a cada minuto
    const intervalo = setInterval(atualizarDataHora, 60000);
    
    return () => clearInterval(intervalo);
  }, []);

  // ============================================
  // FUNÇÃO: Buscar prévia existente (CORRIGIDA)
  // ============================================
  const buscarPreviaExistente = async () => {
    if (!turno) return;
    
    setIsBuscando(true);
    
    try {

      const response = await fetch(`/api/operacao/previa?turno=${turno}`);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data: PreviaResponse = await response.json();
      
      if (data.success && data.existe && data.turno && data.totalVeiculos !== undefined) {
        setPreviaExistente({
          turno: data.turno,
          totalVeiculos: data.totalVeiculos,
          existe: true
        });
        setTotalVeiculos(data.totalVeiculos);
      } else {
        setPreviaExistente(null);
        if (data.success && !data.existe) {
          setTotalVeiculos(20); // Valor padrão quando não há prévia
        }
      }
    } catch (error) {
      console.error("❌ Erro ao buscar prévia:", error);
      setMensagem({
        tipo: "erro",
        texto: "Não foi possível buscar a prévia existente. Verifique sua conexão."
      });
      // Fallback seguro
      setPreviaExistente(null);
    } finally {
      setIsBuscando(false);
    }
  };

  // ============================================
  // EFFECT: Buscar prévia quando turno muda
  // ============================================
  useEffect(() => {
    buscarPreviaExistente();
  }, [turno]);

  // ============================================
  // FUNÇÃO: Salvar prévia operacional (CORRIGIDA)
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

      const data: SavePreviaResponse = await response.json();

      if (response.ok && data.success) {
        setMensagem({
          tipo: "sucesso",
          texto: data.message || (previaExistente?.existe 
            ? "Previsão atualizada com sucesso!" 
            : "Previsão criada com sucesso!")
        });
        
        // Atualizar estado local
        setPreviaExistente({
          turno,
          totalVeiculos,
          existe: true
        });

        // Limpar mensagem após 3 segundos
        setTimeout(() => setMensagem(null), 3000);
        
        // Opcional: Redirecionar após sucesso
        // setTimeout(() => router.push('/dashboard'), 2000);
        
      } else {
        throw new Error(data.message || "Erro desconhecido ao salvar");
      }
    } catch (error: any) {
      console.error("❌ Erro ao salvar:", error);
      setMensagem({
        tipo: "erro",
        texto: error.message || "Erro ao salvar previsão. Tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // FUNÇÃO: Resetar formulário
  // ============================================
  const handleReset = () => {
    setTotalVeiculos(30);
    setMensagem(null);
    buscarPreviaExistente(); // Recarregar estado atual
  };

  // ============================================
  // RENDER: Loading inicial
  // ============================================
  if (isBuscando) {
    return (
      <div className="min-h-screen bg-linear-to from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="relative">
            <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-200 rounded-full animate-ping"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Carregando prévia...</h3>
          <p className="text-gray-500">Verificando previsão do turno {turno}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-14 bg-linear-to-br from-gray-50 to-blue-50 py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* ============================================
            CABEÇALHO MELHORADO
        ============================================ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {horaAtual >= 12 && horaAtual < 23 ? "Turno Noturno" : "Turno Diurno"}
              </div>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                <Calendar className="w-8 h-8" />
              </div>
              Prévia Operacional
            </h1>
            <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
              Defina a quantidade de veículos para a expedição no turno atual. Esta previsão será usada para acompanhar o progresso da operação.
            </p>
          </div>

          {/* Data Atual Destaque */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-8 border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{dataAtual}</div>
                  <div className="text-sm text-gray-500">Hoje • {horaAtual.toString().padStart(2, '0')}:00h</div>
                </div>
              </div>
              
              <button
                onClick={buscarPreviaExistente}
                disabled={isBuscando}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isBuscando ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
        </div>
 {/* Card de Ajuda */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="font-bold text-blue-900 text-lg mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Como Funciona
              </h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                  <span>Envie o arquivo de atribuição ".CSV" gerado pelo Logistics.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                  <span>O sistema calculará o progresso automaticamente.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                  <span>Você pode enviar uma previsão manualmente caso seja nescessário.</span>
                </li>
              </ul>
            </div>
        {/* ============================================
            CONTEÚDO PRINCIPAL EM GRID
        ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUNA 1: Informações e Status */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card de Turno Atual */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <Sun className="w-5 h-5 text-yellow-500" />
                Turno Atual
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">Hora Atual:</span>
                  <span className="font-bold text-gray-900">{horaAtual.toString().padStart(2, '0')}:00h</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    (turno === "SBA02" && horaAtual >= 1 && horaAtual < 12) ||
                    (turno === "SBA04" && horaAtual >= 12 && horaAtual < 23)
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {(turno === "SBA02" && horaAtual >= 1 && horaAtual < 12) ||
                     (turno === "SBA04" && horaAtual >= 12 && horaAtual < 23)
                      ? "Em Andamento"
                      : "Fora do Horário"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA 2 e 3: Formulário Principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Header do Card */}
              <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Definir Prévia do Turno</h2>
                <p className="text-blue-100 text-sm">Configure a meta operacional para acompanhamento</p>
              </div>

              <div className="p-6">
                {/* Seleção de Turno */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Selecione o Turno para Configurar
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setTurno("SBA02")}
                      className={`p-5 border-2 rounded-xl text-left transition-all duration-200 ${
                        turno === "SBA02"
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${
                          turno === "SBA02" ? "bg-blue-100" : "bg-gray-100"
                        }`}>
                          <Sun className={`w-6 h-6 ${
                            turno === "SBA02" ? "text-blue-600" : "text-gray-400"
                          }`} />
                        </div>
                        <div>
                          <div className={`font-bold text-lg ${
                            turno === "SBA02" ? "text-blue-700" : "text-gray-700"
                          }`}>
                            SBA02
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            01:00 - 12:00 • Diurno
                          </div>
                          {turno === "SBA02" && (
                            <div className="text-xs text-blue-600 font-medium mt-2">
                              ✓ Selecionado
                            </div>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTurno("SBA04")}
                      className={`p-5 border-2 rounded-xl text-left transition-all duration-200 ${
                        turno === "SBA04"
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${
                          turno === "SBA04" ? "bg-blue-100" : "bg-gray-100"
                        }`}>
                          <Moon className={`w-6 h-6 ${
                            turno === "SBA04" ? "text-blue-600" : "text-gray-400"
                          }`} />
                        </div>
                        <div>
                          <div className={`font-bold text-lg ${
                            turno === "SBA04" ? "text-blue-700" : "text-gray-700"
                          }`}>
                            SBA04
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            12:00 - 23:00 • Noturno
                          </div>
                          {turno === "SBA04" && (
                            <div className="text-xs text-blue-600 font-medium mt-2">
                              ✓ Selecionado
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Quantidade de Veículos */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Quantidade Total de Veículos
                    </label>
                    <div className="text-sm text-gray-500">
                      Mín: 1 • Máx: 100
                    </div>
                  </div>
                  
                  {/* Input com ícone */}
                  <div className="relative mb-4">
                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={totalVeiculos}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 1 && value <= 100) {
                          setTotalVeiculos(value);
                        }
                      }}
                      className="w-full pl-14 pr-4 py-4 text-3xl font-bold text-center border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                      veículos
                    </div>
                  </div>
                  
                  {/* Slider */}
                  <div className="px-2">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={totalVeiculos}
                      onChange={(e) => setTotalVeiculos(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2 px-1">
                      <span>1</span>
                      <span>25</span>
                      <span>50</span>
                      <span>75</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>

                {/* Card de Resumo */}
                <div className="mb-8 bg-linear-to-r from-gray-50 to-blue-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Resumo da Configuração
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-blue-600">{totalVeiculos}</div>
                      <div className="text-sm text-gray-600">Veículos</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-gray-800">{turno}</div>
                      <div className="text-sm text-gray-600">Turno</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-gray-800">
                        {horaAtual >= 12 && horaAtual < 23 ? "Noturno" : "Diurno"}
                      </div>
                      <div className="text-sm text-gray-600">Período</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-gray-800">
                        {previaExistente?.existe ? "Atualizar" : "Novo"}
                      </div>
                      <div className="text-sm text-gray-600">Status</div>
                    </div>
                  </div>
                </div>

                {/* Alerta de Prévia Existente */}
                {previaExistente?.existe && (
                  <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <h3 className="font-semibold text-amber-900">Prévia Existente Detectada</h3>
                        <p className="text-amber-800 text-sm mt-1">
                          Já existe uma previsão de <strong>{previaExistente.totalVeiculos} veículos</strong> 
                          para o turno {previaExistente.turno}. 
                          Ao salvar, você <strong>substituirá</strong> essa previsão.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensagens do Sistema */}
                {mensagem && (
                  <div className={`mb-8 p-4 rounded-xl border ${
                    mensagem.tipo === "sucesso" 
                      ? "bg-green-50 border-green-200" 
                      : "bg-red-50 border-red-200"
                  }`}>
                    <div className="flex items-center gap-3">
                      {mensagem.tipo === "sucesso" ? (
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                      )}
                      <div>
                        <p className={`font-medium ${
                          mensagem.tipo === "sucesso" ? "text-green-800" : "text-red-800"
                        }`}>
                          {mensagem.texto}
                        </p>
                        {mensagem.tipo === "sucesso" && (
                          <p className="text-green-700 text-sm mt-1">
                            A previsão será usada para calcular o progresso do turno.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => router.push('/home')}
                    className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    onClick={handleReset}
                    className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Redefinir
                  </button>
                  
                  <button
                    onClick={handleSalvar}
                    disabled={isLoading}
                    className="flex-1 px-6 py-4 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {previaExistente?.existe ? "Atualizar Previsão" : "Salvar Previsão"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Para Supervisores
                </h3>
                <p className="text-gray-600 text-sm">
                  Defina a meta antes do início do turno para melhor acompanhamento. 
                  A previsão pode ser ajustada durante a operação conforme necessidade.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Atualização em Tempo Real
                </h3>
                <p className="text-gray-600 text-sm">
                  O progresso é calculado automaticamente com base nos carregamentos 
                  concluídos. Acompanhe em tempo real no dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Sistema conectado • BRJ Transportes
          </div>
          <p className="text-gray-400 text-sm mt-2">
            © {new Date().getFullYear()} Sistema de Gestão Operacional • v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}