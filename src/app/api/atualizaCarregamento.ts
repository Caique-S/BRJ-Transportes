{/*
// app/lib/api/carregamento.ts

export const atualizarProgresso = async (carregamentoId: string, porcentagem: number, status: string) => {
  try {
    const response = await fetch(`/api/carregamentos/${carregamentoId}/progresso`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        porcentagem,
        status,
        descricao: `Progresso atualizado para ${porcentagem}%`
      }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // SE FOR 100% e status "liberado", marcar como concluído na operação geral
      if (status === "liberado" && porcentagem === 100) {
        await fetch('/api/operacao/concluir', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ carregamentoId })
        });
      }
      
      return data;
    }
    throw new Error('Erro ao atualizar progresso');
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
};
  */}