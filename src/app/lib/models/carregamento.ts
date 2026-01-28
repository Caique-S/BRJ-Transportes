import { ObjectId } from 'mongodb';

export interface Carregamento {
  _id?: ObjectId;  
  doca: number;
  cidadeDestino: string;
  sequenciaCarro: number;
  motorista: {
    nome: string;
    cpf?: string;
  };
  tipoVeiculo: "3/4" | "TOCO" | "TRUCK" | "CARROCERIA";
  placas: {
    placaSimples?: string;
    cavaloMecanico?: string;
    bau?: string;
  };
  horarios: {
    encostouDoca: string;
    inicioCarregamento: string;
    fimCarregamento: string;
    liberacao: string;
  };
  lacres: {
    traseiro: string;
    lateralEsquerdo?: string;
    lateralDireito?: string;
  };
  cargas: {
    gaiolas: number;
    volumosos: number;
    mangaPallets: number;
  };
    progresso: {
    porcentagem: number; // 0-100
    status: "na_fila" | "encostado" | "carregando" | "finalizado" | "liberado";
    ultimaAtualizacao: Date;
    historico: Array<{
      porcentagem: number;
      status: string;
      timestamp: Date;
      descricao?: string;
    }>;
  };

  status: "pendente" | "em_andamento" | "concluido" | "cancelado";
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;


 timestamps: {
    criadoEm: Date;
    encostouEm?: Date;
    inicioCarregamentoEm?: Date;
    fimCarregamentoEm?: Date;
    liberadoEm?: Date;
    atualizadoEm: Date;
  };

    metadata: {
    diaOperacao: string; 
    turno?: "SBA02" | "SBA04";
    operador?: string;
  };
}

export interface CarregamentoInput {
  doca: number;
  cidadeDestino: string;
  sequenciaCarro: number;
  motorista: {
    nome: string;
    cpf?: string;
  };
  tipoVeiculo: "3/4" | "TOCO" | "TRUCK" | "CARROCERIA";
  placas: {
    placaSimples?: string;
    cavaloMecanico?: string;
    bau?: string;
  };
  horarios: {
    encostouDoca: string;
    inicioCarregamento: string;
    fimCarregamento: string;
    liberacao: string;
  };
  lacres: {
    traseiro: string;
    lateralEsquerdo?: string;
    lateralDireito?: string;
  };
  cargas: {
    gaiolas: number;
    volumosos: number;
    mangaPallets: number;
  };
  status: "pendente" | "em_andamento" | "concluido" | "cancelado";
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}