// ARIA CALENDAR — Calendario Fiscal Brasileiro

export type Regime =
  | "simples_nacional"
  | "lucro_presumido"
  | "lucro_real"
  | "mei"
  | "todos";

export interface FiscalObligation {
  id: string;
  name: string;
  description: string;
  regimes: Regime[];
  recurrence: "monthly" | "annual" | "quarterly" | "bimonthly";
  dueRule: string;
  getDueDate: (year: number, month: number) => Date;
  priority: "low" | "medium" | "high" | "critical";
}

function nthDayOfMonth(year: number, month: number, day: number): Date {
  const d = new Date(year, month - 1, day);
  const dow = d.getDay();
  if (dow === 0) d.setDate(d.getDate() + 1);
  else if (dow === 6) d.setDate(d.getDate() + 2);
  return d;
}

function lastBusinessDay(year: number, month: number): Date {
  const lastDay = new Date(year, month, 0);
  const dow = lastDay.getDay();
  if (dow === 0) lastDay.setDate(lastDay.getDate() - 2);
  else if (dow === 6) lastDay.setDate(lastDay.getDate() - 1);
  return lastDay;
}

export const FISCAL_OBLIGATIONS: FiscalObligation[] = [
  {
    id: "fgts",
    name: "FGTS",
    description: "Recolhimento mensal do FGTS",
    regimes: ["todos"],
    recurrence: "monthly",
    dueRule: "Dia 7 de cada mes",
    getDueDate: (year, month) => nthDayOfMonth(year, month, 7),
    priority: "critical",
  },
  {
    id: "esocial",
    name: "eSocial",
    description: "Envio de eventos periodicos ao eSocial",
    regimes: ["todos"],
    recurrence: "monthly",
    dueRule: "Dia 7 do mes seguinte a competencia",
    getDueDate: (year, month) => nthDayOfMonth(year, month, 7),
    priority: "high",
  },
  {
    id: "darf_irrf",
    name: "DARF — IRRF",
    description: "Imposto de Renda Retido na Fonte sobre salarios",
    regimes: ["lucro_real", "lucro_presumido"],
    recurrence: "monthly",
    dueRule: "Dia 20 de cada mes",
    getDueDate: (year, month) => nthDayOfMonth(year, month, 20),
    priority: "high",
  },
  {
    id: "das_simples",
    name: "DAS — Simples Nacional",
    description: "Documento de Arrecadacao do Simples Nacional",
    regimes: ["simples_nacional"],
    recurrence: "monthly",
    dueRule: "Dia 20 de cada mes",
    getDueDate: (year, month) => nthDayOfMonth(year, month, 20),
    priority: "critical",
  },
  {
    id: "das_mei",
    name: "DAS-MEI",
    description: "Documento de Arrecadacao do MEI",
    regimes: ["mei"],
    recurrence: "monthly",
    dueRule: "Dia 20 de cada mes",
    getDueDate: (year, month) => nthDayOfMonth(year, month, 20),
    priority: "high",
  },
  {
    id: "pis_cofins",
    name: "PIS/COFINS Cumulativo",
    description: "PIS e COFINS no regime cumulativo",
    regimes: ["lucro_presumido"],
    recurrence: "monthly",
    dueRule: "Ultimo dia util do 2o decendio do mes seguinte",
    getDueDate: (year, month) => nthDayOfMonth(year, month, 20),
    priority: "high",
  },
  {
    id: "csll_irpj",
    name: "CSLL/IRPJ — Estimativa Mensal",
    description: "Recolhimento por estimativa mensal (Lucro Real)",
    regimes: ["lucro_real"],
    recurrence: "monthly",
    dueRule: "Ultimo dia util do mes seguinte",
    getDueDate: (year, month) => lastBusinessDay(year, month),
    priority: "high",
  },
  {
    id: "dctf",
    name: "DCTF",
    description: "Declaracao de Debitos e Creditos Tributarios Federais",
    regimes: ["lucro_real", "lucro_presumido"],
    recurrence: "monthly",
    dueRule: "Dia 15 do 2o mes subsequente",
    getDueDate: (year, month) => new Date(year, month + 1, 15),
    priority: "high",
  },
];

