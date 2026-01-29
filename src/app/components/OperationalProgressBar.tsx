// components/DashboardProgressBar.tsx
"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, AlertCircle } from "lucide-react";

interface DashboardProgressBarProps {
  totalVeiculosPrevistos: number;
  veiculosConcluidos: number;
  size?: number;
  strokeWidth?: number;
  showDetails?: boolean;
}

export default function DashboardProgressBar({
  totalVeiculosPrevistos,
  veiculosConcluidos,
  size = 140,
  strokeWidth = 12,
  showDetails = true,
}: DashboardProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [turnoAtual, setTurnoAtual] = useState<string>("");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Calcular porcentagem
  const calcularPorcentagem = () => {
    if (totalVeiculosPrevistos === 0) return 0;
    return Math.round((veiculosConcluidos / totalVeiculosPrevistos) * 100);
  };

  // ✅ CORREÇÃO: Padronizar lógica de turno conforme especificação
  // SBA02: 1h-12h, SBA04: 12h-23h
  const determinarTurno = () => {
    const horaAtual = new Date().getHours();
    if (horaAtual >= 12 && horaAtual < 23) {
      return "SBA04";
    }
    return "SBA02"; // 1h-12h e 23h-0h (meia-noite)
  };

  // Determinar cor baseada na porcentagem
  const getProgressColor = (porcentagem: number) => {
    if (porcentagem === 0) return "#9ca3af"; // Cinza
    if (porcentagem < 30) return "#ef4444"; // Vermelho
    if (porcentagem < 70) return "#f59e0b"; // Amarelo/laranja
    if (porcentagem < 100) return "#3b82f6"; // Azul
    return "#10b981"; // Verde (100%)
  };

  // Buscar dados atualizados da operação
  const buscarDadosOperacao = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/operacao/progresso");
      if (response.ok) {
        const data = await response.json();
        const porcentagem = calcularPorcentagem();
        setProgress(porcentagem);
        setTurnoAtual(data.turno || determinarTurno());
        setUltimaAtualizacao(
          new Date(data.ultimaAtualizacao || new Date()).toLocaleTimeString(
            "pt-BR",
            {
              hour: "2-digit",
              minute: "2-digit",
            },
          ),
        );
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Inicializar e atualizar dados
  useEffect(() => {
    const porcentagem = calcularPorcentagem();
    setProgress(porcentagem);
    setTurnoAtual(determinarTurno());
    setUltimaAtualizacao(
      new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );

    // Buscar dados iniciais
    buscarDadosOperacao();

    // Atualizar a cada 30 segundos
    const intervalo = setInterval(buscarDadosOperacao, 30000);

    return () => clearInterval(intervalo);
  }, [totalVeiculosPrevistos, veiculosConcluidos]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const progressColor = getProgressColor(progress);
  const porcentagem = calcularPorcentagem();

  // Determinar status da operação
  const getStatusOperacao = () => {
    if (totalVeiculosPrevistos === 0) return "Sem previsão";
    if (veiculosConcluidos === 0) return "Operação não iniciada";
    if (progress === 100) return "Operação concluída";
    if (progress >= 70) return "Operação avançada";
    if (progress >= 30) return "Operação em andamento";
    return "Operação iniciando";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          Progresso da Operação
        </h3>
        <button
          onClick={buscarDadosOperacao}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          title="Atualizar dados"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex flex-col items-center">
        {/* Barra de Progresso Circular */}
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
              className="fill-none transition-all duration-700 ease-out"
              style={{
                stroke: progressColor,
                strokeDasharray: circumference,
                strokeDashoffset: offset,
              }}
              strokeLinecap="round"
            />
          </svg>

          {/* Conteúdo no centro */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-3xl font-bold text-gray-800">
                {progress}%
              </span>
              <div className="text-xs text-gray-500 mt-1">
                {veiculosConcluidos}/{totalVeiculosPrevistos}
              </div>
            </div>
          </div>
        </div>

        {/* Informações do Turno */}
        <div className="mt-6 text-center">
          <div className="text-2xl font-bold text-blue-700">{turnoAtual}</div>
          <div className="text-sm text-gray-600 mt-1">
            Progresso da Operação
          </div>
        </div>

        {/* Status */}
        <div className="mt-4">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              progress === 0
                ? "bg-gray-100 text-gray-800"
                : progress < 30
                  ? "bg-red-100 text-red-800"
                  : progress < 70
                    ? "bg-yellow-100 text-yellow-800"
                    : progress < 100
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
            }`}
          >
            {getStatusOperacao()}
          </div>
        </div>

        {/* Estatísticas Detalhadas */}
        {showDetails && (
          <div className="mt-6 w-full space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Previsto:</span>
              <span className="font-semibold">
                {totalVeiculosPrevistos} veículos
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Concluídos:</span>
              <span className="font-semibold text-green-600">
                {veiculosConcluidos} veículos
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pendentes:</span>
              <span className="font-semibold text-orange-600">
                {totalVeiculosPrevistos - veiculosConcluidos} veículos
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Última atualização:</span>
              <span className="text-sm text-gray-500">{ultimaAtualizacao}</span>
            </div>
          </div>
        )}

        {/* Ações Rápidas */}
        <div className="mt-6 pt-6 border-t border-gray-200 w-full">
          <div className="grid grid-cols-2 gap-2">
            <button className="text-xs text-center py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
              Ver Detalhes
            </button>
            <button className="text-xs text-center py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
              Exportar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
