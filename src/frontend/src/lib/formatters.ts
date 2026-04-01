export function formatBRL(cents: bigint | number): string {
  const value = typeof cents === "bigint" ? Number(cents) : cents;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
  return d.toLocaleDateString("pt-BR");
}

export function formatCNPJ(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function parseBRLInput(value: string): number {
  const clean = value.replace(/[^\d,]/g, "").replace(",", ".");
  return Number.parseFloat(clean) || 0;
}
