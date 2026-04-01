import { getAllByIndex, getAllRecords, putRecord } from "./db";

export interface HistoricoNota {
  id: string;
  timestamp: string;
  acao: "criado" | "aprovado" | "rejeitado" | "reenviado";
  nivel: number; // 1=Auxiliar, 2=Contador, 3=Socio
  usuario: string;
  justificativa?: string;
}

export type WorkflowStatus =
  | "pendente"
  | "em_revisao"
  | "aprovado"
  | "rejeitado"
  | "pendente_correcao";

export type WorkflowTipo =
  | "lancamento"
  | "nota_fiscal"
  | "folha_pagamento"
  | "guia_imposto";

export interface WorkflowItem {
  id: string;
  tipo: WorkflowTipo;
  titulo: string;
  descricao?: string;
  valor?: number;
  clientId: string;
  clientNome?: string;
  id_documento?: string;
  status_atual: WorkflowStatus;
  nivel_aprovacao: number; // 1, 2, 3
  id_responsavel: string;
  historico_notas: HistoricoNota[];
  createdAt: string;
  updatedAt: string;
}

const STORE = "workflow_items";

export async function createWorkflowItem(
  data: Omit<
    WorkflowItem,
    | "id"
    | "historico_notas"
    | "createdAt"
    | "updatedAt"
    | "status_atual"
    | "nivel_aprovacao"
    | "id_responsavel"
  >,
  criadoPor: string,
): Promise<WorkflowItem> {
  const now = new Date().toISOString();
  const item: WorkflowItem = {
    ...data,
    id: `wf_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    status_atual: "pendente",
    nivel_aprovacao: 1,
    id_responsavel: criadoPor,
    historico_notas: [
      {
        id: crypto.randomUUID(),
        timestamp: now,
        acao: "criado",
        nivel: 1,
        usuario: criadoPor,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  await putRecord(STORE, item);
  return item;
}

export async function getAllWorkflowItems(): Promise<WorkflowItem[]> {
  return getAllRecords<WorkflowItem>(STORE);
}

export async function getWorkflowItemsByStatus(
  status: WorkflowStatus,
): Promise<WorkflowItem[]> {
  return getAllByIndex<WorkflowItem>(STORE, "status_atual", status);
}

export async function approveItem(
  id: string,
  usuario: string,
): Promise<WorkflowItem | null> {
  const all = await getAllRecords<WorkflowItem>(STORE);
  const item = all.find((i) => i.id === id);
  if (!item) return null;

  const now = new Date().toISOString();
  const nota: HistoricoNota = {
    id: crypto.randomUUID(),
    timestamp: now,
    acao: "aprovado",
    nivel: item.nivel_aprovacao,
    usuario,
  };

  let nextStatus: WorkflowStatus;
  let nextNivel: number;
  let nextResponsavel: string;

  if (item.nivel_aprovacao >= 3) {
    // Final approval
    nextStatus = "aprovado";
    nextNivel = 3;
    nextResponsavel = usuario;
  } else {
    // Move to next level
    nextStatus = "em_revisao";
    nextNivel = item.nivel_aprovacao + 1;
    nextResponsavel = `nivel_${nextNivel}`;
  }

  const updated: WorkflowItem = {
    ...item,
    status_atual: nextStatus,
    nivel_aprovacao: nextNivel,
    id_responsavel: nextResponsavel,
    historico_notas: [...item.historico_notas, nota],
    updatedAt: now,
  };

  await putRecord(STORE, updated);
  return updated;
}

export async function rejectItem(
  id: string,
  usuario: string,
  justificativa: string,
): Promise<WorkflowItem | null> {
  const all = await getAllRecords<WorkflowItem>(STORE);
  const item = all.find((i) => i.id === id);
  if (!item) return null;

  const now = new Date().toISOString();
  const nota: HistoricoNota = {
    id: crypto.randomUUID(),
    timestamp: now,
    acao: "rejeitado",
    nivel: item.nivel_aprovacao,
    usuario,
    justificativa,
  };

  let nextStatus: WorkflowStatus;
  let nextNivel: number;
  let nextResponsavel: string;

  if (item.nivel_aprovacao <= 1) {
    // Return to creator for correction
    nextStatus = "pendente_correcao";
    nextNivel = 1;
    nextResponsavel = item.historico_notas[0]?.usuario ?? "auxiliar";
  } else {
    // Return to previous level
    nextStatus = "em_revisao";
    nextNivel = item.nivel_aprovacao - 1;
    nextResponsavel = `nivel_${nextNivel}`;
  }

  const updated: WorkflowItem = {
    ...item,
    status_atual: nextStatus,
    nivel_aprovacao: nextNivel,
    id_responsavel: nextResponsavel,
    historico_notas: [...item.historico_notas, nota],
    updatedAt: now,
  };

  await putRecord(STORE, updated);
  return updated;
}

export async function resubmitItem(
  id: string,
  usuario: string,
): Promise<WorkflowItem | null> {
  const all = await getAllRecords<WorkflowItem>(STORE);
  const item = all.find((i) => i.id === id);
  if (!item) return null;
  if (item.status_atual !== "pendente_correcao") return null;

  const now = new Date().toISOString();
  const nota: HistoricoNota = {
    id: crypto.randomUUID(),
    timestamp: now,
    acao: "reenviado",
    nivel: 1,
    usuario,
  };

  const updated: WorkflowItem = {
    ...item,
    status_atual: "pendente",
    nivel_aprovacao: 1,
    id_responsavel: "nivel_1",
    historico_notas: [...item.historico_notas, nota],
    updatedAt: now,
  };

  await putRecord(STORE, updated);
  return updated;
}

// Seed sample data if store is empty
export async function seedWorkflowIfEmpty(): Promise<void> {
  const existing = await getAllRecords<WorkflowItem>(STORE);
  if (existing.length > 0) return;

  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000);
  const twoDaysAgo = new Date(now.getTime() - 172800000);

  const samples: WorkflowItem[] = [
    {
      id: "wf_sample_1",
      tipo: "nota_fiscal",
      titulo: "NF-e 001234 — Serviços de TI",
      descricao:
        "Nota fiscal de serviços de consultoria em tecnologia da informação — Mês de Fevereiro/2026",
      valor: 18500.0,
      clientId: "client-2",
      clientNome: "Tech Solutions SA",
      status_atual: "pendente",
      nivel_aprovacao: 1,
      id_responsavel: "nivel_1",
      historico_notas: [
        {
          id: "h1a",
          timestamp: twoDaysAgo.toISOString(),
          acao: "criado",
          nivel: 1,
          usuario: "Ana Lima (Auxiliar)",
        },
      ],
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: twoDaysAgo.toISOString(),
    },
    {
      id: "wf_sample_2",
      tipo: "folha_pagamento",
      titulo: "Folha de Pagamento — Fevereiro/2026",
      descricao:
        "Processamento da folha de pagamento mensal com 47 funcionários, incluindo benefícios e encargos sociais",
      valor: 284600.0,
      clientId: "client-3",
      clientNome: "Construtora Beta Ltda",
      status_atual: "em_revisao",
      nivel_aprovacao: 2,
      id_responsavel: "nivel_2",
      historico_notas: [
        {
          id: "h2a",
          timestamp: twoDaysAgo.toISOString(),
          acao: "criado",
          nivel: 1,
          usuario: "Carlos Souza (Auxiliar)",
        },
        {
          id: "h2b",
          timestamp: yesterday.toISOString(),
          acao: "aprovado",
          nivel: 1,
          usuario: "Carlos Souza (Auxiliar)",
        },
      ],
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
    {
      id: "wf_sample_3",
      tipo: "guia_imposto",
      titulo: "DARF IRPJ — 1º Trimestre 2026",
      descricao:
        "Guia de recolhimento do Imposto de Renda Pessoa Jurídica referente ao 1º trimestre de 2026",
      valor: 42300.0,
      clientId: "client-1",
      clientNome: "Empresa Alfa Ltda",
      status_atual: "aprovado",
      nivel_aprovacao: 3,
      id_responsavel: "Dra. Maria Santos (Sócia)",
      historico_notas: [
        {
          id: "h3a",
          timestamp: twoDaysAgo.toISOString(),
          acao: "criado",
          nivel: 1,
          usuario: "Ana Lima (Auxiliar)",
        },
        {
          id: "h3b",
          timestamp: twoDaysAgo.toISOString(),
          acao: "aprovado",
          nivel: 1,
          usuario: "Ana Lima (Auxiliar)",
        },
        {
          id: "h3c",
          timestamp: yesterday.toISOString(),
          acao: "aprovado",
          nivel: 2,
          usuario: "João Pereira (Contador)",
        },
        {
          id: "h3d",
          timestamp: now.toISOString(),
          acao: "aprovado",
          nivel: 3,
          usuario: "Dra. Maria Santos (Sócia)",
        },
      ],
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "wf_sample_4",
      tipo: "lancamento",
      titulo: "Lançamento de Despesas Operacionais — Jan/2026",
      descricao:
        "Consolidação dos lançamentos de despesas operacionais do mês de Janeiro de 2026, incluindo aluguel, energia e internet",
      valor: 9750.0,
      clientId: "client-4",
      clientNome: "Comercial Gama ME",
      status_atual: "pendente_correcao",
      nivel_aprovacao: 1,
      id_responsavel: "Carlos Souza (Auxiliar)",
      historico_notas: [
        {
          id: "h4a",
          timestamp: twoDaysAgo.toISOString(),
          acao: "criado",
          nivel: 1,
          usuario: "Carlos Souza (Auxiliar)",
        },
        {
          id: "h4b",
          timestamp: yesterday.toISOString(),
          acao: "rejeitado",
          nivel: 1,
          usuario: "João Pereira (Contador)",
          justificativa:
            "Valor do aluguel diverge do contrato vigente. Favor verificar e corrigir o lançamento da conta 3.2.1.01.",
        },
      ],
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
  ];

  for (const item of samples) {
    await putRecord(STORE, item);
  }
}
