// ARIA KNOWLEDGE — Base de Conhecimento Contabil e Fiscal

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

export const NBC_TG_KNOWLEDGE: Record<string, KnowledgeEntry> = {
  nbc_tg_1000: {
    id: "nbc_tg_1000",
    title: "NBC TG 1000 — Contabilidade para Pequenas e Medias Empresas",
    category: "nbc_tg",
    content:
      "Estabelece requisitos de reconhecimento, mensuracao, apresentacao e divulgacao para PMEs. Define estrutura completa de demonstracoes: BP, DRE, DLPA, DFC e Notas Explicativas. Isenta de algumas exigencias do CPC completo.",
    tags: ["pme", "demonstracoes", "contabilidade", "nbc"],
    updatedAt: "2024-01-01",
  },
  nbc_tg_26: {
    id: "nbc_tg_26",
    title: "NBC TG 26 — Apresentacao das Demonstracoes Contabeis",
    category: "nbc_tg",
    content:
      "Define requisitos gerais para apresentacao das demonstracoes contabeis. Inclui Balanco Patrimonial, Demonstracao do Resultado, DFC e DMPL. Cada demonstracao deve ter periodo comparativo.",
    tags: ["demonstracoes", "balanco", "dre", "apresentacao"],
    updatedAt: "2024-01-01",
  },
  nbc_tg_27: {
    id: "nbc_tg_27",
    title: "NBC TG 27 — Ativo Imobilizado",
    category: "nbc_tg",
    content:
      "Trata do reconhecimento e mensuracao do imobilizado. Define criterios de depreciacao (linear, soma dos digitos, unidades produzidas). Vida util deve ser revisada anualmente. Custo historico ou reavaliacao.",
    tags: ["imobilizado", "depreciacao", "ativo", "patrimonio"],
    updatedAt: "2024-01-01",
  },
};

export const SPED_OBLIGATIONS: Record<string, string[]> = {
  lucro_real: [
    "ECD",
    "ECF",
    "EFD_ICMS_IPI",
    "EFD_Contribuicoes",
    "eSocial",
    "DCTF",
    "DIRPF",
  ],
  lucro_presumido: ["ECD", "ECF", "EFD_ICMS_IPI", "eSocial", "DCTF"],
  simples_nacional: ["DEFIS", "DASN", "EFD_ICMS_IPI_SE", "eSocial"],
  mei: ["DASN_SIMEI"],
};

export const ACCOUNTING_DICTIONARY: Record<string, string> = {
  "Ativo Circulante": "Current Assets",
  "Ativo Nao Circulante": "Non-Current Assets",
  "Passivo Circulante": "Current Liabilities",
  "Passivo Nao Circulante": "Non-Current Liabilities",
  "Patrimonio Liquido": "Shareholders Equity",
  "Demonstracao do Resultado": "Income Statement",
  "Balanco Patrimonial": "Balance Sheet",
  "Fluxo de Caixa": "Cash Flow Statement",
  "Lucro Bruto": "Gross Profit",
  "Lucro Liquido": "Net Income",
  "Receita Bruta": "Gross Revenue",
  "Custo dos Produtos Vendidos": "Cost of Goods Sold",
  "Despesas Operacionais": "Operating Expenses",
  Depreciacao: "Depreciation",
  Amortizacao: "Amortization",
  Imobilizado: "Property, Plant & Equipment",
  Intangivel: "Intangible Assets",
  Provisao: "Provision",
  "Contas a Receber": "Accounts Receivable",
  "Contas a Pagar": "Accounts Payable",
  Estoque: "Inventory",
  "Capital Social": "Share Capital",
  Reservas: "Reserves",
};

export const REGIME_COMPARISON: Record<
  string,
  {
    nome: string;
    limite_faturamento: number | null;
    vantagens: string[];
    desvantagens: string[];
    indicado_para: string;
  }
