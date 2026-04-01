export type DocCategory =
  | "Faturamento"
  | "Lucro / DRE"
  | "Contabilidade"
  | "Fiscal"
  | "Folha / RH"
  | "Contratos"
  | "Certificados"
  | "Outros";

export function getDocumentCategory(
  filename: string,
  docType?: string,
): DocCategory {
  const text = `${filename} ${docType ?? ""}`.toLowerCase();
  if (/nf[-_e]?|nota.?fiscal|fatura|receita|venda|faturamento/.test(text))
    return "Faturamento";
  if (/dre|resultado|lucro|prejuizo|balancete/.test(text)) return "Lucro / DRE";
  if (/balanco|razao|diario|dlpa|contabilidade|patrimonial/.test(text))
    return "Contabilidade";
  if (/darf|das|cofins|pis|dctf|ecf|ecd|sped|guia|fiscal|imposto/.test(text))
    return "Fiscal";
  if (/folha|fgts|esocial|holerite|admissao|demissao|salario|rh/.test(text))
    return "Folha / RH";
  if (/contrato|prestacao|servico/.test(text)) return "Contratos";
  if (/certid|certificado/.test(text)) return "Certificados";
  return "Outros";
}

export const CATEGORY_CONFIG: Record<
  DocCategory,
  { color: string; bg: string; icon: string; border: string }
> = {
  Faturamento: {
    color: "oklch(0.40 0.14 150)",
    bg: "oklch(0.96 0.04 150)",
    border: "oklch(0.70 0.12 150)",
    icon: "💰",
  },
  "Lucro / DRE": {
    color: "oklch(0.40 0.14 195)",
    bg: "oklch(0.96 0.04 195)",
    border: "oklch(0.68 0.12 195)",
    icon: "📈",
  },
  Contabilidade: {
    color: "oklch(0.40 0.14 240)",
    bg: "oklch(0.96 0.04 240)",
    border: "oklch(0.65 0.12 240)",
    icon: "📊",
  },
  Fiscal: {
    color: "oklch(0.45 0.14 25)",
    bg: "oklch(0.96 0.04 25)",
    border: "oklch(0.70 0.12 25)",
    icon: "🏛️",
  },
  "Folha / RH": {
    color: "oklch(0.40 0.14 280)",
    bg: "oklch(0.96 0.04 280)",
    border: "oklch(0.65 0.12 280)",
    icon: "👥",
  },
  Contratos: {
    color: "oklch(0.40 0.14 85)",
    bg: "oklch(0.96 0.04 85)",
    border: "oklch(0.70 0.12 85)",
    icon: "📋",
  },
  Certificados: {
    color: "oklch(0.40 0.14 60)",
    bg: "oklch(0.96 0.04 60)",
    border: "oklch(0.70 0.12 60)",
    icon: "🔏",
  },
  Outros: {
    color: "oklch(0.40 0.02 240)",
    bg: "oklch(0.96 0.01 240)",
    border: "oklch(0.70 0.01 240)",
    icon: "📁",
  },
};
