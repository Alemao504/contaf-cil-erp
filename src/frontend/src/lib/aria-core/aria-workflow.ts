// ARIA WORKFLOW — Fluxos de Trabalho Passo a Passo

export interface WorkflowStep {
  step: number;
  id: string;
  description: string;
  instructions: string;
  validations: string[];
  ariaAction: string;
  requiresApproval: boolean;
  canSkip: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  estimatedMinutes: number;
  steps: WorkflowStep[];
}

export const IRPF_WORKFLOW: Workflow = {
  id: "irpf",
  name: "Declaracao de IRPF",
  description: "Declaracao anual de Imposto de Renda da Pessoa Fisica",
  estimatedMinutes: 30,
  steps: [
    {
      step: 1,
      id: "rendimentos_tributaveis",
      description: "Coletar rendimentos tributaveis",
      instructions:
        "Informe todos os rendimentos do trabalho assalariado, autonomo, alugueis e outros tributaveis.",
      validations: ["valor_maior_zero", "fonte_pagadora_informada"],
      ariaAction: "collect_rendimentos_tributaveis",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 2,
      id: "rendimentos_isentos",
      description: "Coletar rendimentos isentos",
      instructions:
        "Informe rendimentos isentos: FGTS, heranca, seguro de vida, etc.",
      validations: ["tipo_isencao_informado"],
      ariaAction: "collect_rendimentos_isentos",
      requiresApproval: false,
      canSkip: true,
    },
    {
      step: 3,
      id: "deducoes",
      description: "Coletar deducoes legais",
      instructions:
        "Informe despesas medicas, educacao, previdencia e outras deducoes.",
      validations: ["limites_deducao_respeitados"],
      ariaAction: "collect_deducoes",
      requiresApproval: false,
      canSkip: true,
    },
    {
      step: 4,
      id: "dependentes",
      description: "Cadastrar dependentes",
      instructions:
        "Informe os dependentes com CPF, parentesco e data de nascimento.",
      validations: ["cpf_dependente_valido", "parentesco_permitido"],
      ariaAction: "collect_dependentes",
      requiresApproval: false,
      canSkip: true,
    },
    {
      step: 5,
      id: "bens_direitos",
      description: "Declarar bens e direitos",
      instructions: "Informe todos os bens com situacao em 31/12.",
      validations: ["valor_aquisicao_informado"],
      ariaAction: "collect_bens_direitos",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 6,
      id: "dividas",
      description: "Declarar dividas e onus",
      instructions: "Informe dividas com valor, credor e CPF/CNPJ do credor.",
      validations: ["credor_informado"],
      ariaAction: "collect_dividas",
      requiresApproval: false,
      canSkip: true,
    },
    {
      step: 7,
      id: "calculo_imposto",
      description: "Calcular imposto devido ou restituicao",
      instructions:
        "ARIA calcula automaticamente com base na tabela progressiva IRPF 2024.",
      validations: ["base_calculo_positiva"],
      ariaAction: "calculate_irpf",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 8,
      id: "revisao_inconsistencias",
      description: "Revisar inconsistencias detectadas",
      instructions:
        "ARIA verifica todas as inconsistencias e apresenta para correcao.",
      validations: ["inconsistencias_resolvidas"],
      ariaAction: "detect_inconsistencies",
      requiresApproval: true,
      canSkip: false,
    },
    {
      step: 9,
      id: "aprovacao_contador",
      description: "Aprovacao final do contador",
      instructions: "Contador revisa e aprova a declaracao antes de exportar.",
      validations: ["todos_campos_preenchidos"],
      ariaAction: "await_approval",
      requiresApproval: true,
      canSkip: false,
    },
    {
      step: 10,
      id: "exportacao",
      description: "Exportar declaracao",
      instructions:
        "Gerar arquivo da declaracao em PDF, Word ou formato Receita.",
      validations: ["declaracao_aprovada"],
      ariaAction: "export_irpf",
      requiresApproval: false,
      canSkip: false,
    },
  ],
};

export const NFE_WORKFLOW: Workflow = {
  id: "nfe",
  name: "Emissao de NF-e",
  description: "Nota Fiscal Eletronica de produtos/mercadorias",
  estimatedMinutes: 10,
  steps: [
    {
      step: 1,
      id: "dados_emitente",
      description: "Verificar dados do emitente",
      instructions: "ARIA verifica CNPJ, IE e dados cadastrais do emitente.",
      validations: ["cnpj_valido", "certificado_ativo"],
      ariaAction: "verify_emitente",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 2,
      id: "dados_destinatario",
      description: "Informar dados do destinatario",
      instructions: "Informe CPF/CNPJ e endereco completo do destinatario.",
      validations: ["cpf_cnpj_valido", "endereco_completo"],
      ariaAction: "collect_destinatario",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 3,
      id: "itens_nota",
      description: "Informar itens da nota",
      instructions:
        "Informe produtos/servicos com NCM, CFOP, quantidade e valor.",
      validations: ["ncm_valido", "cfop_valido"],
      ariaAction: "collect_itens",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 4,
      id: "calculo_impostos",
      description: "Calcular impostos automaticamente",
      instructions: "ARIA calcula ICMS, IPI, PIS, COFINS.",
      validations: ["aliquotas_corretas"],
      ariaAction: "calculate_nfe_taxes",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 5,
      id: "revisao_aprovacao",
      description: "Revisao e aprovacao",
      instructions: "Contador revisa todos os dados antes da emissao.",
      validations: ["dados_conferidos"],
      ariaAction: "await_approval",
      requiresApproval: true,
      canSkip: false,
    },
    {
      step: 6,
      id: "emissao",
      description: "Emitir NF-e",
      instructions: "Transmitir NF-e para a SEFAZ (simulado).",
      validations: ["aprovacao_concedida"],
      ariaAction: "emit_nfe",
      requiresApproval: true,
      canSkip: false,
    },
  ],
};