> = {
  simples_nacional: {
    nome: "Simples Nacional",
    limite_faturamento: 4800000,
    vantagens: [
      "Pagamento unificado via DAS",
      "Aliquotas reduzidas para baixo faturamento",
      "Menos obrigacoes acessorias",
      "Processo simplificado",
    ],
    desvantagens: [
      "Limite de faturamento R$ 4,8 milhoes/ano",
      "Aliquotas crescentes com faturamento",
      "Nao permite credito de ICMS/PIS/COFINS",
    ],
    indicado_para:
      "Empresas com faturamento ate R$ 4,8M com atividades comerciais/servicos simples",
  },
  lucro_presumido: {
    nome: "Lucro Presumido",
    limite_faturamento: 78000000,
    vantagens: [
      "Calculo simplificado do IRPJ/CSLL",
      "Previsibilidade da carga tributaria",
    ],
    desvantagens: [
      "Paga IR mesmo com prejuizo",
      "Nao aproveita prejuizos fiscais",
    ],
    indicado_para:
      "Empresas com margem acima do percentual presumido e faturamento ate R$ 78M",
  },
  lucro_real: {
    nome: "Lucro Real",
    limite_faturamento: null,
    vantagens: [
      "Paga IR apenas sobre lucro real",
      "Aproveita prejuizos fiscais",
      "Credito de PIS/COFINS nao cumulativo",
    ],
    desvantagens: [
      "Maior complexidade contabil",
      "Mais obrigacoes acessorias",
      "Custos administrativos maiores",
    ],
    indicado_para:
      "Empresas com margem baixa, prejuizo frequente ou faturamento > R$ 78M",
  },
};

export const ESOCIAL_EVENTS = [
  { codigo: "S-1000", descricao: "Informacoes do Empregador", tipo: "tabela" },
  { codigo: "S-1005", descricao: "Tabela de Estabelecimentos", tipo: "tabela" },
  {
    codigo: "S-1020",
    descricao: "Tabela de Lotacoes Tributarias",
    tipo: "tabela",
  },
  { codigo: "S-1030", descricao: "Tabela de Cargos/Empregos", tipo: "tabela" },
  {
    codigo: "S-1200",
    descricao: "Remuneracao do Trabalhador",
    tipo: "nao_periodico",
  },
  {
    codigo: "S-2200",
    descricao: "Cadastramento Inicial do Vinculo",
    tipo: "nao_periodico",
  },
  {
    codigo: "S-2205",
    descricao: "Alteracao de Dados Cadastrais",
    tipo: "nao_periodico",
  },
  {
    codigo: "S-2230",
    descricao: "Afastamento Temporario",
    tipo: "nao_periodico",
  },
  { codigo: "S-2299", descricao: "Desligamento", tipo: "nao_periodico" },
  {
    codigo: "S-5001",
    descricao: "Informacoes das Contribuicoes",
    tipo: "retorno",
  },
  {
    codigo: "S-5002",
    descricao: "Imposto de Renda Retido na Fonte",
    tipo: "retorno",
  },
];

export const DCTF_TRIBUTOS = [
  "IRPJ",
  "CSLL",
  "PIS/Pasep",
  "COFINS",
  "IPI",
  "CIDE-Combustiveis",
  "Contribuicao Previdenciaria",
];

const ALL_KNOWLEDGE: KnowledgeEntry[] = Object.values(NBC_TG_KNOWLEDGE);

export function getKnowledge(topic: string): KnowledgeEntry | undefined {
  return ALL_KNOWLEDGE.find(
    (k) =>
      k.id === topic || k.title.toLowerCase().includes(topic.toLowerCase()),
  );
}

export function searchKnowledge(query: string): KnowledgeEntry[] {
  const q = query.toLowerCase();
  return ALL_KNOWLEDGE.filter(
    (k) =>
      k.title.toLowerCase().includes(q) ||
      k.content.toLowerCase().includes(q) ||
      k.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

export function getRegimeObligations(regime: string): string[] {
  return SPED_OBLIGATIONS[regime] ?? [];
}

export function translateTerm(ptTerm: string): string {
  return ACCOUNTING_DICTIONARY[ptTerm] ?? ptTerm;
}
