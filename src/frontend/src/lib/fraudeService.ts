import { getAllByIndex, getAllRecords, putRecord } from "./db";
import { createWorkflowItem } from "./workflowService";

export type NivelRisco = "baixo" | "medio" | "alto";
export type StatusAlerta =
  | "aberto"
  | "em_analise"
  | "resolvido"
  | "falso_positivo";
export type TipoAnomalia =
  | "valor_duplicado"
  | "data_inconsistente"
  | "cnpj_invalido"
  | "variacao_brusca"
  | "horario_suspeito"
  | "sem_documento";

export interface FraudeAlerta {
  id: string;
  tipo: TipoAnomalia;
  nivel: NivelRisco;
  descricao: string;
  detalhe: string;
  entidadeId: string;
  entidadeTipo: "lancamento" | "nota_fiscal";
  entidadeValor?: number;
  entidadeData?: string;
  clientId: string;
  clientNome?: string;
  status: StatusAlerta;
  criadoEm: string;
  resolvidoEm?: string;
  resolvidoPor?: string;
  justificativa?: string;
}

const STORE = "fraude_alertas";

function validarCNPJ(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, "");
  if (nums.length !== 14) return false;
  if (/^(\d)\1+$/.test(nums)) return false;
  const calc = (len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += Number(nums[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };
  return calc(12) === Number(nums[12]) && calc(13) === Number(nums[13]);
}

const ALERTAS_SIMULADOS: FraudeAlerta[] = [
  {
    id: "fraud_sim_1",
    tipo: "valor_duplicado",
    nivel: "alto",
    descricao: "Lançamento duplicado de R$ 8.500,00 — Empresa Alfa Ltda",
    detalhe:
      "Dois lançamentos com valor R$ 8.500,00 foram registrados em 27/03/2026 e 28/03/2026 para o mesmo cliente. Histórico: 'Serviços de consultoria NF 0091'. Conta débito: 3.2.1.01. Possível duplicidade de nota fiscal.",
    entidadeId: "je_sim_001",
    entidadeTipo: "lancamento",
    entidadeValor: 8500.0,
    entidadeData: "2026-03-28",
    clientId: "client-1",
    clientNome: "Empresa Alfa Ltda",
    status: "aberto",
    criadoEm: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "fraud_sim_2",
    tipo: "cnpj_invalido",
    nivel: "alto",
    descricao: "CNPJ inválido em NF-e — Tech Solutions SA",
    detalhe:
      "Nota fiscal NF-e 002345 contém CNPJ do fornecedor '00.000.000/0001-00' com dígitos verificadores incorretos. Possível nota fiscal fraudulenta ou erro de digitação.",
    entidadeId: "nf_sim_002",
    entidadeTipo: "nota_fiscal",
    entidadeValor: 32000.0,
    entidadeData: "2026-03-25",
    clientId: "client-2",
    clientNome: "Tech Solutions SA",
    status: "aberto",
    criadoEm: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "fraud_sim_3",
    tipo: "variacao_brusca",
    nivel: "alto",
    descricao: "Variação de 420% no valor — Construtora Beta Ltda",
    detalhe:
      "Lançamento de R$ 145.000,00 é 4,2x superior à média dos últimos 6 lançamentos do mesmo tipo (Despesas com Materiais: R$ 34.200,00). Data: 29/03/2026. Conta 3.1.2.05. Verificar se há compra justificada e documentação de suporte.",
    entidadeId: "je_sim_003",
    entidadeTipo: "lancamento",
    entidadeValor: 145000.0,
    entidadeData: "2026-03-29",
    clientId: "client-3",
    clientNome: "Construtora Beta Ltda",
    status: "em_analise",
    criadoEm: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "fraud_sim_4",
    tipo: "sem_documento",
    nivel: "medio",
    descricao: "Lançamento de R$ 12.400 sem documento — Comercial Gama ME",
    detalhe:
      "Lançamento contábil de R$ 12.400,00 na conta 4.1.3.02 (Despesas Diversas) registrado em 26/03/2026 sem documento de suporte vinculado. Valor acima do limite de R$ 5.000 exige comprovante.",
    entidadeId: "je_sim_004",
    entidadeTipo: "lancamento",
    entidadeValor: 12400.0,
    entidadeData: "2026-03-26",
    clientId: "client-4",
    clientNome: "Comercial Gama ME",
    status: "aberto",
    criadoEm: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "fraud_sim_5",
    tipo: "horario_suspeito",
    nivel: "baixo",
    descricao: "Lançamento às 02h17 — Serviços Delta EPP",
    detalhe:
      "Lançamento de R$ 3.200,00 registrado às 02:17 em 27/03/2026. Horário fora do expediente normal (22h–6h). Usuário: auxiliar_carlos. Verificar se foi acesso não autorizado ao sistema.",
    entidadeId: "je_sim_005",
    entidadeTipo: "lancamento",
    entidadeValor: 3200.0,
    entidadeData: "2026-03-27",
    clientId: "client-5",
    clientNome: "Serviços Delta EPP",
    status: "aberto",
    criadoEm: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: "fraud_sim_6",
    tipo: "data_inconsistente",
    nivel: "medio",
    descricao: "Data futura em lançamento — Empresa Alfa Ltda",
    detalhe:
      "Lançamento contábil registrado com data 15/06/2027 — data futura. Conta: 1.1.1.01 (Caixa). Valor: R$ 5.600,00. Possível erro de digitação ou manipulação de data.",
    entidadeId: "je_sim_006",
    entidadeTipo: "lancamento",
    entidadeValor: 5600.0,
    entidadeData: "2027-06-15",
    clientId: "client-1",
    clientNome: "Empresa Alfa Ltda",
    status: "aberto",
    criadoEm: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: "fraud_sim_7",
    tipo: "valor_duplicado",
    nivel: "medio",
    descricao: "Possível duplicidade de NF-e — Tech Solutions SA",
    detalhe:
      "NF-e com CNPJ 12.345.678/0001-99 e valor R$ 4.200,00 aparece duas vezes na base: NF 0345 (14/03/2026) e NF 0389 (15/03/2026). Conferir se são notas distintas ou duplicidade.",
    entidadeId: "nf_sim_007",
    entidadeTipo: "nota_fiscal",
    entidadeValor: 4200.0,
    entidadeData: "2026-03-15",
    clientId: "client-2",
    clientNome: "Tech Solutions SA",
    status: "falso_positivo",
    criadoEm: new Date(Date.now() - 86400000).toISOString(),
    resolvidoEm: new Date(Date.now() - 43200000).toISOString(),
    resolvidoPor: "João Pereira (Contador)",
    justificativa:
      "Verificado: são duas notas distintas de serviços diferentes.",
  },
  {
    id: "fraud_sim_8",
    tipo: "sem_documento",
    nivel: "medio",
    descricao: "3 lançamentos sem suporte acima de R$ 5k — Construtora Beta",
    detalhe:
      "3 lançamentos consecutivos em 20/03/2026 com valores R$ 6.800, R$ 7.100 e R$ 9.300 na conta 3.2.1.08 (Serviços Terceiros) sem documentos vinculados. Total: R$ 23.200,00.",
    entidadeId: "je_sim_008",
    entidadeTipo: "lancamento",
    entidadeValor: 23200.0,
    entidadeData: "2026-03-20",
    clientId: "client-3",
    clientNome: "Construtora Beta Ltda",
    status: "resolvido",
    criadoEm: new Date(Date.now() - 172800000).toISOString(),
    resolvidoEm: new Date(Date.now() - 86400000).toISOString(),
    resolvidoPor: "Ana Lima (Auxiliar)",
    justificativa:
      "Documentos comprobatórios vinculados manualmente após conferência física.",
  },
];

export async function executarAnalise(
  modo: "simulado" | "real",
): Promise<FraudeAlerta[]> {
  if (modo === "simulado") {
    for (const alerta of ALERTAS_SIMULADOS) {
      await putRecord(STORE, alerta);
    }
    return ALERTAS_SIMULADOS;
  }

  // Modo real: lê dados do IndexedDB e aplica regras
  const alertas: FraudeAlerta[] = [];
  const now = new Date();

  try {
    const entries = await getAllRecords<{
      id: string;
      clientId: string;
      valueInCents?: number;
      entryDate?: string;
      createdAt?: string;
      description?: string;
      id_documento?: string;
    }>("journal_entries");

    // Regra 1: Valores duplicados (mesmo valor ±3 dias, mesmo cliente)
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];
        if (a.clientId !== b.clientId) continue;
        if (a.valueInCents !== b.valueInCents) continue;
        const dateA = new Date(a.entryDate ?? a.createdAt ?? "");
        const dateB = new Date(b.entryDate ?? b.createdAt ?? "");
        if (Math.abs(dateA.getTime() - dateB.getTime()) <= 3 * 86400000) {
          const valor = (a.valueInCents ?? 0) / 100;
          alertas.push({
            id: `fraud_dup_${a.id}_${b.id}`,
            tipo: "valor_duplicado",
            nivel: "alto",
            descricao: `Possível lançamento duplicado de R$ ${valor.toFixed(2)} — cliente ${a.clientId}`,
            detalhe: `Lançamentos ${a.id} e ${b.id} têm mesmo valor R$ ${valor.toFixed(2)} em datas próximas (±3 dias). Verifique se há duplicidade.`,
            entidadeId: a.id,
            entidadeTipo: "lancamento",
            entidadeValor: valor,
            entidadeData: a.entryDate,
            clientId: a.clientId,
            status: "aberto",
            criadoEm: now.toISOString(),
          });
        }
      }
    }

    // Regra 2: Datas inconsistentes
    for (const entry of entries) {
      const d = new Date(entry.entryDate ?? entry.createdAt ?? "");
      if (Number.isNaN(d.getTime())) continue;
      const isFuture = d > now;
      const isPastLimit =
        now.getFullYear() - d.getFullYear() > 5 && d.getFullYear() > 1990;
      if (isFuture || isPastLimit) {
        const valor = (entry.valueInCents ?? 0) / 100;
        alertas.push({
          id: `fraud_date_${entry.id}`,
          tipo: "data_inconsistente",
          nivel: "medio",
          descricao: `Data ${
            isFuture ? "futura" : "muito antiga"
          } em lançamento — R$ ${valor.toFixed(2)}`,
          detalhe: `Lançamento ${entry.id} com data ${d.toLocaleDateString("pt-BR")} é ${
            isFuture ? "uma data futura" : "mais de 5 anos no passado"
          }. Verifique possível erro.`,
          entidadeId: entry.id,
          entidadeTipo: "lancamento",
          entidadeValor: valor,
          entidadeData: entry.entryDate,
          clientId: entry.clientId,
          status: "aberto",
          criadoEm: now.toISOString(),
        });
      }
    }

    // Regra 3: Variação brusca (valor > 3x a média)
    const byClient = new Map<string, typeof entries>();
    for (const e of entries) {
      if (!byClient.has(e.clientId)) byClient.set(e.clientId, []);
      byClient.get(e.clientId)!.push(e);
    }
    for (const [clientId, clientEntries] of byClient.entries()) {
      const sorted = [...clientEntries].sort(
        (a, b) =>
          new Date(a.createdAt ?? "").getTime() -
          new Date(b.createdAt ?? "").getTime(),
      );
      for (let i = 6; i < sorted.length; i++) {
        const prev6 = sorted.slice(i - 6, i);
        const avg =
          prev6.reduce((s, e) => s + (e.valueInCents ?? 0), 0) /
          prev6.length /
          100;
        const curr = (sorted[i].valueInCents ?? 0) / 100;
        if (avg > 0 && curr > avg * 3) {
          alertas.push({
            id: `fraud_var_${sorted[i].id}`,
            tipo: "variacao_brusca",
            nivel: "alto",
            descricao: `Variação de ${Math.round((curr / avg) * 100)}% — R$ ${curr.toFixed(2)} vs média R$ ${avg.toFixed(2)}`,
            detalhe: `Lançamento ${sorted[i].id} com R$ ${curr.toFixed(2)} é ${(curr / avg).toFixed(1)}x superior à média dos 6 lançamentos anteriores (R$ ${avg.toFixed(2)}).`,
            entidadeId: sorted[i].id,
            entidadeTipo: "lancamento",
            entidadeValor: curr,
            entidadeData: sorted[i].entryDate,
            clientId,
            status: "aberto",
            criadoEm: now.toISOString(),
          });
        }
      }
    }

    // Regra 4: Lançamento acima de R$5.000 sem documento
    for (const entry of entries) {
      const valor = (entry.valueInCents ?? 0) / 100;
      if (
        valor > 5000 &&
        !entry.id_documento &&
        !entry.description?.includes("doc:")
      ) {
        alertas.push({
          id: `fraud_nodoc_${entry.id}`,
          tipo: "sem_documento",
          nivel: "medio",
          descricao: `Lançamento R$ ${valor.toFixed(2)} sem documento vinculado`,
          detalhe: `Lançamento ${entry.id} de R$ ${valor.toFixed(2)} não possui documento comprobatório vinculado. Valores acima de R$ 5.000 exigem suporte documental.`,
          entidadeId: entry.id,
          entidadeTipo: "lancamento",
          entidadeValor: valor,
          entidadeData: entry.entryDate,
          clientId: entry.clientId,
          status: "aberto",
          criadoEm: now.toISOString(),
        });
      }
    }

    // Regra 5: Horário suspeito (entre 22h e 6h)
    for (const entry of entries) {
      const d = new Date(entry.createdAt ?? "");
      if (Number.isNaN(d.getTime())) continue;
      const hour = d.getHours();
      if (hour >= 22 || hour < 6) {
        const valor = (entry.valueInCents ?? 0) / 100;
        alertas.push({
          id: `fraud_hour_${entry.id}`,
          tipo: "horario_suspeito",
          nivel: "baixo",
          descricao: `Lançamento às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} — fora do horário comercial`,
          detalhe: `Lançamento ${entry.id} de R$ ${valor.toFixed(2)} registrado às ${d.toLocaleTimeString("pt-BR")} em ${d.toLocaleDateString("pt-BR")}. Acesso fora do horário comercial (22h–6h).`,
          entidadeId: entry.id,
          entidadeTipo: "lancamento",
          entidadeValor: valor,
          entidadeData: entry.entryDate,
          clientId: entry.clientId,
          status: "aberto",
          criadoEm: now.toISOString(),
        });
      }
    }

    // Regra 3 para notas fiscais: CNPJ inválido
    const notas = await getAllRecords<{
      id: string;
      clientId: string;
      cnpj?: string;
      valorTotal?: number;
      dataEmissao?: string;
    }>("notas_fiscais");

    for (const nota of notas) {
      if (nota.cnpj && !validarCNPJ(nota.cnpj)) {
        alertas.push({
          id: `fraud_cnpj_${nota.id}`,
          tipo: "cnpj_invalido",
          nivel: "alto",
          descricao: `CNPJ inválido '${nota.cnpj}' em nota fiscal`,
          detalhe: `Nota fiscal ${nota.id} contém CNPJ '${nota.cnpj}' com dígitos verificadores inválidos. Possível fraude ou erro.`,
          entidadeId: nota.id,
          entidadeTipo: "nota_fiscal",
          entidadeValor: nota.valorTotal,
          entidadeData: nota.dataEmissao,
          clientId: nota.clientId,
          status: "aberto",
          criadoEm: now.toISOString(),
        });
      }
    }

    // Save all to IndexedDB
    for (const alerta of alertas) {
      await putRecord(STORE, alerta);
    }
  } catch (err) {
    console.warn("Fraud analysis error:", err);
  }

  return alertas;
}

