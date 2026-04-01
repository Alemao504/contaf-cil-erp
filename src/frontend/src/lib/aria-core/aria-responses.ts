// ARIA RESPONSES — Respostas Inteligentes para o Chat

export type ResponseType =
  | "answer"
  | "navigation"
  | "action"
  | "question"
  | "error";

export interface ARIAResponse {
  type: ResponseType;
  content: string;
  route?: string;
  action?: string;
  data?: Record<string, unknown>;
}

export interface AppContext {
  currentScreen?: string;
  clients?: Array<{ id: string; nome: string; regime?: string }>;
  pendingTasks?: Array<{ clientId: string; taskType: string; status: string }>;
  upcomingDeadlines?: Array<{
    name: string;
    dueDate: string;
    daysUntil: number;
  }>;
  recentErrors?: string[];
}

export const NAVIGATION_ROUTES: Record<string, string> = {
  "visao geral": "/",
  dashboard: "/",
  inicio: "/",
  clientes: "/clientes",
  "notas fiscais": "/notas-fiscais",
  "nota fiscal": "/notas-fiscais",
  nfe: "/notas-fiscais",
  "nf-e": "/notas-fiscais",
  lancamentos: "/lancamentos",
  balancete: "/balancete",
  balanco: "/balanco-patrimonial",
  dre: "/dre",
  resultado: "/dre",
  folha: "/folha-pagamento",
  "folha de pagamento": "/folha-pagamento",
  rh: "/folha-pagamento",
  fiscal: "/fiscal",
  impostos: "/fiscal",
  irpf: "/irpf",
  "imposto de renda": "/irpf",
  declaracao: "/irpf",
  simples: "/simples-nacional",
  "simples nacional": "/simples-nacional",
  das: "/simples-nacional",
  contratos: "/contratos",
  relatorios: "/relatorios",
  bi: "/bi-studio",
  "bi studio": "/bi-studio",
  agenda: "/agenda",
  calendario: "/agenda",
  notificacoes: "/notificacoes",
  configuracoes: "/configuracoes",
  "memoria aria": "/aria-memoria",
  aprovacao: "/aria-aprovacao",
  voz: "/aria-voz",
  pastas: "/aria-pastas",
  agendamentos: "/agendamentos",
  lote: "/batch-processing",
  portal: "/portal-cliente",
  patrimonio: "/patrimonio",
};

