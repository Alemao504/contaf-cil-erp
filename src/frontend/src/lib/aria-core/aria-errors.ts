// ARIA ERRORS — Catalogo Completo de Erros

export type ErrorSeverity = "low" | "medium" | "high" | "critical";
export type ErrorCategory =
  | "validation"
  | "fiscal"
  | "data"
  | "system"
  | "integration"
  | "deadline"
  | "compliance";

export interface ARIAError {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  correctiveAction: string;
  canAutoFix: boolean;
}

const VALIDATION_ERRORS: Record<string, ARIAError> = {
  CPF_INVALID: {
    code: "CPF_INVALID",
    category: "validation",
    severity: "high",
    message: "CPF com formato ou digito verificador invalido.",
    userMessage: "O CPF informado e invalido.",
    correctiveAction: "Solicitar ao contador a correcao do CPF do cliente.",
    canAutoFix: false,
  },
  CNPJ_INVALID: {
    code: "CNPJ_INVALID",
    category: "validation",
    severity: "high",
    message: "CNPJ com formato ou digito verificador invalido.",
    userMessage: "O CNPJ informado e invalido.",
    correctiveAction: "Verificar o CNPJ junto ao cartao CNPJ da empresa.",
    canAutoFix: false,
  },
  CNPJ_NOT_FOUND: {
    code: "CNPJ_NOT_FOUND",
    category: "validation",
    severity: "medium",
    message: "CNPJ nao encontrado na base da Receita Federal.",
    userMessage: "CNPJ nao encontrado. Verifique o cadastro.",
    correctiveAction: "Consultar situacao do CNPJ no site da Receita Federal.",
    canAutoFix: false,
  },
  CAMPO_OBRIGATORIO: {
    code: "CAMPO_OBRIGATORIO",
    category: "validation",
    severity: "medium",
    message: "Campo obrigatorio nao preenchido.",
    userMessage: "Ha campos obrigatorios em branco.",
    correctiveAction:
      "Preencher todos os campos destacados antes de continuar.",
    canAutoFix: false,
  },
  VALOR_NEGATIVO: {
    code: "VALOR_NEGATIVO",
    category: "validation",
    severity: "medium",
    message: "Valor nao pode ser negativo neste contexto.",
    userMessage: "O valor informado nao pode ser negativo.",
    correctiveAction: "Corrigir o valor para um numero positivo.",
    canAutoFix: false,
  },
  DATA_INVALIDA: {
    code: "DATA_INVALIDA",
    category: "validation",
    severity: "medium",
    message: "Data em formato invalido ou fora do intervalo permitido.",
    userMessage: "A data informada e invalida.",
    correctiveAction: "Informar a data no formato correto (DD/MM/AAAA).",
    canAutoFix: false,
  },
};

const FISCAL_ERRORS: Record<string, ARIAError> = {
  IRPF_INCOMPLETE: {
    code: "IRPF_INCOMPLETE",
    category: "fiscal",
    severity: "high",
    message: "Declaracao de IRPF com campos obrigatorios nao preenchidos.",
    userMessage: "A declaracao de IRPF esta incompleta.",
    correctiveAction: "Preencher todos os campos obrigatorios da declaracao.",
    canAutoFix: false,
  },
  NFE_REJECTED: {
    code: "NFE_REJECTED",
    category: "fiscal",
    severity: "critical",
    message: "NF-e rejeitada pela SEFAZ.",
    userMessage: "A Nota Fiscal foi rejeitada. Verifique os dados.",
    correctiveAction:
      "Verificar dados do emitente, destinatario e CFOP. Corrigir e reemitir.",
    canAutoFix: false,
  },
  FOLHA_DIVERGENCE: {
    code: "FOLHA_DIVERGENCE",
    category: "fiscal",
    severity: "high",
    message: "Divergencia nos calculos da folha de pagamento.",
    userMessage: "Ha divergencia na folha de pagamento. Revise os calculos.",
    correctiveAction:
      "Verificar eventos lancados, faltas e horas extras. Recalcular INSS e IRRF.",
    canAutoFix: false,
  },
  SIMPLES_LIMITE_EXCEDIDO: {
    code: "SIMPLES_LIMITE_EXCEDIDO",
    category: "fiscal",
    severity: "critical",
    message: "Faturamento acumulado excede o limite do Simples Nacional.",
    userMessage: "Faturamento acima do limite do Simples Nacional (R$ 4,8M).",
    correctiveAction:
      "Verificar possibilidade de mudanca de regime tributario.",
    canAutoFix: false,
  },
  ALIQUOTA_INCORRETA: {
    code: "ALIQUOTA_INCORRETA",
    category: "fiscal",
    severity: "high",
    message: "Aliquota aplicada diverge da tabela vigente.",
    userMessage: "A aliquota utilizada pode estar desatualizada.",
    correctiveAction:
      "Recalcular com as tabelas fiscais atualizadas de 2024/2025.",
    canAutoFix: true,
  },
  DARF_VENCIDO: {
    code: "DARF_VENCIDO",
    category: "deadline",
    severity: "critical",
    message: "DARF com data de vencimento expirada.",
    userMessage: "Este DARF esta vencido! Emita um novo com multa e juros.",
    correctiveAction: "Emitir DARF atualizado com multa de 0,33%/dia + SELIC.",
    canAutoFix: false,
  },
};