export async function getAllAlertas(): Promise<FraudeAlerta[]> {
  return getAllRecords<FraudeAlerta>(STORE);
}

export async function getAlertasByStatus(
  status: StatusAlerta,
): Promise<FraudeAlerta[]> {
  return getAllByIndex<FraudeAlerta>(STORE, "status", status);
}

export async function atualizarStatusAlerta(
  id: string,
  status: StatusAlerta,
  justificativa?: string,
  resolvidoPor?: string,
): Promise<void> {
  const all = await getAllRecords<FraudeAlerta>(STORE);
  const alerta = all.find((a) => a.id === id);
  if (!alerta) return;
  const updated: FraudeAlerta = {
    ...alerta,
    status,
    justificativa: justificativa ?? alerta.justificativa,
    resolvidoEm:
      status === "resolvido" || status === "falso_positivo"
        ? new Date().toISOString()
        : alerta.resolvidoEm,
    resolvidoPor:
      status === "resolvido" || status === "falso_positivo"
        ? (resolvidoPor ?? "Contador")
        : alerta.resolvidoPor,
  };
  await putRecord(STORE, updated);
}

export async function encaminharParaWorkflow(
  alerta: FraudeAlerta,
): Promise<void> {
  await createWorkflowItem(
    {
      tipo:
        alerta.entidadeTipo === "nota_fiscal" ? "nota_fiscal" : "lancamento",
      titulo: `Fraude detectada: ${alerta.descricao}`,
      descricao: alerta.detalhe,
      valor: alerta.entidadeValor,
      clientId: alerta.clientId,
      clientNome: alerta.clientNome,
      id_documento: alerta.entidadeId,
    },
    "ARIA (Detecção de Fraudes)",
  );
  await atualizarStatusAlerta(alerta.id, "em_analise", undefined, undefined);
}