interface IntentPattern {
  keywords: string[];
  handler: (message: string, context: AppContext) => ARIAResponse;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    keywords: ["abrir", "ir para", "navegar", "mostrar", "vai para", "abre"],
    handler: (message) => {
      const normalized = message.toLowerCase();
      for (const [key, route] of Object.entries(NAVIGATION_ROUTES)) {
        if (normalized.includes(key)) {
          return { type: "navigation", content: `Abrindo ${key}!`, route };
        }
      }
      return {
        type: "answer",
        content:
          "Nao encontrei essa pagina. Tente: 'abrir clientes', 'abrir notas fiscais', 'abrir IRPF', etc.",
      };
    },
  },
  {
    keywords: ["quem falta", "falta fazer", "pendente", "pendentes", "nao fez"],
    handler: (_msg, ctx) => {
      const pending =
        ctx.pendingTasks?.filter((t) => t.status !== "completed") ?? [];
      if (pending.length === 0) {
        return {
          type: "answer",
          content: "Todos os clientes estao em dia! Nenhuma tarefa pendente.",
        };
      }
      const list = pending
        .slice(0, 5)
        .map((t, i) => `${i + 1}. ${t.clientId} — ${t.taskType}`)
        .join("\n");
      const more =
        pending.length > 5 ? `\n... e mais ${pending.length - 5} tarefas.` : "";
      return {
        type: "answer",
        content: `Tarefas pendentes (${pending.length}):\n${list}${more}`,
      };
    },
  },
  {
    keywords: ["declaracao", "irpf", "imposto de renda"],
    handler: (_msg, ctx) => {
      const irpfPending =
        ctx.pendingTasks?.filter(
          (t) => t.taskType === "irpf" && t.status !== "completed",
        ) ?? [];
      if (irpfPending.length > 0) {
        const list = irpfPending
          .slice(0, 3)
          .map((t) => `- ${t.clientId}`)
          .join("\n");
        return {
          type: "answer",
          content: `Faltam ${irpfPending.length} declaracoes de IRPF:\n${list}\n\nQuer que eu abra o modulo IRPF?`,
          route: "/irpf",
        };
      }
      return {
        type: "navigation",
        content: "Indo para o modulo de IRPF!",
        route: "/irpf",
      };
    },
  },
  {
    keywords: ["nota fiscal", "notas fiscais", "nfe", "nf-e", "emitir nota"],
    handler: () => ({
      type: "navigation",
      content: "Abrindo o modulo de Notas Fiscais!",
      route: "/notas-fiscais",
    }),
  },
  {
    keywords: ["folha", "salario", "pagamento", "funcionario"],
    handler: () => ({
      type: "navigation",
      content: "Abrindo Folha de Pagamento!",
      route: "/folha-pagamento",
    }),
  },
  {
    keywords: ["prazo", "vencimento", "vence", "obrigacao", "calendario"],
    handler: (_msg, ctx) => {
      const deadlines = ctx.upcomingDeadlines ?? [];
      if (deadlines.length === 0) {
        return {
          type: "answer",
          content: "Nao ha prazos urgentes nos proximos dias. Tudo tranquilo!",
        };
      }
      const urgent = deadlines.filter((d) => d.daysUntil <= 5);
      const list = urgent
        .slice(0, 3)
        .map((d) => `${d.name} — vence em ${d.daysUntil} dias (${d.dueDate})`)
        .join("\n");
      return { type: "answer", content: `Prazos proximos:\n${list}` };
    },
  },
  {
    keywords: ["processar", "fazer", "executar", "iniciar", "comecar"],
    handler: (message, ctx) => {
      const normalized = message.toLowerCase();
      if (normalized.includes("tudo") || normalized.includes("todos")) {
        return {
          type: "action",
          content:
            "Iniciando processamento em lote de todos os clientes! Processarei um por vez, em ordem alfabetica.",
          action: "start_batch_processing",
        };
      }
      const count = ctx.clients?.length ?? 0;
      if (count > 0) {
        return {
          type: "question",
          content: `Processar qual cliente? Tenho ${count} clientes cadastrados. Digite o nome ou diga 'processar tudo'.`,
        };
      }
      return {
        type: "answer",
        content: "Nao ha clientes cadastrados para processar.",
      };
    },
  },
  {
    keywords: ["cliente", "clientes", "quantos clientes"],
    handler: (_msg, ctx) => {
      const count = ctx.clients?.length ?? 0;
      if (count === 0) {
        return {
          type: "navigation",
          content:
            "Abrindo cadastro de clientes! Voce ainda nao tem clientes cadastrados.",
          route: "/clientes",
        };
      }
      return {
        type: "answer",
        content: `Voce tem ${count} clientes cadastrados. Quer ver a lista completa?`,
        route: "/clientes",
      };
    },
  },
  {
    keywords: ["ajuda", "help", "o que voce faz", "como funciona", "comandos"],
    handler: () => ({
      type: "answer",
      content:
        "Oi! Sou a ARIA, sua assistente contabil! Posso:\n\nNavegar: 'abrir clientes', 'ir para IRPF', 'mostrar notas fiscais'\nConsultar: 'quem falta fazer declaracao', 'mostrar pendentes'\nPrazos: 'quais sao os prazos', 'vencimentos do mes'\nProcessar: 'processar tudo', 'iniciar folha'\nClientes: 'quantos clientes tenho'\n\nE so me pedir!",
    }),
  },
];

export function processMessage(
  message: string,
  appContext: AppContext = {},
): ARIAResponse {
  const normalized = message.toLowerCase().trim();
  if (!normalized) {
    return { type: "answer", content: "Pode falar! Estou ouvindo." };
  }
  for (const pattern of INTENT_PATTERNS) {
    if (pattern.keywords.some((kw) => normalized.includes(kw))) {
      return pattern.handler(message, appContext);
    }
  }
  for (const [key, route] of Object.entries(NAVIGATION_ROUTES)) {
    if (normalized.includes(key)) {
      return { type: "navigation", content: `Abrindo ${key}!`, route };
    }
  }
  return {
    type: "answer",
    content: `Nao entendi muito bem "${message}". Tente: 'abrir clientes', 'quem falta declaracao', 'mostrar prazos', ou 'ajuda' para ver todos os comandos!`,
  };
}

export function getContextualResponse(screen: string, event: string): string {
  const responses: Record<string, Record<string, string>> = {
    "notas-fiscais": {
      open: "Estou verificando as notas fiscais. Quer que eu analise as NF-e pendentes?",
      new: "Vou ajudar a preencher a nova nota! Ja verifico os dados do emitente.",
      error: "Encontrei um erro na nota. Deixa eu analisar o que esta errado.",
    },
    irpf: {
      open: "Modulo IRPF aberto! Quer comecar uma nova declaracao ou continuar uma existente?",
      calculate:
        "Calculando o imposto com a tabela progressiva 2024... ja volto!",
      export: "Gerando o PDF da declaracao. Um momento!",
    },
    "folha-pagamento": {
      open: "Folha de pagamento! Preciso verificar a competencia e os eventos do mes.",
      calculate: "Calculando INSS, IRRF e FGTS de todos os funcionarios...",
    },
    lancamentos: {
      open: "Modulo de lancamentos! Posso classificar automaticamente os lancamentos pendentes?",
      new: "Novo lancamento! Vou validar os dados antes de salvar.",
    },
  };
  return responses[screen]?.[event] ?? `Estou pronta para ajudar em ${screen}!`;
}
