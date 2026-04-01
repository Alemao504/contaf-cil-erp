// ARIA VALIDATOR — Funcoes de Validacao de Dados

export interface ValidationResult {
  valid: boolean;
  message: string;
  field?: string;
}

export function validateCPF(cpf: string): ValidationResult {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) {
    return { valid: false, message: "CPF deve ter 11 digitos.", field: "cpf" };
  }
  if (/^(\d)\1+$/.test(cleaned)) {
    return {
      valid: false,
      message: "CPF invalido (sequencia repetida).",
      field: "cpf",
    };
  }
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number.parseInt(cleaned[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== Number.parseInt(cleaned[9])) {
    return {
      valid: false,
      message: "CPF invalido — digito verificador incorreto.",
      field: "cpf",
    };
  }
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number.parseInt(cleaned[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== Number.parseInt(cleaned[10])) {
    return {
      valid: false,
      message: "CPF invalido — digito verificador incorreto.",
      field: "cpf",
    };
  }
  return { valid: true, message: "CPF valido." };
}

export function validateCNPJ(cnpj: string): ValidationResult {
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) {
    return {
      valid: false,
      message: "CNPJ deve ter 14 digitos.",
      field: "cnpj",
    };
  }
  if (/^(\d)\1+$/.test(cleaned)) {
    return {
      valid: false,
      message: "CNPJ invalido (sequencia repetida).",
      field: "cnpj",
    };
  }
  const calcDigit = (base: string, weights: number[]): number => {
    const sum = base
      .split("")
      .reduce((acc, char, i) => acc + Number.parseInt(char) * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  if (
    calcDigit(cleaned.substring(0, 12), w1) !== Number.parseInt(cleaned[12])
  ) {
    return {
      valid: false,
      message: "CNPJ invalido — primeiro digito verificador incorreto.",
      field: "cnpj",
    };
  }
  if (
    calcDigit(cleaned.substring(0, 13), w2) !== Number.parseInt(cleaned[13])
  ) {
    return {
      valid: false,
      message: "CNPJ invalido — segundo digito verificador incorreto.",
      field: "cnpj",
    };
  }
  return { valid: true, message: "CNPJ valido." };
}

export interface ClienteData {
  nome?: string;
  cpf?: string;
  cnpj?: string;
  regime?: string;
  email?: string;
}

export function validateClient(client: ClienteData): ValidationResult {
  if (!client.nome || client.nome.trim().length < 3) {
    return {
      valid: false,
      message: "Nome do cliente e obrigatorio (minimo 3 caracteres).",
      field: "nome",
    };
  }
  const hasCPF = client.cpf && client.cpf.replace(/\D/g, "").length > 0;
  const hasCNPJ = client.cnpj && client.cnpj.replace(/\D/g, "").length > 0;
  if (!hasCPF && !hasCNPJ) {
    return {
      valid: false,
      message: "CPF ou CNPJ e obrigatorio.",
      field: "cpf",
    };
  }
  if (hasCPF) {
    const r = validateCPF(client.cpf!);
    if (!r.valid) return r;
  }
  if (hasCNPJ) {
    const r = validateCNPJ(client.cnpj!);
    if (!r.valid) return r;
  }
  if (!client.regime) {
    return {
      valid: false,
      message: "Regime tributario e obrigatorio.",
      field: "regime",
    };
  }
  const regimesValidos = [
    "simples_nacional",
    "lucro_presumido",
    "lucro_real",
    "mei",
    "pessoa_fisica",
  ];
  if (!regimesValidos.includes(client.regime)) {
    return {
      valid: false,
      message: "Regime tributario invalido.",
      field: "regime",
    };
  }
  return { valid: true, message: "Cliente valido." };
}

export interface LancamentoData {
  conta?: string;
  contrapartida?: string;
  valor?: number;
  data?: string;
  historico?: string;
}

export function validateLancamento(lanc: LancamentoData): ValidationResult {
  if (!lanc.conta || lanc.conta.trim().length === 0) {
    return {
      valid: false,
      message: "Conta contabil e obrigatoria.",
      field: "conta",
    };
  }
  if (!lanc.contrapartida || lanc.contrapartida.trim().length === 0) {
    return {
      valid: false,
      message: "Contrapartida e obrigatoria.",
      field: "contrapartida",
    };
  }
  if (
    lanc.valor === undefined ||
    lanc.valor === null ||
    Number.isNaN(lanc.valor)
  ) {
    return {
      valid: false,
      message: "Valor e obrigatorio e deve ser numerico.",
      field: "valor",
    };
  }
  if (lanc.valor <= 0) {
    return {
      valid: false,
      message: "Valor deve ser maior que zero.",
      field: "valor",
    };
  }
  if (!lanc.data || lanc.data.trim().length === 0) {
    return {
      valid: false,
      message: "Data do lancamento e obrigatoria.",
      field: "data",
    };
  }
  if (!lanc.historico || lanc.historico.trim().length < 5) {
    return {
      valid: false,
      message: "Historico e obrigatorio (minimo 5 caracteres).",
      field: "historico",
    };
  }
  return { valid: true, message: "Lancamento valido." };
}

export interface IRPFData {
  clienteId?: string;
  anoBase?: number;
  rendimentosTributaveis?: number;
  rendimentosIsentos?: number;
  deducoes?: {
    saude?: number;
    educacao?: number;
    previdencia?: number;
    dependentes?: number;
  };
}

export function validateIRPF(data: IRPFData): ValidationResult {
  if (!data.clienteId) {
    return {
      valid: false,
      message: "Cliente nao selecionado para a declaracao.",
      field: "clienteId",
    };
  }
  if (
    !data.anoBase ||
    data.anoBase < 2020 ||
    data.anoBase > new Date().getFullYear()
  ) {
    return {
      valid: false,
      message: "Ano-base invalido para a declaracao de IRPF.",
      field: "anoBase",
    };
  }
  if (
    data.rendimentosTributaveis === undefined ||
    data.rendimentosTributaveis < 0
  ) {
    return {
      valid: false,
      message: "Rendimentos tributaveis devem ser informados.",
      field: "rendimentosTributaveis",
    };
  }
  return { valid: true, message: "Dados de IRPF validos." };
}

export interface NFeData {
  emitenteCNPJ?: string;
  destinatarioCPFCNPJ?: string;
  valor?: number;
  data?: string;
  naturezaOperacao?: string;
  cfop?: string;
}

export function validateNFe(nfe: NFeData): ValidationResult {
  if (!nfe.emitenteCNPJ) {
    return {
      valid: false,
      message: "CNPJ do emitente e obrigatorio.",
      field: "emitenteCNPJ",
    };
  }
  const cnpjResult = validateCNPJ(nfe.emitenteCNPJ);
  if (!cnpjResult.valid) return { ...cnpjResult, field: "emitenteCNPJ" };
  if (!nfe.destinatarioCPFCNPJ) {
    return {
      valid: false,
      message: "CPF/CNPJ do destinatario e obrigatorio.",
      field: "destinatarioCPFCNPJ",
    };
  }
  if (nfe.valor === undefined || nfe.valor <= 0) {
    return {
      valid: false,
      message: "Valor da nota fiscal deve ser maior que zero.",
      field: "valor",
    };
  }
  if (!nfe.data) {
    return {
      valid: false,
      message: "Data de emissao e obrigatoria.",
      field: "data",
    };
  }
  if (!nfe.naturezaOperacao || nfe.naturezaOperacao.trim().length < 3) {
    return {
      valid: false,
      message: "Natureza da operacao e obrigatoria.",
      field: "naturezaOperacao",
    };
  }
  if (!nfe.cfop || !/^\d{4}$/.test(nfe.cfop)) {
    return {
      valid: false,
      message: "CFOP invalido — deve ter 4 digitos.",
      field: "cfop",
    };
  }
  return { valid: true, message: "NF-e valida." };
}

export interface FolhaData {
  funcionario?: string;
  cpfFuncionario?: string;
  salarioBruto?: number;
  competencia?: string;
  cargo?: string;
}

export function validateFolha(folha: FolhaData): ValidationResult {
  if (!folha.funcionario || folha.funcionario.trim().length < 3) {
    return {
      valid: false,
      message: "Nome do funcionario e obrigatorio.",
      field: "funcionario",
    };
  }
  if (folha.cpfFuncionario) {
    const r = validateCPF(folha.cpfFuncionario);
    if (!r.valid) return { ...r, field: "cpfFuncionario" };
  }
  if (folha.salarioBruto === undefined || folha.salarioBruto <= 0) {
    return {
      valid: false,
      message: "Salario bruto deve ser maior que zero.",
      field: "salarioBruto",
    };
  }
  if (folha.salarioBruto < 1412) {
    return {
      valid: false,
      message: "Salario nao pode ser inferior ao salario minimo (R$ 1.412,00).",
      field: "salarioBruto",
    };
  }
  if (
    !folha.competencia ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(folha.competencia)
  ) {
    return {
      valid: false,
      message: "Competencia invalida — use o formato AAAA-MM.",
      field: "competencia",
    };
  }
  if (!folha.cargo || folha.cargo.trim().length < 2) {
    return { valid: false, message: "Cargo e obrigatorio.", field: "cargo" };
  }
  return { valid: true, message: "Folha de pagamento valida." };
}

export function validateAll(items: ValidationResult[]): ValidationResult {
  const failed = items.find((r) => !r.valid);
  if (failed) return failed;
  return { valid: true, message: "Todas as validacoes passaram." };
}
