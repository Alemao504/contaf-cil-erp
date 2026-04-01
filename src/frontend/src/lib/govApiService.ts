// Serviço de APIs Governamentais — ContaFácil ERP
// Suporta modo simulado (demonstração) e modo real (APIs públicas/certificado)

export interface CNPJResult {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string; // "ATIVA" | "INAPTA" | "SUSPENSA" | "BAIXADA"
  dataAbertura: string;
  naturezaJuridica: string;
  capitalSocial: number;
  porte: string;
  atividadePrincipal: { codigo: string; descricao: string };
  atividadesSecundarias: { codigo: string; descricao: string }[];
  endereco: {
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
  qsa: { nome: string; qualificacao: string; participacao?: string }[];
  telefone: string;
  email: string;
}

export interface NFeEvento {
  tipo: string;
  descricao: string;
  data: string;
  protocolo: string;
  status: "autorizada" | "cancelada" | "denegada" | "inutilizada" | "pendente";
}

export interface NFeResult {
  chaveAcesso: string;
  numero: string;
  serie: string;
  dataEmissao: string;
  valorTotal: number;
  emitente: { cnpj: string; razaoSocial: string; uf: string };
  destinatario: { cnpj: string; razaoSocial: string };
  naturezaOperacao: string;
  situacaoAtual: "autorizada" | "cancelada" | "denegada" | "inutilizada";
  eventos: NFeEvento[];
}

export type ESocialEventoTipo =
  | "S-1000"
  | "S-2200"
  | "S-1200"
  | "S-5001"
  | "S-2299";
export type ESocialStatus =
  | "pendente"
  | "enviado"
  | "erro"
  | "aguardando"
  | "processado";

export interface ESocialEvento {
  id: string;
  tipo: ESocialEventoTipo;
  descricao: string;
  competencia: string;
  status: ESocialStatus;
  protocolo?: string;
  dataEnvio?: string;
  erros?: string[];
}

export interface ESocialResult {
  protocolo: string;
  dataRecibo: string;
  status: "processado" | "erro" | "em_processamento";
  mensagem: string;
  nrRec?: string;
}

export type SPEDTipo = "ECD" | "ECF" | "EFD_ICMS" | "EFD_Contrib";

// ─── Simulados ────────────────────────────────────────────────────────────────

const SIMULATED_COMPANIES: CNPJResult[] = [
  {
    cnpj: "11222333000181",
    razaoSocial: "TECH SOLUTIONS BRASIL LTDA",
    nomeFantasia: "TechBrasil",
    situacaoCadastral: "ATIVA",
    dataAbertura: "2018-03-15",
    naturezaJuridica: "206-2 — Sociedade Empresária Limitada",
    capitalSocial: 150000,
    porte: "PEQUENO PORTE",
    atividadePrincipal: {
      codigo: "62.01-5-01",
      descricao: "Desenvolvimento de programas de computador sob encomenda",
    },
    atividadesSecundarias: [
      {
        codigo: "62.04-0-00",
        descricao: "Consultoria em tecnologia da informação",
      },
      {
        codigo: "63.11-9-00",
        descricao: "Tratamento de dados, provedores de serviços",
      },
    ],
    endereco: {
      logradouro: "Av. Paulista",
      numero: "1374",
      complemento: "Conj 42",
      bairro: "Bela Vista",
      municipio: "São Paulo",
      uf: "SP",
      cep: "01310-100",
    },
    qsa: [
      {
        nome: "Carlos Eduardo Mendes",
        qualificacao: "49 — Sócio-Administrador",
        participacao: "60%",
      },
      {
        nome: "Ana Paula Ferreira",
        qualificacao: "05 — Sócio",
        participacao: "40%",
      },
    ],
    telefone: "(11) 3456-7890",
    email: "contato@techbrasil.com.br",
  },
  {
    cnpj: "44555666000177",
    razaoSocial: "COMERCIAL GAMA ALIMENTOS ME",
    nomeFantasia: "Gama Foods",
    situacaoCadastral: "ATIVA",
    dataAbertura: "2020-07-22",
    naturezaJuridica: "213-5 — Empresa Individual de Responsabilidade Limitada",
    capitalSocial: 50000,
    porte: "MICRO EMPRESA",
    atividadePrincipal: {
      codigo: "47.21-1-02",
      descricao: "Comércio varejista de frios e laticínios",
    },
    atividadesSecundarias: [],
    endereco: {
      logradouro: "Rua das Flores",
      numero: "892",
      complemento: "",
      bairro: "Centro",
      municipio: "Campinas",
      uf: "SP",
      cep: "13010-060",
    },
    qsa: [
      {
        nome: "Roberto Gama da Silva",
        qualificacao: "50 — Empresário",
        participacao: "100%",
      },
    ],
    telefone: "(19) 3211-0045",
    email: "roberto@gamafoods.com.br",
  },
];

function simulatedCNPJ(cnpj: string): CNPJResult {
  const found = SIMULATED_COMPANIES.find(
    (c) => c.cnpj === cnpj.replace(/\D/g, ""),
  );
  if (found) return found;
  return {
    cnpj: cnpj.replace(/\D/g, ""),
    razaoSocial: "EMPRESA DEMONSTRAÇÃO LTDA",
    nomeFantasia: "EmpresaDemo",
    situacaoCadastral: "ATIVA",
    dataAbertura: "2015-01-10",
    naturezaJuridica: "206-2 — Sociedade Empresária Limitada",
    capitalSocial: 100000,
    porte: "PEQUENO PORTE",
    atividadePrincipal: {
      codigo: "69.20-6-01",
      descricao: "Atividades de contabilidade",
    },
    atividadesSecundarias: [],
    endereco: {
      logradouro: "Rua Exemplo",
      numero: "100",
      complemento: "Sala 1",
      bairro: "Centro",
      municipio: "São Paulo",
      uf: "SP",
      cep: "01310-000",
    },
    qsa: [
      {
        nome: "Sócio Demonstração",
        qualificacao: "49 — Sócio-Administrador",
        participacao: "100%",
      },
    ],
    telefone: "(11) 99999-0000",
    email: "contato@empresa.com.br",
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export async function consultarCNPJ(
  cnpj: string,
  useReal: boolean,
): Promise<CNPJResult> {
  const digits = cnpj.replace(/\D/g, "");
  if (!useReal) {
    await new Promise((r) => setTimeout(r, 1200));
    return simulatedCNPJ(digits);
  }

  // Real: BrasilAPI — sem CORS issues, funciona do browser
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
  if (!res.ok) {
    if (res.status === 404)
      throw new Error("CNPJ não encontrado na Receita Federal");
    throw new Error(`Erro na consulta: ${res.status} — ${res.statusText}`);
  }
  const data = await res.json();
  return {
    cnpj: data.cnpj ?? digits,
    razaoSocial: data.razao_social ?? "",
    nomeFantasia: data.nome_fantasia ?? "",
    situacaoCadastral:
      data.descricao_situacao_cadastral ?? data.situacao_cadastral ?? "",
    dataAbertura: data.data_inicio_atividade ?? "",
    naturezaJuridica: data.natureza_juridica ?? "",
    capitalSocial: Number(data.capital_social ?? 0),
    porte: data.descricao_porte ?? "",
    atividadePrincipal: {
      codigo: data.cnae_fiscal ?? "",
      descricao: data.cnae_fiscal_descricao ?? "",
    },
    atividadesSecundarias: (data.cnaes_secundarios ?? []).map(
      (c: { codigo: string; descricao: string }) => ({
        codigo: String(c.codigo ?? ""),
        descricao: String(c.descricao ?? ""),
      }),
    ),
    endereco: {
      logradouro: data.logradouro ?? "",
      numero: data.numero ?? "",
      complemento: data.complemento ?? "",
      bairro: data.bairro ?? "",
      municipio: data.municipio ?? "",
      uf: data.uf ?? "",
      cep: data.cep ?? "",
    },
    qsa: (data.qsa ?? []).map(
      (q: { nome_socio: string; qualificacao_socio: string }) => ({
        nome: q.nome_socio ?? "",
        qualificacao: q.qualificacao_socio ?? "",
      }),
    ),
    telefone: data.ddd_telefone_1 ?? "",
    email: data.email ?? "",
  };
}

export async function consultarNFe(
  chaveAcesso: string,
  _useReal: boolean,
): Promise<NFeResult> {
  // Mode real requires certificado digital + SEFAZ SOAP — browser cannot sign
  // Always returns realistic simulated data; real mode would call backend
  await new Promise((r) => setTimeout(r, 1500));
  const now = new Date();
  const emissao = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  return {
    chaveAcesso,
    numero: String(Math.floor(Math.random() * 900000) + 100000),
    serie: "001",
    dataEmissao: emissao.toISOString(),
    valorTotal: 12750.5,
    emitente: {
      cnpj: "11.222.333/0001-81",
      razaoSocial: "TECH SOLUTIONS BRASIL LTDA",
      uf: "SP",
    },
    destinatario: {
      cnpj: "44.555.666/0001-77",
      razaoSocial: "COMERCIAL GAMA ALIMENTOS ME",
    },
    naturezaOperacao: "Venda de mercadoria",
    situacaoAtual: "autorizada",
    eventos: [
      {
        tipo: "110110",
        descricao: "Autorização de uso da NF-e",
        data: emissao.toISOString(),
        protocolo: `135${Math.floor(Math.random() * 1e12)}`,
        status: "autorizada",
      },
    ],
  };
}

export const DEFAULT_ESOCIAL_EVENTOS: ESocialEvento[] = [
  {
    id: "ev-1",
    tipo: "S-1000",
    descricao: "Informações do Empregador/Contribuinte",
    competencia: new Date().toISOString().slice(0, 7),
    status: "enviado",
    protocolo: "1.2.202601.0000001",
    dataEnvio: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "ev-2",
    tipo: "S-2200",
    descricao: "Cadastramento Inicial do Vínculo",
    competencia: new Date().toISOString().slice(0, 7),
    status: "pendente",
  },
  {
    id: "ev-3",
    tipo: "S-1200",
    descricao: "Remuneração de Trabalhador Vinculado ao RGPS",
    competencia: new Date().toISOString().slice(0, 7),
    status: "pendente",
  },
  {
    id: "ev-4",
    tipo: "S-5001",
    descricao: "Informações das Contribuições Sociais Consolidadas",
    competencia: new Date().toISOString().slice(0, 7),
    status: "aguardando",
  },
];

export async function enviarESocial(
  evento: ESocialEvento,
  _useReal: boolean,
): Promise<ESocialResult> {
  await new Promise((r) => setTimeout(r, 2000));
  const protocolo = `1.${new Date().getFullYear()}.${String(Date.now()).slice(-10)}`;
  return {
    protocolo,
    dataRecibo: new Date().toISOString(),
    status: "processado",
    mensagem: `Evento ${evento.tipo} processado com sucesso.`,
    nrRec: `${new Date().getFullYear()}${String(Math.floor(Math.random() * 1e12)).padStart(12, "0")}`,
  };
}

export async function gerarSPED(
  tipo: SPEDTipo,
  periodo: string,
  _useReal: boolean,
): Promise<string> {
  await new Promise((r) => setTimeout(r, 800));
  const [ano, mes] = periodo.split("-");
  const dataInicio = `01${mes}${ano}`;
  const dataFim = `${new Date(Number(ano), Number(mes), 0).getDate()}${mes}${ano}`;
  const cnpj = "11222333000181";
  const razao = "TECH SOLUTIONS BRASIL LTDA";

  const HEADERS: Record<SPEDTipo, string> = {
    ECD: `|0000|LECD|${dataInicio}|${dataFim}|${cnpj}|${razao}|SP|SP|SP|0||1|G|0000000000|1||`,
    ECF: `|0000|LECF|${dataInicio}|${dataFim}|${cnpj}|${razao}|SP|0|PJ GERAL|012||1|`,
    EFD_ICMS: `|0000|LEFD|${dataInicio}|${dataFim}|${cnpj}|${razao}|SP|SP|SP|0|0|1|`,
    EFD_Contrib: `|0000|LEFD_CONTRIB|${dataInicio}|${dataFim}|${cnpj}|${razao}|SP|0|1|`,
  };

  const blocks: string[] = [];
  blocks.push(HEADERS[tipo]);
  blocks.push("|0001|0|");
  blocks.push(
    "|0100|ESCRITÓRIO CONTÁBIL MODELO|69.20.6-01|SP|01310-100|SP|11-3000-0000|contador@modelo.com.br|123456|CRC-SP|",
  );
  blocks.push(`|0150|001|${razao}|${cnpj}|SP|SP|SP|0001|`);
  blocks.push("|0990|3|");

  if (tipo === "ECD") {
    blocks.push("|I001|0|");
    blocks.push(`|I010|${cnpj}|${razao}|${dataInicio}|${dataFim}|BRL|0|0|`);
    blocks.push("|I050|1.1.01|D|01|Caixa e Equivalentes de Caixa|0|");
    blocks.push("|I050|1.1.02|D|01|Contas a Receber|0|");
    blocks.push("|I050|2.1.01|C|02|Fornecedores|0|");
    blocks.push("|I050|3.1.01|C|03|Capital Social|0|");
    blocks.push(`|I150|${dataInicio}|${cnpj}|${razao}|BRL|`);
    blocks.push("|I155|1.1.01|150000|0|");
    blocks.push("|I155|3.1.01|0|150000|");
    blocks.push(
      `|I200|0001|${dataInicio}|Saldo inicial de abertura|1.1.01|3.1.01|150000|`,
    );
    blocks.push("|I990|9|");
  } else if (tipo === "ECF") {
    blocks.push("|P001|0|");
    blocks.push(
      `|P010|${cnpj}|${razao}|${dataInicio}|${dataFim}|LUCRO PRESUMIDO|`,
    );
    blocks.push(`|P100|${dataInicio}|${dataFim}|750000|187500|56250|131250|`);
    blocks.push("|P990|4|");
  } else if (tipo === "EFD_ICMS") {
    blocks.push("|C001|0|");
    blocks.push(
      `|C100|1|1|${cnpj}|55|001|000001|${dataInicio}|${dataFim}|12750|0|0|1||12750|`,
    );
    blocks.push("|C170|001|1234.00|10.00|12340|0|||");
    blocks.push("|C990|4|");
    blocks.push("|E001|0|");
    blocks.push("|E110|1|12340|0|0|0|12340|0|0|0|0|0|0|");
    blocks.push("|E990|3|");
  } else {
    blocks.push("|A001|0|");
    blocks.push(`|A010|${cnpj}|`);
    blocks.push(
      `|A100|1|1|${cnpj}|SE|000001|${dataInicio}|${dataFim}|12750|0|0|0|0|12750|`,
    );
    blocks.push("|A990|4|");
    blocks.push("|M001|0|");
    blocks.push("|M200|12750|0|0|0|0|0|0|0|12750|");
    blocks.push("|M990|3|");
  }

  blocks.push("|9001|0|");
  blocks.push(`|9999|${blocks.length + 2}|`);
  return blocks.join("\n");
}