export const ANNUAL_OBLIGATIONS = [
  {
    id: "ecd",
    name: "ECD — Escrituracao Contabil Digital",
    description: "Entrega da escrituracao contabil digital ao SPED",
    regimes: ["lucro_real", "lucro_presumido"] as Regime[],
    month: 6,
    dueRule: "Ultimo dia util de junho",
    priority: "critical" as const,
  },
  {
    id: "ecf",
    name: "ECF — Escrituracao Contabil Fiscal",
    description: "Escrituracao Contabil Fiscal para apuracao do IRPJ/CSLL",
    regimes: ["lucro_real", "lucro_presumido"] as Regime[],
    month: 7,
    dueRule: "Ultimo dia util de julho",
    priority: "critical" as const,
  },
  {
    id: "irpf_declaracao",
    name: "Declaracao de IRPF",
    description: "Declaracao anual de Imposto de Renda da Pessoa Fisica",
    regimes: ["todos"] as Regime[],
    month: 4,
    dueRule: "30 de abril",
    priority: "critical" as const,
  },
  {
    id: "rais",
    name: "RAIS",
    description: "Relacao Anual de Informacoes Sociais",
    regimes: ["todos"] as Regime[],
    month: 2,
    dueRule: "Fevereiro (prazo varia por ano)",
    priority: "high" as const,
  },
  {
    id: "dirf",
    name: "DIRF",
    description: "Declaracao do Imposto de Renda Retido na Fonte",
    regimes: ["lucro_real", "lucro_presumido"] as Regime[],
    month: 2,
    dueRule: "Ultimo dia util de fevereiro",
    priority: "high" as const,
  },
  {
    id: "defis",
    name: "DEFIS",
    description:
      "Declaracao de Informacoes Socioeconomicas e Fiscais — Simples Nacional",
    regimes: ["simples_nacional"] as Regime[],
    month: 3,
    dueRule: "31 de marco",
    priority: "high" as const,
  },
];

export function getObligationsForMonth(
  month: number,
  year: number,
  regime: Regime = "todos",
): Array<{ obligation: FiscalObligation; dueDate: Date }> {
  return FISCAL_OBLIGATIONS.filter(
    (o) =>
      o.regimes.includes("todos") ||
      o.regimes.includes(regime) ||
      regime === "todos",
  )
    .map((obligation) => ({
      obligation,
      dueDate: obligation.getDueDate(year, month),
    }))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export function getUpcomingDeadlines(
  daysAhead: number,
  regime: Regime = "todos",
): Array<{ obligation: FiscalObligation; dueDate: Date; daysUntil: number }> {
  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + daysAhead);
  const results: Array<{
    obligation: FiscalObligation;
    dueDate: Date;
    daysUntil: number;
  }> = [];
  for (let offset = 0; offset <= 2; offset++) {
    const checkDate = new Date(
      today.getFullYear(),
      today.getMonth() + offset,
      1,
    );
    const obligations = getObligationsForMonth(
      checkDate.getMonth() + 1,
      checkDate.getFullYear(),
      regime,
    );
    for (const { obligation, dueDate } of obligations) {
      if (dueDate >= today && dueDate <= future) {
        const daysUntil = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        results.push({ obligation, dueDate, daysUntil });
      }
    }
  }
  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function isDeadlineUrgent(date: Date): boolean {
  const today = new Date();
  const diffDays = Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diffDays >= 0 && diffDays <= 5;
}

export function getAnnualObligationsForMonth(
  month: number,
  regime: Regime = "todos",
) {
  return ANNUAL_OBLIGATIONS.filter(
    (o) =>
      o.month === month &&
      (o.regimes.includes("todos") ||
        o.regimes.includes(regime) ||
        regime === "todos"),
  );
}

export function formatDueDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
