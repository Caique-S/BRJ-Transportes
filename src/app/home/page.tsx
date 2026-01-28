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
} from "lucide-react";

// Tipos
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
  id: number;
  placa: string;
  status: "aguardando" | "andamento" | "completo";
  cidadeOrigem: string;
  cidadeDestino: string;
  tipoVeiculo: string;
  carga: string;
  horaEntrada: string;
  tempoEspera: string;
}

export default function Home() {
  // Estados
  const [dadosCarregamento, setDadosCarregamento] = useState<
    CarregamentoStatus[]
  >([]);
  const [cidades, setCidades] = useState<CidadeInfo[]>([]);
  const [tempoAtualizado, setTempoAtualizado] = useState<string>("");

  // Dados estatísticos
  const estatisticas: StatusCard[] = [
    {
      title: "Total de Veículos",
      value: 32,
      change: 50.2,
      icon: <Truck className="w-6 h-6" />,
      color: "bg-indigo-500",
    },
    {
      title: "Aguardando Descarga",
      value: 14,
      change: 8.1,
      icon: <Clock className="w-6 h-6" />,
      color: "bg-orange-500",
    },
    {
      title: "Descarregando Gaiolas",
      value: 4,
      change: 30.2,
      icon: <BarChart3 className="w-6 h-6" />,
      color: "bg-blue-500",
    },
    {
      title: "Aguardando Carregamento",
      value: 18,
      change: 12.5,
      icon: <Loader2 className="w-6 h-6" />,
      color: "bg-yellow-500",
    },
    {
      title: "Veículos Carregando",
      value: 7,
      change: 40.7,
      icon: <Package className="w-6 h-6" />,
      color: "bg-green-500",
    },
    {
      title: "Cargas Completas",
      value: 9,
      change: 2.3,
      icon: <CheckCircle className="w-6 h-6" />,
      color: "bg-purple-500",
    },
  ];

  // Dados de cidades (mock - normalmente viria da API)
  const cidadesMock: CidadeInfo[] = [
    {
      nome: "Juazeiro",
      quantidade: 4,
      percentual: 26.9,
      estado: "BA",
      tipoCarga: ["Gaiolas", "Volumosos", "Manga Palets"],
    },
    {
      nome: "Jacobina",
      quantidade: 5,
      percentual: 17.9,
      estado: "BA",
      tipoCarga: ["Gaiolas", "Volumosos"],
    },
    {
      nome: "Seabra",
      quantidade: 3,
      percentual: 14.1,
      estado: "BA",
      tipoCarga: ["Volumosos", "Manga Palets"],
    },
    {
      nome: "Pombal",
      quantidade: 4,
      percentual: 11.5,
      estado: "BA",
      tipoCarga: ["Gaiolas"],
    },
    {
      nome: "Senhor do Bonfim",
      quantidade: 3,
      percentual: 10.3,
      estado: "BA",
      tipoCarga: ["Volumosos"],
    },
  ];

  // Dados de carregamento (mock)
  const carregamentosMock: CarregamentoStatus[] = [
    {
      id: 1,
      placa: "JSU-9J85",
      status: "aguardando",
      cidadeOrigem: "Feira De Santana",
      cidadeDestino: "Seabra",
      tipoVeiculo: "TRUCK",
      carga: "Gaiolas , Volumosos",
      horaEntrada: "08:30",
      tempoEspera: "2h15m",
    },
    {
      id: 2,
      placa: "PLE-3H50",
      status: "andamento",
      cidadeOrigem: "Feira De Santana",
      cidadeDestino: "Pombal",
      tipoVeiculo: "TOCO",
      carga: "Volumosos",
      horaEntrada: "07:45",
      tempoEspera: "1h30m",
    },
    {
      id: 3,
      placa: "MHU-2D72",
      status: "completo",
      cidadeOrigem: "Feira De Santana",
      cidadeDestino: "Juazeiro",
      tipoVeiculo: "CARROCERIA",
      carga: "Volumosos, Manga Palets",
      horaEntrada: "06:15",
      tempoEspera: "0h45m",
    },
    {
      id: 4,
      placa: "BCV-7G30",
      status: "aguardando",
      cidadeOrigem: "Feira De Santana",
      cidadeDestino: "Jacobina",
      tipoVeiculo: "TRUCK",
      carga: "Volumosos",
      horaEntrada: "09:20",
      tempoEspera: "1h50m",
    },
    {
      id: 5,
      placa: "GCV-0C72",
      status: "andamento",
      cidadeOrigem: "Feira De Santana",
      cidadeDestino: "Senhor Do Bonfim",
      tipoVeiculo: "3/4",
      carga: "Manga Palets",
      horaEntrada: "08:00",
      tempoEspera: "2h00m",
    },
  ];

  // Atualizar tempo
  useEffect(() => {
    const agora = new Date();
    setTempoAtualizado(
      agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );

    // Simular dados
    setCidades(cidadesMock);
    setDadosCarregamento(carregamentosMock);

    // Atualizar a cada 30 segundos (simulação)
    const interval = setInterval(() => {
      const agora = new Date();
      setTempoAtualizado(
        agora.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calcular totais
  const totalCarros = estatisticas[0].value;
  const carrosSemGaiola = estatisticas[1].value;
  const percentualSemGaiola = ((carrosSemGaiola / totalCarros) * 100).toFixed(
    1,
  );

  return (
    <div className="my-18 min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-2">
          <p className="text-gray-600">
            Monitoramento em tempo real das operações de carregamento
          </p>
          <div className="flex items-center space-x-4 mt-2 md:mt-0">
            <span className="text-sm text-gray-500">
              Atualizado em: {tempoAtualizado}
            </span>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <MapPin className="inline w-4 h-4 mr-2" />
              Atualizar Mapa
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {estatisticas.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`flex p-3 md:p-3 rounded-lg ${stat.color}`}>
                <div className="w-full h-full md:w-6 md:h-6">{stat.icon}</div>
              </div>
              <div
                className={`flex items-center ${stat.change >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {stat.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                ) : (
                  <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />
                )}
                <span className="m1-1 text-xs md:text-sm font-medium">
                  {stat.change >= 0 ? "+" : ""}
                  {stat.change}%
                </span>
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">
              {stat.value.toLocaleString()}
            </h3>
            <p className="text-gray-600 text-xs md:text-sm mt-1">
              {stat.title}
            </p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
          Legenda de Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
            <div className="w-4 h-4 bg-indigo-500 rounded mr-3"></div>
            <span className="font-medium">Total de Veículos</span>
          </div>
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
            <span className="font-medium">Veículos Aguardando Descarga</span>
          </div>
          <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
            <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
            <span className="font-medium">Veículos Descarregando Gaiolas</span>
          </div>
          <div className="flex items-center p-3 bg-orange-50 rounded-lg">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
            <span className="font-medium">
              Veículos Aguardando Carregamento
            </span>
          </div>
          <div className="flex items-center p-3 bg-purple-50 rounded-lg">
            <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
            <span className="font-medium">Veículos Carregando</span>
          </div>
          <div className="flex items-center p-3 bg-indigo-50 rounded-lg">
            <div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
            <span className="font-medium">Veículos Carregados</span>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-700">
            <strong>Resumo:</strong> {carrosSemGaiola} veículos (
            {percentualSemGaiola}%) estão operando sem Volumosos, otimizando o
            tempo de carga e aumentando a eficiência operacional.
          </p>
        </div>
      </div>

      {/* Distribuição por Cidades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Mapa de Cidades */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <MapPin className="w-6 h-6 mr-2 text-blue-600" />
            Distribuição por Cidades
          </h2>
          <div className="space-y-4">
            {cidades.map((cidade, index) => (
              <div
                key={index}
                className="border-b border-gray-200 pb-4 last:border-0"
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {cidade.nome} - {cidade.estado}
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
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${cidade.percentual}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status de Carregamento em Tempo Real */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Carregamentos Ativos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Placa
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Trajeto
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Tempo
                  </th>
                </tr>
              </thead>
              <tbody>
                {dadosCarregamento.map((carregamento) => (
                  <tr
                    key={carregamento.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2 font-medium">
                      {carregamento.placa}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                        ${
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
                          {carregamento.cidadeOrigem} →{" "}
                          {carregamento.cidadeDestino}
                        </div>
                        <div className="text-gray-600 text-xs">
                          {carregamento.tipoVeiculo} - {carregamento.carga}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-sm">
                        <div>Entrada: {carregamento.horaEntrada}</div>
                        <div className="text-gray-600">
                          Espera: {carregamento.tempoEspera}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Resumo Operacional */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Análise de Desempenho
          </h2>
          <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            Exportar Relatório
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-2">
              Cidade com Maior Volume
            </h3>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl font-bold text-blue-600">1º</span>
              </div>
              <div>
                <div className="font-bold text-xl">{cidades[0]?.nome}</div>
                <div className="text-gray-600">
                  {cidades[0]?.quantidade} veículos
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-2">
              Tipo de Carga Predominante
            </h3>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="font-bold text-xl">Gaiolas</div>
                <div className="text-gray-600">72% dos carregamentos</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-2">
              Tempo Médio de Espera
            </h3>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="font-bold text-xl">1h 45m</div>
                <div className="text-gray-600">
                  Redução de 15% vs mês anterior
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé do Dashboard */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>
          Dashboard atualizado automaticamente • Dados processados em tempo real
          • Suporte: operacoes@brjtransportes.com
        </p>
      </div>
    </div>
  );
}
