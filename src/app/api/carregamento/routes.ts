import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { Carregamento, CarregamentoInput } from "../../lib/models/carregamento";

function calcularProgressoPorHorarios(horarios: {
  encostouDoca: string;
  inicioCarregamento: string;
  fimCarregamento: string;
  liberacao: string;
}): {
  porcentagem: number;
  status: "na_fila" | "encostado" | "carregando" | "finalizado" | "liberado";
} {
  if (!horarios) return { porcentagem: 0, status: "na_fila" };

  // Verificar qual foi o último horário preenchido
  if (horarios.liberacao && horarios.liberacao.trim() !== "") {
    return { porcentagem: 100, status: "liberado" };
  } else if (
    horarios.fimCarregamento &&
    horarios.fimCarregamento.trim() !== ""
  ) {
    return { porcentagem: 75, status: "finalizado" };
  } else if (
    horarios.inicioCarregamento &&
    horarios.inicioCarregamento.trim() !== ""
  ) {
    return { porcentagem: 50, status: "carregando" };
  } else if (horarios.encostouDoca && horarios.encostouDoca.trim() !== "") {
    return { porcentagem: 25, status: "encostado" };
  }

  return { porcentagem: 0, status: "na_fila" };
}

function getHorariosPreenchidos(horarios: {
  encostouDoca: string;
  inicioCarregamento: string;
  fimCarregamento: string;
  liberacao: string;
}): string[] {
  const preenchidos: string[] = [];
  
  if (horarios.encostouDoca && horarios.encostouDoca.trim() !== '') {
    preenchidos.push('encostouDoca');
  }
  if (horarios.inicioCarregamento && horarios.inicioCarregamento.trim() !== '') {
    preenchidos.push('inicioCarregamento');
  }
  if (horarios.fimCarregamento && horarios.fimCarregamento.trim() !== '') {
    preenchidos.push('fimCarregamento');
  }
  if (horarios.liberacao && horarios.liberacao.trim() !== '') {
    preenchidos.push('liberacao');
  }
  
  return preenchidos;
}

export async function POST(request: NextRequest) {
  try {
    const data: CarregamentoInput = await request.json();
    const now = new Date();
    const diaOperacao = now.toISOString().split("T")[0]; // YYYY-MM-DD

    // ✅ CORREÇÃO: Lógica de turno corrigida
    const hora = now.getHours();
    let turno: "SBA02" | "SBA04" = "SBA02";
    if (hora >= 12 && hora < 23) {
      turno = "SBA04";
    } else if (hora >= 1 && hora < 12) {
      turno = "SBA02";
    }
    // Se hora for 0 (meia-noite) ou 23, mantém SBA02 como padrão

    // Validações básicas (mantenha suas validações existentes)
    const errors: string[] = [];

    if (!data.doca || data.doca < 1 || data.doca > 20) {
      errors.push("Doca inválida (1-20)");
    }

    if (!data.cidadeDestino || data.cidadeDestino.trim() === "") {
      errors.push("Cidade de destino é obrigatória");
    }

    if (!data.motorista?.nome || data.motorista.nome.trim() === "") {
      errors.push("Nome do motorista é obrigatório");
    }

    // Validação específica por tipo de veículo
    if (data.tipoVeiculo === "CARROCERIA") {
      if (!data.placas?.cavaloMecanico || !data.placas?.bau) {
        errors.push("Para carroceria, informe cavalo mecânico e baú");
      }
    } else {
      // Para 3/4, TOCO, TRUCK
      if (!data.placas?.placaSimples) {
        errors.push(`Informe a placa do ${data.tipoVeiculo}`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados inválidos",
          errors,
        },
        { status: 400 },
      );
    }

    const progressoCalculado = calcularProgressoPorHorarios(data.horarios);
     const horariosPreenchidos = getHorariosPreenchidos(data.horarios);

    const descricaoProgresso =
      progressoCalculado.status === "na_fila"
        ? "Carregamento cadastrado na fila"
        : progressoCalculado.status === "encostado"
          ? "Veículo encostou na doca"
          : progressoCalculado.status === "carregando"
            ? "Iniciou carregamento"
            : progressoCalculado.status === "finalizado"
              ? "Carregamento finalizado"
              : "Veículo liberado";

    const carregamento: Omit<Carregamento, "_id"> = {
      
      doca: data.doca,
      cidadeDestino: data.cidadeDestino,
      sequenciaCarro: data.sequenciaCarro,
      motorista: data.motorista,
      tipoVeiculo: data.tipoVeiculo,
      placas: data.placas,
      horarios: data.horarios,
      lacres: data.lacres,
      cargas: data.cargas,
      observacoes: data.observacoes || "",

      progresso: {
        porcentagem: progressoCalculado.porcentagem,
        status: progressoCalculado.status,
        ultimaAtualizacao: now,
        historico: [{
          porcentagem: progressoCalculado.porcentagem,
          status: progressoCalculado.status,
          timestamp: now,
          descricao: descricaoProgresso
        }]
      },

      status: "em_andamento",

      // NOVO: Timestamps detalhados
      timestamps: {
        criadoEm: now,
        atualizadoEm: now,
        ...(progressoCalculado.status === "encostado" && { encostouEm: now }),
        ...(progressoCalculado.status === "carregando" && { inicioCarregamentoEm: now }),
        ...(progressoCalculado.status === "finalizado" && { fimCarregamentoEm: now }),
        ...(progressoCalculado.status === "liberado" && { liberadoEm: now }),
            },

      
      metadata: {
        diaOperacao,
        turno,
        operador: "sistema",
        finalizadoComBotao: false, 
      },

    };

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "brj_transportes");

    // ✅ CORREÇÃO: Nome da collection corrigido para "carregamentos"
    const result = await db
      .collection<Carregamento>("carregamentos")
      .insertOne(carregamento);

    return NextResponse.json(
      {
        success: true,
        message: "Carregamento salvo com sucesso",
        data: {
          id: result.insertedId.toString(),
          ...carregamento,
          timestamps: {
            ...carregamento.timestamps,
            criadoEm: carregamento.timestamps.criadoEm.toISOString(),
            atualizadoEm: carregamento.timestamps.atualizadoEm.toISOString(),
          },
          progresso: {
            ...carregamento.progresso,
            ultimaAtualizacao:
              carregamento.progresso.ultimaAtualizacao.toISOString(),
            historico: carregamento.progresso.historico.map((h) => ({
              ...h,
              timestamp: h.timestamp.toISOString(),
            })),
          },
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Erro ao salvar carregamento:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
