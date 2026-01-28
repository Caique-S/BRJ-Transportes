"use client";

import { useState, useEffect } from "react";

interface OperationalProgress {
  totalPrevisto: number;
  concluidos: number;
  percentualConclusao: number;
  turno: string;
  ultimaAtualizacao: Date;
  pendentes: number;
}

export default function useOperationalProgress() {
  const [progresso, setProgresso] = useState<OperationalProgress>({
    totalPrevisto: 0,
    concluidos: 0,
    percentualConclusao: 0,
    turno: "SBA02",
    ultimaAtualizacao: new Date(),
    pendentes: 0,
  });

  const [isLoading, setIsLoading] = useState(false);

  const buscarProgressoOperacional = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/operacao/progresso");

      if (response.ok) {
        const data = await response.json();
        setProgresso({
          totalPrevisto: data.totalPrevisto,
          concluidos: data.concluidos,
          percentualConclusao: data.percentualConclusao,
          turno: data.turno,
          ultimaAtualizacao: new Date(data.ultimaAtualizacao),
          pendentes: data.pendentes,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar progresso:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar dados inicialmente e a cada 30 segundos
  useEffect(() => {
    buscarProgressoOperacional();

    const intervalo = setInterval(buscarProgressoOperacional, 30000);

    return () => clearInterval(intervalo);
  }, []);

  return {
    progresso,
    isLoading,
    buscarProgressoOperacional,
  };
}