const DATA_ERRORS: Record<string, ARIAError> = {
  CLIENTE_NAO_ENCONTRADO: {
    code: "CLIENTE_NAO_ENCONTRADO",
    category: "data",
    severity: "medium",
    message: "Cliente nao encontrado no cadastro.",
    userMessage: "Cliente nao cadastrado no sistema.",
    correctiveAction: "Cadastrar o cliente antes de prosseguir.",
    canAutoFix: false,
  },
  DOCUMENTO_DUPLICADO: {
    code: "DOCUMENTO_DUPLICADO",
    category: "data",
    severity: "high",
    message: "Documento ja existe no sistema.",
    userMessage: "Este documento ja foi importado anteriormente.",
    correctiveAction: "Verificar se e realmente duplicado. Se sim, descartar.",
    canAutoFix: false,
  },
  LANCAMENTO_DESEQUILIBRADO: {
    code: "LANCAMENTO_DESEQUILIBRADO",
    category: "data",
    severity: "high",
    message: "Lancamento contabil com debitos e creditos diferentes.",
    userMessage:
      "O lancamento nao esta equilibrado (debito diferente de credito).",
    correctiveAction:
      "Verificar valores debitados e creditados. Corrigir para que sejam iguais.",
    canAutoFix: false,
  },
};

const SYSTEM_ERRORS: Record<string, ARIAError> = {
  INDEXEDDB_UNAVAILABLE: {
    code: "INDEXEDDB_UNAVAILABLE",
    category: "system",
    severity: "medium",
    message: "IndexedDB nao disponivel no navegador.",
    userMessage:
      "Armazenamento local indisponivel — usando memoria temporaria.",
    correctiveAction:
      "Usar um navegador moderno (Chrome, Firefox, Edge). Dados podem nao persistir.",
    canAutoFix: true,
  },
  OCR_FAILED: {
    code: "OCR_FAILED",
    category: "integration",
    severity: "medium",
    message: "Falha no processamento OCR do documento.",
    userMessage: "Nao foi possivel ler o documento automaticamente.",
    correctiveAction:
      "Verificar qualidade da imagem ou inserir dados manualmente.",
    canAutoFix: false,
  },
  API_UNAVAILABLE: {
    code: "API_UNAVAILABLE",
    category: "integration",
    severity: "medium",
    message: "Servico externo indisponivel.",
    userMessage: "O servico externo esta temporariamente indisponivel.",
    correctiveAction: "Aguardar e tentar novamente em alguns minutos.",
    canAutoFix: false,
  },
};

export const ERROR_CATALOG: Record<string, ARIAError> = {
  ...VALIDATION_ERRORS,
  ...FISCAL_ERRORS,
  ...DATA_ERRORS,
  ...SYSTEM_ERRORS,
};

export function getError(code: string): ARIAError | undefined {
  return ERROR_CATALOG[code];
}

export function formatError(code: string, details?: string): string {
  const error = ERROR_CATALOG[code];
  if (!error) return `Erro desconhecido: ${code}`;
  const base = `Atencao: ${error.userMessage}`;
  const action = `\nO que fazer: ${error.correctiveAction}`;
  const detail = details ? `\nDetalhe: ${details}` : "";
  return `${base}${action}${detail}`;
}

export function getErrorsBySeverity(severity: ErrorSeverity): ARIAError[] {
  return Object.values(ERROR_CATALOG).filter((e) => e.severity === severity);
}

export function getErrorsByCategory(category: ErrorCategory): ARIAError[] {
  return Object.values(ERROR_CATALOG).filter((e) => e.category === category);
}

export function isCritical(code: string): boolean {
  return ERROR_CATALOG[code]?.severity === "critical";
}
