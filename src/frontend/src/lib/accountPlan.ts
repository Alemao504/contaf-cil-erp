import type { AccountPlanEntry } from "../types/local";

export type { AccountPlanEntry };

export const DEFAULT_ACCOUNT_PLAN: AccountPlanEntry[] = [
  { code: "1.1.01", name: "Caixa", accountType: "Ativo" },
  { code: "1.1.02", name: "Banco", accountType: "Ativo" },
  { code: "1.1.03", name: "Contas a Receber", accountType: "Ativo" },
  { code: "1.2.01", name: "Imobilizado", accountType: "Ativo" },
  { code: "2.1.01", name: "Fornecedores", accountType: "Passivo" },
  { code: "2.1.02", name: "Impostos a Pagar", accountType: "Passivo" },
  { code: "2.1.03", name: "Salários a Pagar", accountType: "Passivo" },
  { code: "2.1.04", name: "FGTS a Recolher", accountType: "Passivo" },
  { code: "2.1.05", name: "INSS a Recolher", accountType: "Passivo" },
  { code: "3.1.01", name: "Capital Social", accountType: "PatrimonioLiquido" },
  {
    code: "3.1.02",
    name: "Lucros Acumulados",
    accountType: "PatrimonioLiquido",
  },
  { code: "4.1.01", name: "Receita de Serviços", accountType: "Receita" },
  { code: "4.1.02", name: "Outras Receitas", accountType: "Receita" },
  { code: "5.1.01", name: "Folha de Pagamento", accountType: "Despesa" },
  { code: "5.1.02", name: "Encargos Sociais", accountType: "Despesa" },
  { code: "5.1.03", name: "FGTS", accountType: "Despesa" },
  { code: "5.1.04", name: "Energia Elétrica", accountType: "Despesa" },
  { code: "5.1.05", name: "Aluguel", accountType: "Despesa" },
  { code: "5.1.06", name: "Impostos e Taxas", accountType: "Despesa" },
  { code: "5.1.07", name: "Outras Despesas", accountType: "Despesa" },
  { code: "5.1.08", name: "Pró-Labore", accountType: "Despesa" },
];

export function getAccountLabel(
  code: string,
  plan: AccountPlanEntry[],
): string {
  const entry = plan.find((e) => e.code === code);
  return entry ? `${code} - ${entry.name}` : code;
}

export function classifyDocument(
  filename: string,
): { debitCode: string; creditCode: string; description: string } | null {
  const f = filename.toLowerCase();
  if (f.includes("folha") || f.includes("salario") || f.includes("holerite")) {
    return {
      debitCode: "5.1.01",
      creditCode: "2.1.03",
      description: "Folha de pagamento",
    };
  }
  if (f.includes("fgts")) {
    return { debitCode: "5.1.03", creditCode: "2.1.04", description: "FGTS" };
  }
  if (f.includes("inss") || f.includes("encargo")) {
    return {
      debitCode: "5.1.02",
      creditCode: "2.1.05",
      description: "Encargos sociais",
    };
  }
  if (f.includes("energia") || f.includes("luz") || f.includes("eletric")) {
    return {
      debitCode: "5.1.04",
      creditCode: "1.1.02",
      description: "Conta de energia elétrica",
    };
  }
  if (f.includes("aluguel") || f.includes("locacao") || f.includes("locação")) {
    return {
      debitCode: "5.1.05",
      creditCode: "1.1.02",
      description: "Aluguel",
    };
  }
  if (
    f.includes("imposto") ||
    f.includes("tributo") ||
    f.includes("das") ||
    f.includes("darf")
  ) {
    return {
      debitCode: "5.1.06",
      creditCode: "1.1.02",
      description: "Impostos e taxas",
    };
  }
  if (
    f.includes("nf") ||
    f.includes("nota") ||
    f.includes("receita") ||
    f.includes("servico") ||
    f.includes("serviço")
  ) {
    return {
      debitCode: "1.1.02",
      creditCode: "4.1.01",
      description: "Receita de serviços",
    };
  }
  return null;
}
