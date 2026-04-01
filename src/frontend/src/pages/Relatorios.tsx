import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart2, Percent, Printer, Shield, TrendingUp } from "lucide-react";
import { useRef, useState } from "react";
import ClientSelector from "../components/ClientSelector";
import { useAppContext } from "../context/AppContext";
import {
  useBalancete,
  useBalanco,
  useDRE,
  useJournalEntries,
  useLivroDiario,
} from "../hooks/useQueries";
import { DEFAULT_ACCOUNT_PLAN } from "../lib/accountPlan";
import { formatBRL, formatDate } from "../lib/formatters";

const REPORT_TYPES = [
  { id: "diario", label: "Livro Diário" },
  { id: "livrorazao", label: "Livro Razão" },
  { id: "balancete", label: "Balancete" },
  { id: "balanco", label: "Balanço Patrimonial" },
  { id: "dre", label: "DRE" },
  { id: "dlpa", label: "DLPA" },
  { id: "indices", label: "Índices Financeiros" },
];

const YEARS = ["2026", "2025", "2024", "2023"];

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Relatorios() {
  const { selectedClientId, clients } = useAppContext();
  const [reportType, setReportType] = useState("diario");
  const [year, setYear] = useState("2026");
  const printRef = useRef<HTMLDivElement>(null);

  const exportFormat = localStorage.getItem("exportFormat") ?? "pdf";

  const { data: diario = [], isLoading: loadingDiario } =
    useLivroDiario(selectedClientId);
  const { data: entries = [] } = useJournalEntries(selectedClientId);
  const { data: balanco, isLoading: loadingBalanco } =
    useBalanco(selectedClientId);
  const { data: dre, isLoading: loadingDRE } = useDRE(selectedClientId);
  const { data: balancete, isLoading: loadingBalancete } =
    useBalancete(selectedClientId);

  const client = clients.find((c) => c.id === selectedClientId);
  const filteredDiario = diario.filter((e) => e.entryDate.startsWith(year));
  const isLoading =
    loadingDiario || loadingBalanco || loadingDRE || loadingBalancete;

  const handleExport = () => {
    if (exportFormat === "pdf") {
      window.print();
      return;
    }
    const reportLabel =
      REPORT_TYPES.find((r) => r.id === reportType)?.label ?? reportType;
    const header = `${client?.name ?? "Empresa"} — ${reportLabel} — ${year}\n${"-".repeat(50)}\n`;
    if (exportFormat === "excel") {
      const rows = filteredDiario
        .map(
          (e) =>
            `${e.entryDate},${e.description},${e.debitCode},${e.creditCode},${Number(e.valueInCents) / 100}`,
        )
        .join("\n");
      downloadFile(
        `Data,Descrição,Débito,Crédito,Valor\n${rows}`,
        "relatorio.csv",
        "text/csv",
      );
    } else {
      const rows = filteredDiario
        .map(
          (e) =>
            `${formatDate(e.entryDate)}  ${e.description}  D:${e.debitCode}  C:${e.creditCode}  ${formatBRL(e.valueInCents)}`,
        )
        .join("\n");
      downloadFile(`${header}${rows}`, "relatorio.doc", "application/msword");
    }
  };

  // Livro Razão — group entries by account code
  const razaoByAccount: Record<string, typeof entries> = {};
  for (const e of filteredDiario) {
    if (!razaoByAccount[e.debitCode]) razaoByAccount[e.debitCode] = [];
    razaoByAccount[e.debitCode].push(e);
    if (e.creditCode !== e.debitCode) {
      if (!razaoByAccount[e.creditCode]) razaoByAccount[e.creditCode] = [];
      razaoByAccount[e.creditCode].push(e);
    }
  }

  const exportLabel =
    exportFormat === "excel"
      ? "Exportar CSV"
      : exportFormat === "word"
        ? "Exportar Word"
        : "Exportar PDF";

  return (
    <div className="flex flex-col h-full">
      <header className="no-print flex items-center justify-between px-6 py-4 bg-white border-b border-border">
        <div>
          <h1 className="text-xl font-semibold">Relatórios Contábeis</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Demonstrações financeiras e livros obrigatórios
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ClientSelector />
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger
              data-ocid="relatorios.year.select"
              className="w-24 h-8 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y} className="text-xs">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            data-ocid="relatorios.print.primary_button"
            size="sm"
            variant="outline"
            className="text-xs gap-1.5"
            onClick={handleExport}
          >
            <Printer className="w-3.5 h-3.5" /> {exportLabel}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {/* Report type selector */}
        <div
          className="no-print flex flex-wrap gap-2 mb-5"
          data-ocid="relatorios.tipo.tab"
        >
          {REPORT_TYPES.map((r) => (
            <button
              type="button"
              key={r.id}
              data-ocid={`relatorios.${r.id}.tab`}
              onClick={() => setReportType(r.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                reportType === r.id
                  ? "bg-primary text-white"
                  : "bg-white border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div ref={printRef}>
          {/* Print header */}
          <div className="print-only mb-6 text-center border-b pb-4">
            <h2 className="text-lg font-bold">{client?.name ?? "Empresa"}</h2>
            <p className="text-sm">
              CNPJ: {client?.cnpj} | Regime: {client?.regime}
            </p>
            <h3 className="text-base font-semibold mt-2">
              {REPORT_TYPES.find((r) => r.id === reportType)?.label} — Exercício{" "}
              {year}
            </h3>
          </div>

          {isLoading && (
            <div data-ocid="relatorios.loading_state" className="space-y-2">
              {["a", "b", "c", "d", "e", "f"].map((k) => (
                <Skeleton key={k} className="h-9 w-full" />
              ))}
            </div>
          )}

          {/* LIVRO DIÁRIO */}
          {!isLoading && reportType === "diario" && (
            <Card className="rounded-xl border-border shadow-sm">
              <CardHeader className="px-5 py-4 border-b border-border">
                <CardTitle className="text-sm font-semibold">
                  Livro Diário — {year}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredDiario.length === 0 ? (
                  <p
                    data-ocid="relatorios.diario.empty_state"
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nenhum lançamento para {year}.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-semibold px-5">
                          Nº
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Data
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Histórico
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Débito
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Crédito
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right pr-5">
                          Valor (R$)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDiario.map((e, i) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs px-5 py-2 text-muted-foreground">
                            {i + 1}
                          </TableCell>
                          <TableCell className="text-xs py-2 whitespace-nowrap">
                            {formatDate(e.entryDate)}
                          </TableCell>
                          <TableCell className="text-xs py-2 max-w-[200px] truncate">
                            {e.description}
                          </TableCell>
                          <TableCell className="text-xs py-2 font-mono">
                            {e.debitCode}
                          </TableCell>
                          <TableCell className="text-xs py-2 font-mono">
                            {e.creditCode}
                          </TableCell>
                          <TableCell className="text-xs py-2 text-right pr-5 font-semibold">
                            {formatBRL(e.valueInCents)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* LIVRO RAZÃO */}
          {!isLoading && reportType === "livrorazao" && (
            <div className="space-y-4">
              {Object.keys(razaoByAccount).length === 0 ? (
                <Card className="rounded-xl border-border shadow-sm">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum lançamento para {year}.
                  </CardContent>
                </Card>
              ) : (
                Object.entries(razaoByAccount)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([code, acEntries]) => {
                    const acName =
                      DEFAULT_ACCOUNT_PLAN.find((p) => p.code === code)?.name ??
                      code;
                    return (
                      <Card
                        key={code}
                        className="rounded-xl border-border shadow-sm"
                      >
                        <CardHeader className="px-5 py-3 border-b border-border">
                          <CardTitle className="text-xs font-semibold">
                            <span className="font-mono text-primary">
                              {code}
                            </span>{" "}
                            — {acName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/30">
                                <TableHead className="text-xs font-semibold px-5">
                                  Data
                                </TableHead>
                                <TableHead className="text-xs font-semibold">
                                  Histórico
                                </TableHead>
                                <TableHead className="text-xs font-semibold">
                                  Natureza
                                </TableHead>
                                <TableHead className="text-xs font-semibold text-right pr-5">
                                  Valor (R$)
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {acEntries.map((e) => (
                                <TableRow key={`${e.id}-${code}`}>
                                  <TableCell className="text-xs px-5 py-2">
                                    {formatDate(e.entryDate)}
                                  </TableCell>
                                  <TableCell className="text-xs py-2 max-w-[220px] truncate">
                                    {e.description}
                                  </TableCell>
                                  <TableCell className="text-xs py-2">
                                    <span
                                      className={`font-semibold text-[10px] px-1.5 py-0.5 rounded ${
                                        e.debitCode === code
                                          ? "bg-red-50 text-red-600"
                                          : "bg-green-50 text-green-700"
                                      }`}
                                    >
                                      {e.debitCode === code ? "D" : "C"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-xs py-2 text-right pr-5 font-semibold">
                                    {formatBRL(e.valueInCents)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </div>
          )}

          {/* BALANCETE */}
          {!isLoading && reportType === "balancete" && (
            <Card className="rounded-xl border-border shadow-sm">
              <CardHeader className="px-5 py-4 border-b border-border">
                <CardTitle className="text-sm font-semibold">
                  Balancete de Verificação — {year}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(balancete?.accounts ?? []).length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Sem dados para exibir.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-semibold px-5">
                          Código
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Conta
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Tipo
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right pr-5">
                          Saldo
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(balancete?.accounts ?? []).map((a) => (
                        <TableRow key={a.code}>
                          <TableCell className="text-xs px-5 py-2 font-mono">
                            {a.code}
                          </TableCell>
                          <TableCell className="text-xs py-2">
                            {a.name}
                          </TableCell>
                          <TableCell className="text-xs py-2">
                            {a.accountType}
                          </TableCell>
                          <TableCell className="text-xs py-2 text-right pr-5 font-semibold">
                            —
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* BALANÇO PATRIMONIAL */}
          {!isLoading && reportType === "balanco" && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-xl border-border shadow-sm">
                <CardHeader className="px-5 py-4 border-b border-border">
                  <CardTitle className="text-sm font-semibold">ATIVO</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-semibold px-5">
                          Código
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Conta
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(balanco?.assets ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-xs text-center text-muted-foreground py-6"
                          >
                            Sem dados
                          </TableCell>
                        </TableRow>
                      ) : (
                        (balanco?.assets ?? []).map((a) => (
                          <TableRow key={a.code}>
                            <TableCell className="text-xs px-5 py-2 font-mono">
                              {a.code}
                            </TableCell>
                            <TableCell className="text-xs py-2">
                              {a.name}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <div className="space-y-4">
                <Card className="rounded-xl border-border shadow-sm">
                  <CardHeader className="px-5 py-3 border-b border-border">
                    <CardTitle className="text-sm font-semibold">
                      PASSIVO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {(balanco?.liabilities ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell className="text-xs text-center text-muted-foreground py-4">
                              Sem dados
                            </TableCell>
                          </TableRow>
                        ) : (
                          (balanco?.liabilities ?? []).map((a) => (
                            <TableRow key={a.code}>
                              <TableCell className="text-xs px-5 py-2 font-mono">
                                {a.code}
                              </TableCell>
                              <TableCell className="text-xs py-2">
                                {a.name}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-border shadow-sm">
                  <CardHeader className="px-5 py-3 border-b border-border">
                    <CardTitle className="text-sm font-semibold">
                      PATRIMÔNIO LÍQUIDO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {(balanco?.patrimonio ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell className="text-xs text-center text-muted-foreground py-4">
                              Sem dados
                            </TableCell>
                          </TableRow>
                        ) : (
                          (balanco?.patrimonio ?? []).map((a) => (
                            <TableRow key={a.code}>
                              <TableCell className="text-xs px-5 py-2 font-mono">
                                {a.code}
                              </TableCell>
                              <TableCell className="text-xs py-2">
                                {a.name}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* DRE */}
          {!isLoading && reportType === "dre" && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-xl border-border shadow-sm">
                <CardHeader className="px-5 py-4 border-b border-border">
                  <CardTitle
                    className="text-sm font-semibold"
                    style={{ color: "oklch(0.4 0.12 150)" }}
                  >
                    RECEITAS
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-semibold px-5">
                          Código
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Conta
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(dre?.receitas ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-xs text-center text-muted-foreground py-6"
                          >
                            Sem receitas
                          </TableCell>
                        </TableRow>
                      ) : (
                        (dre?.receitas ?? []).map((a) => (
                          <TableRow key={a.code}>
                            <TableCell className="text-xs px-5 py-2 font-mono">
                              {a.code}
                            </TableCell>
                            <TableCell className="text-xs py-2">
                              {a.name}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-border shadow-sm">
                <CardHeader className="px-5 py-4 border-b border-border">
                  <CardTitle className="text-sm font-semibold text-destructive">
                    DESPESAS
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-semibold px-5">
                          Código
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Conta
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(dre?.despesas ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-xs text-center text-muted-foreground py-6"
                          >
                            Sem despesas
                          </TableCell>
                        </TableRow>
                      ) : (
                        (dre?.despesas ?? []).map((a) => (
                          <TableRow key={a.code}>
                            <TableCell className="text-xs px-5 py-2 font-mono">
                              {a.code}
                            </TableCell>
                            <TableCell className="text-xs py-2">
                              {a.name}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DLPA */}
          {!isLoading && reportType === "dlpa" && (
            <Card className="rounded-xl border-border shadow-sm">
              <CardHeader className="px-5 py-4 border-b border-border">
                <CardTitle className="text-sm font-semibold">
                  DLPA — Demonstração de Lucros e Prejuízos Acumulados — {year}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold px-5">
                        Descrição
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right pr-5">
                        Valor (R$)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        label: "Saldo Inicial de Lucros Acumulados",
                        value: 45_230_00,
                        positive: true,
                      },
                      {
                        label: "(+) Lucro Líquido do Exercício",
                        value: 18_750_00,
                        positive: true,
                      },
                      {
                        label: "(-) Dividendos Distribuídos",
                        value: -9_500_00,
                        positive: false,
                      },
                      {
                        label: "(-) Reserva Legal (5%)",
                        value: -937_50,
                        positive: false,
                      },
                      {
                        label: "Saldo Final de Lucros Acumulados",
                        value: 53_542_50,
                        positive: true,
                      },
                    ].map((row) => (
                      <TableRow
                        key={row.label}
                        className={
                          row.label.startsWith("Saldo Final")
                            ? "font-bold bg-muted/20"
                            : ""
                        }
                      >
                        <TableCell className="text-xs px-5 py-3">
                          {row.label}
                        </TableCell>
                        <TableCell
                          className={`text-xs py-3 text-right pr-5 font-semibold ${row.positive ? "text-green-700" : "text-destructive"}`}
                        >
                          {formatBRL(row.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-[10px] text-muted-foreground px-5 py-3 border-t border-border">
                  * Valores demonstrativos para fins de modelo. Período: {year}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ÍNDICES FINANCEIROS */}
          {!isLoading && reportType === "indices" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    icon: <TrendingUp className="w-5 h-5" />,
                    label: "Liquidez Corrente",
                    value: "1,85",
                    desc: "Ativo Circulante / Passivo Circulante",
                    ok: true,
                    ref: "≥ 1,0 — Bom",
                  },
                  {
                    icon: <Shield className="w-5 h-5" />,
                    label: "Liquidez Geral",
                    value: "2,14",
                    desc: "(AC + ARLP) / (PC + PELP)",
                    ok: true,
                    ref: "≥ 1,0 — Bom",
                  },
                  {
                    icon: <BarChart2 className="w-5 h-5" />,
                    label: "Endividamento Geral",
                    value: "32,4%",
                    desc: "Passivo Total / Ativo Total × 100",
                    ok: true,
                    ref: "< 50% — Aceitável",
                  },
                  {
                    icon: <Percent className="w-5 h-5" />,
                    label: "Margem Líquida",
                    value: "18,7%",
                    desc: "Lucro Líquido / Receita Líquida × 100",
                    ok: true,
                    ref: "> 10% — Bom",
                  },
                ].map((idx) => (
                  <Card
                    key={idx.label}
                    className="rounded-xl border-border shadow-sm"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{
                            background: "oklch(0.94 0.04 240)",
                            color: "oklch(0.27 0.072 240)",
                          }}
                        >
                          {idx.icon}
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            idx.ok
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {idx.ok ? "✓ Normal" : "⚠ Atenção"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {idx.label}
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-0.5">
                        {idx.value}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {idx.desc}
                      </p>
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-[10px] text-muted-foreground">
                          Referência:{" "}
                          <span className="font-medium text-foreground">
                            {idx.ref}
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="rounded-xl border-border shadow-sm">
                <CardContent className="p-4">
                  <p className="text-[11px] text-muted-foreground">
                    * Valores calculados com base no exercício {year}. Índices
                    demonstrativos — conecte lançamentos reais para cálculo
                    automático.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
