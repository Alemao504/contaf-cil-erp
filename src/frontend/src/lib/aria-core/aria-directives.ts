// ARIA DIRECTIVES — Regras de Operacao e Prioridades

export const ARIA_CAN = [
  "suggest",
  "analyze",
  "organize",
  "calculate",
  "remind",
  "notify",
  "export",
  "validate",
  "classify",
  "search",
  "read_screen",
  "ask_questions",
  "batch_process",
  "learn",
  "profile_client",
] as const;

export const ARIA_CANNOT = [
  "submit_to_government",
  "delete_without_confirmation",
  "modify_approved_records",
  "send_emails_without_approval",
  "override_user_decision",
  "access_external_systems",
  "create_financial_obligations",
  "finalize_irpf_alone",
  "approve_payments",
  "modify_tax_rates",
] as const;

export const ARIA_MUST = [
  "always_ask_before_finalizing",
  "always_log_actions",
  "always_validate_data_first",
  "always_show_what_will_do",
  "always_allow_manual_override",
  "always_notify_errors",
  "always_process_sequentially",
  "always_preserve_original",
  "always_check_deadlines",
  "always_respect_user_settings",
] as const;

export const PROCESSING_ORDER = [
  "validation",
  "analysis",
  "suggestion",
  "await_approval",
  "execute",
  "log",
] as const;

export type ProcessingStep = (typeof PROCESSING_ORDER)[number];

export const PRIORITY_RULES = {
  level1: "fiscal_deadlines",
  level2: "error_correction",
  level3: "client_requests",
  level4: "batch_processing",
  level5: "organization",
  level6: "maintenance",
} as const;

export const MAX_CLIENTS_PER_BATCH = 200;
export const MAX_CONCURRENT_TASKS = 1;
export const MAX_RETRY_ATTEMPTS = 3;
export const IDLE_SCAN_INTERVAL_MS = 30000;

export const REQUIRE_APPROVAL_FOR = [
  "irpf_submission",
  "nfe_emission",
  "folha_payment",
  "bulk_delete",
  "tax_calculation",
  "contract_renewal",
  "report_export",
  "government_filing",
] as const;

export type RequiresApproval = (typeof REQUIRE_APPROVAL_FOR)[number];
export type OperationMode = "automatic" | "manual" | "supervised";

export const OPERATION_MODE_DESCRIPTIONS: Record<OperationMode, string> = {
  automatic: "ARIA executa tudo automaticamente sem solicitar confirmacao",
  manual: "ARIA sugere cada acao e aguarda aprovacao do contador",
  supervised: "ARIA executa acoes simples e pede aprovacao para acoes criticas",
};

export function canARIA(action: string): boolean {
  return ARIA_CAN.includes(action as (typeof ARIA_CAN)[number]);
}

export function cannotARIA(action: string): boolean {
  return ARIA_CANNOT.includes(action as (typeof ARIA_CANNOT)[number]);
}

export function requiresApproval(action: string): boolean {
  return REQUIRE_APPROVAL_FOR.includes(action as RequiresApproval);
}

export function getNextProcessingStep(
  current: ProcessingStep,
): ProcessingStep | null {
  const index = PROCESSING_ORDER.indexOf(current);
  if (index === -1 || index === PROCESSING_ORDER.length - 1) return null;
  return PROCESSING_ORDER[index + 1];
}
