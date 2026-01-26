'use client'

import { useState } from "react";
import { Truck, Clock, Package, User, MapPin, Lock, Save } from "lucide-react";

export default function Initial() {
    const [tipoVeiculo, setTipoVeiculo] = useState<"TRUCK" | "CARROCERIA" | "BITREM" >("TRUCK");
    
    const cidades = [
      "Juazeiro - BA",
      "Jacobina - BA",
      "Seabra - BA",
      "Pombal - BA",
      "Bonfim - BA",
    ];

  return (
    <>
      <div className="max-w-4xl mx-auto mt-20 p-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Truck className="text-blue-600" />
          Novo Carregamento
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Doca
              </label>
              <select className="w-full p-3 border border-gray-300 rounded-lg">
                {[1, 2, 3, 4, 5, 6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map((doca) => (
                  <option key={doca} value={doca}>
                    Doca {doca}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade de Destino
              </label>
              <select className="w-full p-3 border border-gray-300 rounded-lg">
                <option value="">Selecione a cidade</option>
                {cidades.map((cidade) => (
                  <option key={cidade} value={cidade}>
                    {cidade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sequência do Carro */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qual carro na sequência?
            </label>
            <div className="flex gap-4">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="flex-1 p-3 border rounded-lg text-center hover:bg-gray-50"
                >
                  {num}º Carro
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="flex text-sm font-medium text-gray-700 mb-2 items-center">
              <User className="w-4 h-4 mr-1" />
              Motorista
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nome do motorista"
                className="p-3 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="ID/CPF (opcional)"
                className="p-3 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Veículo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "TRUCK", label: "Truck", desc: "1 placa" },
                {
                  value: "CARROCERIA",
                  label: "Carroceria",
                  desc: "2 placas",
                },
                {
                  value: "BITREM",
                  label: "Bitrem/Rodotrem",
                  desc: "2+ placas",
                },
              ].map((tipo) => (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => setTipoVeiculo(tipo.value as any)}
                  className={`p-4 border rounded-lg text-center ${tipoVeiculo === tipo.value ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                >
                  <div className="font-medium">{tipo.label}</div>
                  <div className="text-sm text-gray-500">{tipo.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Placas conforme tipo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Placas do Veículo
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tipoVeiculo === "TRUCK" ? (
                <input
                  type="text"
                  placeholder="Placa do truck"
                  className="p-3 border border-gray-300 rounded-lg uppercase"
                />
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Placa da carreta"
                    className="p-3 border border-gray-300 rounded-lg uppercase"
                  />
                  <input
                    type="text"
                    placeholder="Placa do baú"
                    className="p-3 border border-gray-300 rounded-lg uppercase"
                  />
                </>
              )}
            </div>
          </div>

          {/* Horários */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Horários
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Encostou na Doca
                </label>
                <input
                  type="time"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Início Carregamento
                </label>
                <input
                  type="time"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Fim Carregamento
                </label>
                <input
                  type="time"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Liberação
                </label>
                <input
                  type="time"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Lacres */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Lock className="w-4 h-4 mr-2" />
              Lacres
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Traseiro (obrigatório)
                </label>
                <input
                  type="text"
                  placeholder="Número do lacre"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Lateral Esquerdo (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Número do lacre"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Lateral Direito (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Número do lacre"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Cargas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Gaiolas
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Volumosos
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Manga Pallets
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700">
              <Save className="w-5 h-5" />
              Salvar Carregamento
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
