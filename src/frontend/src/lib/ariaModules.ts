export interface AriaModule {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

export interface AriaModuleGroup {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  modules: AriaModule[];
}

export const ARIA_MODULE_GROUPS: AriaModuleGroup[] = [
  {
    id: "contabilidade",
    label: "Contabilidade e Fiscal",
    icon: "📊",
    color: "oklch(0.45 0.15 240)",
    bg: "oklch(0.95 0.05 240)",
    modules: [
      {
        id: "livros_contabeis",
        label: "Livro Diário, Razão, Balancete, BP, DRE, DLPA",
        description: "ARIA gera e fecha os livros contábeis automaticamente",
        defaultOn: true,
      },
      {
        id: "simulador_tributario",
        label: "Simulador de Regime Tributário",
        description: "ARIA simula e recomenda o melhor regime (SN, LP, LR)",
        defaultOn: true,
      },
      {
        id: "modulo_fiscal",
        label: "Módulo Fiscal Completo (DCTF, ECF, ECD)",
        description: "ARIA prepara e valida obrigações fiscais acessórias",
        defaultOn: true,
      },
      {
        id: "guias_impostos",
        label: "Guias de Impostos (DAS, COFINS, PIS, DARF)",
        description: "ARIA calcula e agenda emissão das guias mensais",
        defaultOn: true,
      },
      {
        id: "fechamento",
        label: "Fechamento Contábil e Fiscal",
        description: "ARIA executa o fechamento mensal/anual automaticamente",
        defaultOn: false,
      },
      {
        id: "certidoes",
        label: "Certidões Negativas e Checklist",
        description: "ARIA monitora vencimentos e solicita certidões",
        defaultOn: true,
      },
      {
        id: "irpf",
        label: "IRPF — Declaração Pessoa Física",
        description: "ARIA preenche e valida fichas do IRPF automaticamente",
        defaultOn: false,
      },
      {
        id: "transmissao_receita",
        label: "Transmissão à Receita Federal",
        description:
          "ARIA transmite obrigações quando certificado estiver configurado",
        defaultOn: false,
      },
    ],
  },
  {
    id: "clientes",
    label: "Gestão de Clientes e Contratos",
    icon: "🤝",
    color: "oklch(0.45 0.15 150)",
    bg: "oklch(0.95 0.05 150)",
    modules: [
      {
        id: "cadastro_clientes",
        label: "Cadastro de Clientes",
        description:
          "ARIA mantém dados dos clientes atualizados automaticamente",
        defaultOn: true,
      },
      {
        id: "gestao_contratos",
        label: "Gestão de Contratos e Faturamento Recorrente",
        description: "ARIA gera boletos/notas e avisa sobre renovações",
        defaultOn: true,
      },
      {
        id: "portal_cliente",
        label: "Portal do Cliente",
        description: "ARIA organiza e disponibiliza documentos no portal",
        defaultOn: false,
      },
      {
        id: "workflow",
        label: "Workflow de Aprovação Multinível",
        description: "ARIA encaminha documentos para aprovação automaticamente",
        defaultOn: false,
      },
    ],
  },
  {
    id: "documentos",
    label: "Documentos e Digitalização",
    icon: "📁",
    color: "oklch(0.45 0.15 85)",
    bg: "oklch(0.95 0.05 85)",
    modules: [
      {
        id: "upload_processamento",
        label: "Upload e Processamento de Documentos",
        description:
          "ARIA classifica e lança documentos recebidos automaticamente",
        defaultOn: true,
      },
      {
        id: "ocr_camera",
        label: "Câmera e OCR em Tempo Real",
        description: "ARIA extrai dados de imagens e câmera automaticamente",
        defaultOn: true,
      },
      {
        id: "assinatura_digital",
        label: "Assinatura Digital",
        description: "ARIA gerencia fluxo de assinaturas digitais",
        defaultOn: false,
      },
      {
        id: "notas_tags",
        label: "Notas Livres com Tags",
        description: "ARIA sugere tags e resume notas automaticamente",
        defaultOn: false,
      },
      {
        id: "busca_imagens",
        label: "Busca por Texto em Imagens",
        description: "ARIA indexa e busca conteúdo em documentos digitalizados",
        defaultOn: true,
      },
      {
        id: "web_clipper",
        label: "Web Clipper",
        description: "ARIA analisa e categoriza conteúdo capturado da web",
        defaultOn: false,
      },
    ],
  },
  {
    id: "rh",
    label: "Recursos Humanos e Folha",
    icon: "👥",
    color: "oklch(0.45 0.15 280)",
    bg: "oklch(0.95 0.05 280)",
    modules: [
      {
        id: "folha_pagamento",
        label: "Folha de Pagamento",
        description:
          "ARIA calcula e gera folha mensalmente de forma automática",
        defaultOn: true,
      },
      {
        id: "admissao_demissao",
        label: "Admissão e Demissão",
        description: "ARIA prepara documentos e cálculos rescisórios",
        defaultOn: false,
      },
      {
        id: "esocial",
        label: "eSocial Integrado",
        description: "ARIA transmite eventos do eSocial automaticamente",
        defaultOn: true,
      },
    ],
  },
  {
    id: "relatorios",
    label: "Relatórios e BI",
    icon: "📈",
    color: "oklch(0.45 0.15 195)",
    bg: "oklch(0.95 0.05 195)",
    modules: [
      {
        id: "relatorios_avancados",
        label: "Relatórios Avançados e Dashboard",
        description:
          "ARIA gera e atualiza dashboards consolidados automaticamente",
        defaultOn: true,
      },
      {
        id: "exportacao_lote",
        label: "Exportação em Lote (ZIP, PDF, Word, Excel)",
        description: "ARIA exporta pacotes de relatórios para licitações",
        defaultOn: false,
      },
      {
        id: "bi_studio",
        label: "BI Studio com Métricas Personalizadas",
        description: "ARIA analisa dados e sugere métricas de negócio",
        defaultOn: true,
      },
      {
        id: "relatorios_mensais_ia",
        label: "Geração Automática de Relatórios Mensais",
        description: "ARIA gera e envia relatórios mensais agendados",
        defaultOn: true,
      },
    ],
  },
  {
    id: "outros",
    label: "Outros Módulos",
    icon: "⚙️",
    color: "oklch(0.45 0.12 50)",
    bg: "oklch(0.96 0.05 50)",
    modules: [
      {
        id: "patrimonio",
        label: "Patrimônio/Imobilizado e Depreciação",
        description: "ARIA calcula e registra depreciação automaticamente",
        defaultOn: true,
      },
      {
        id: "orcamento",
        label: "Orçamento/Previsão por Centro de Custo",
        description: "ARIA atualiza comparativos orçado x realizado",
        defaultOn: false,
      },
      {
        id: "deteccao_fraudes",
        label: "Detecção de Fraudes Contábeis",
        description: "ARIA monitora anomalias e emite alertas de risco",
        defaultOn: true,
      },
      {
        id: "notificacoes",
        label: "Central de Notificações e Lembretes",
        description: "ARIA envia alertas de vencimentos e obrigações",
        defaultOn: true,
      },
      {
        id: "simulacao_cenarios",
        label: "Simulação de Cenários Futuros",
        description: "ARIA gera projeções financeiras periodicamente",
        defaultOn: false,
      },
    ],
  },
];