export const FOLHA_WORKFLOW: Workflow = {
  id: "folha",
  name: "Folha de Pagamento",
  description: "Processamento mensal da folha de pagamento",
  estimatedMinutes: 20,
  steps: [
    {
      step: 1,
      id: "funcionarios_ativos",
      description: "Verificar funcionarios ativos",
      instructions: "ARIA lista todos os funcionarios ativos no cadastro.",
      validations: ["funcionarios_com_dados_completos"],
      ariaAction: "list_active_employees",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 2,
      id: "eventos_folha",
      description: "Lancar eventos da folha",
      instructions:
        "Informe faltas, horas extras, adiantamentos e outros eventos.",
      validations: ["eventos_dentro_mes_competencia"],
      ariaAction: "collect_folha_events",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 3,
      id: "calculo_inss",
      description: "Calcular INSS",
      instructions: "ARIA calcula INSS progressivo de cada funcionario.",
      validations: ["salario_acima_minimo"],
      ariaAction: "calculate_inss",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 4,
      id: "calculo_irrf",
      description: "Calcular IRRF",
      instructions: "ARIA calcula retencao de IR na fonte.",
      validations: ["dependentes_informados"],
      ariaAction: "calculate_irrf",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 5,
      id: "calculo_fgts",
      description: "Calcular FGTS",
      instructions: "ARIA calcula 8% sobre o salario bruto para FGTS.",
      validations: ["fgts_aliquota_correta"],
      ariaAction: "calculate_fgts",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 6,
      id: "aprovacao_pagamento",
      description: "Aprovar para pagamento",
      instructions: "Contador revisa e aprova a folha para pagamento.",
      validations: ["todos_calculos_conferidos"],
      ariaAction: "await_approval",
      requiresApproval: true,
      canSkip: false,
    },
    {
      step: 7,
      id: "exportacao_holerites",
      description: "Exportar holerites",
      instructions: "Gerar holerites individuais em PDF.",
      validations: ["aprovacao_concedida"],
      ariaAction: "export_payslips",
      requiresApproval: false,
      canSkip: false,
    },
  ],
};

export const SIMPLES_WORKFLOW: Workflow = {
  id: "simples",
  name: "Apuracao Simples Nacional",
  description: "Apuracao mensal do DAS — Simples Nacional",
  estimatedMinutes: 15,
  steps: [
    {
      step: 1,
      id: "receita_bruta",
      description: "Informar receita bruta do mes",
      instructions:
        "Informe o total de receitas brutas do periodo de apuracao.",
      validations: ["valor_positivo", "periodo_correto"],
      ariaAction: "collect_receita_bruta",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 2,
      id: "receita_12_meses",
      description: "Calcular receita acumulada 12 meses",
      instructions:
        "ARIA soma as receitas dos ultimos 12 meses para definir o anexo.",
      validations: ["historico_12_meses_disponivel"],
      ariaAction: "calculate_receita_acumulada",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 3,
      id: "selecao_anexo",
      description: "Determinar anexo e aliquota",
      instructions:
        "ARIA determina o anexo correto e calcula a aliquota efetiva.",
      validations: ["atividade_corretamente_classificada"],
      ariaAction: "determine_simples_anexo",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 4,
      id: "calculo_das",
      description: "Calcular valor do DAS",
      instructions: "ARIA calcula o DAS a pagar com aliquota efetiva.",
      validations: ["aliquota_efetiva_calculada"],
      ariaAction: "calculate_das",
      requiresApproval: false,
      canSkip: false,
    },
    {
      step: 5,
      id: "geracao_guia",
      description: "Gerar guia DAS",
      instructions: "Contador aprova e ARIA gera a guia DAS para pagamento.",
      validations: ["calculo_aprovado"],
      ariaAction: "generate_das_guide",
      requiresApproval: true,
      canSkip: false,
    },
  ],
};

export type WorkflowType = "irpf" | "nfe" | "folha" | "simples";

const WORKFLOWS: Record<WorkflowType, Workflow> = {
  irpf: IRPF_WORKFLOW,
  nfe: NFE_WORKFLOW,
  folha: FOLHA_WORKFLOW,
  simples: SIMPLES_WORKFLOW,
};

export function getWorkflow(type: WorkflowType): Workflow {
  return WORKFLOWS[type];
}

export function getNextStep(
  type: WorkflowType,
  currentStep: number,
): WorkflowStep | null {
  const workflow = WORKFLOWS[type];
  return workflow.steps.find((s) => s.step === currentStep + 1) ?? null;
}

export function getCurrentStep(
  type: WorkflowType,
  stepId: string,
): WorkflowStep | undefined {
  return WORKFLOWS[type].steps.find((s) => s.id === stepId);
}

export function getWorkflowProgress(
  type: WorkflowType,
  completedSteps: string[],
): number {
  const workflow = WORKFLOWS[type];
  return Math.round((completedSteps.length / workflow.steps.length) * 100);
}
