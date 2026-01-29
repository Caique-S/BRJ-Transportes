'use client'
// components/UnderDevelopment.tsx
import { FiClock, FiTool } from "react-icons/fi";

interface UnderDevelopmentProps {
  moduleName?: string;
}

export default function EmAndamento({
  moduleName = "Este módulo",
}: UnderDevelopmentProps) {
  return (
    <>
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md mx-auto">
          {/* Ícone */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center">
                <FiClock className="w-16 h-16 text-blue-500" />
              </div>
              {/* Animações sutis */}
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-100 rounded-full animate-ping opacity-20"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-blue-100 rounded-full animate-pulse opacity-30"></div>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            Em Desenvolvimento
          </h1>

          {/* Mensagem */}
          <div className="space-y-4">
            <p className="text-gray-600 text-lg leading-relaxed">
              <span className="font-semibold text-blue-600">{moduleName}</span>{" "}
              do sistema ainda está em desenvolvimento.
            </p>
            <p className="text-gray-500 leading-relaxed">
              Agradecemos a compreensão, sua opinião é fundamental. Estamos aprimorando nossos processos para melhor atendê-lo.
            </p>
          </div>

          {/* Detalhes adicionais */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                Em breve disponível
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Em desenvolvimento
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                Planejamento concluído
              </div>
            </div>
          </div>

          {/* Botão de voltar (opcional) */}
          <div className="mt-10">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
