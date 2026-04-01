import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Bot,
  Calculator,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Printer,
  Scale,
  Sparkles,
  TrendingDown,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import { getAllRecords, putRecord } from "../lib/db";
import {
  type SimulacaoResult,
  type SimuladorInput,
  calcularRegimes,
  exportCSV,
  exportExcel,
  exportPDF,
  exportWord,
} from "../lib/simuladorService";
import type { Client } from "../types/local";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );
const fmtPct = (v: number) => `${v.toFixed(2)}%`;

const UFS = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
];

const REGIME_KEYS = ["simplesNacional", "lucroPresumido", "lucroReal"] as const;
const REGIME_LABELS: Record<string, string> = {
  simplesNacional: "Simples Nacional",
  lucroPresumido: "Lucro Presumido",
  lucroReal: "Lucro Real",
};

function parseNum(s: string): number {
  const clean = s.replace(/[R$\s.]/g, "").replace(",", ".");
  return Math.max(0, Number.parseFloat(clean) || 0);
}

function fmtInput(v: string): string {
  const n = v.replace(/\D/g, "");
  if (!n) return "";
  const num = Number.parseInt(n, 10) / 100;
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface FormState {
  faturamentoBruto: string;
  folhaMensal: string;
  despesasDedut: string;
  atividade: "servicos" | "comercio" | "industria";
  estado: string;
  cnae: string;
}

const INITIAL_FORM: FormState = {
  faturamentoBruto: "",
  folhaMensal: "",
  despesasDedut: "",
  atividade: "servicos",
  estado: "SP",
  cnae: "",
};

export default function SimuladorTributario() {
  const { addMessage } = useARIA();
  const [mode, setMode] = useState<"auto" | "manual">("manual");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("none");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [result, setResult] = useState<SimulacaoResult | null>(null);
  const [historico, setHistorico] = useState<SimulacaoResult[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [historicoFilter, setHistoricoFilter] = useState("");

  const loadHistorico = useCallback(async () => {
    try {
      const items = await getAllRecords<SimulacaoResult>(
        "simulacoes_tributarias",
      );
      setHistorico(
        [...items].sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime(),
        ),
      );
    } catch {}
  }, []);

  useEffect(() => {
    getAllRecords<Client>("clients")
      .then(setClients)
      .catch(() => {});
    loadHistorico();
  }, [loadHistorico]);

  // Auto-fill hints when client selected
  useEffect(() => {
    if (mode === "auto" && selectedClientId && selectedClientId !== "none") {
      const client = clients.find(
        (c) => c.id === selectedClientId && selectedClientId !== "none",
      );
      if (client) {
        const atividade: FormState["atividade"] = client.regime.includes("Real")
          ? "servicos"
          : "servicos";
        setForm((prev) => ({ ...prev, atividade, cnae: "" }));
      }
    }
  }, [mode, selectedClientId, clients]);

  const handleFieldChange = (field: keyof FormState, rawValue: string) => {
    if (field === "atividade" || field === "estado" || field === "cnae") {
      setForm((prev) => ({ ...prev, [field]: rawValue }));
    } else {
      setForm((prev) => ({ ...prev, [field]: fmtInput(rawValue) }));
    }
  };

  const handleSimular = async () => {
    const fat = parseNum(form.faturamentoBruto);
    if (fat <= 0) {
      toast.error("Informe o faturamento bruto anual");
      return;
    }
    setIsSimulating(true);
    try {
      const input: SimuladorInput = {
        faturamentoBrutoAnual: fat,
        folhaMensalTotal: parseNum(form.folhaMensal),
        despesasDedutiveisAnual: parseNum(form.despesasDedut),
        cnae: form.cnae,
        atividade: form.atividade,
        estado: form.estado,
      };
      const calc = calcularRegimes(input);
      const client = clients.find(
        (c) => c.id === selectedClientId && selectedClientId !== "none",
      );
      const saved: SimulacaoResult = {
        ...calc,
        id: crypto.randomUUID(),
        clientId: selectedClientId !== "none" ? selectedClientId : undefined,
        clientNome: client?.name ?? "",
        createdAt: new Date().toISOString(),
      };
      setResult(saved);
      await putRecord("simulacoes_tributarias", saved);
      await loadHistorico();
      addMessage({
        type: "success",
        text: `📊 Simulação tributária concluída! Regime recomendado: ${REGIME_LABELS[calc.recomendado]}. Economia de ${fmt(calc.economiaAnual)}/ano.`,
      });
      toast.success("Simulação concluída!");
    } catch (err) {
      toast.error("Erro ao calcular regimes tributários");
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredHistorico = historico.filter(
    (h) =>
      !historicoFilter ||
      h.clientNome?.toLowerCase().includes(historicoFilter.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <header className="flex-shrink-0 px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: "oklch(0.27 0.072 240)" }}
          >
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Simulador de Regime Tributário
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compare Simples Nacional, Lucro Presumido e Lucro Real — encontre
              o regime mais vantajoso
            </p>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6">
          <Tabs defaultValue="simulacao">
            <TabsList className="mb-6">
              <TabsTrigger
                data-ocid="simulador.simulacao.tab"
                value="simulacao"
              >
                <Calculator className="w-3.5 h-3.5 mr-1.5" />
                Nova Simulação
              </TabsTrigger>
              <TabsTrigger
                data-ocid="simulador.historico.tab"
                value="historico"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                Histórico
                {historico.length > 0 && (
                  <Badge className="ml-1.5 text-[10px] h-4 px-1.5">
                    {historico.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── SIMULAÇÃO TAB ── */}
            <TabsContent value="simulacao" className="space-y-6">
              {/* Input Card */}
              <Card data-ocid="simulador.form.card">
                <CardHeader className="px-5 py-4 border-b border-border">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary/60" />
                    Dados para Simulação
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {/* Client + Mode row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs mb-1 block">
                        <Users className="w-3 h-3 inline mr-1" />
                        Cliente (opcional)
                      </Label>
                      <Select
                        value={selectedClientId}
                        onValueChange={setSelectedClientId}
                      >
                        <SelectTrigger
                          data-ocid="simulador.cliente.select"
                          className="h-9 text-xs"
                        >
                          <SelectValue placeholder="Selecione um cliente..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Simulação avulsa</SelectItem>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">
                        Modo de preenchimento
                      </Label>
                      <RadioGroup
                        value={mode}
                        onValueChange={(v) => setMode(v as "auto" | "manual")}
                        className="flex gap-4 mt-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem
                            data-ocid="simulador.mode_manual.radio"
                            value="manual"
                            id="mode-manual"
                          />
                          <Label
                            htmlFor="mode-manual"
                            className="text-xs font-normal cursor-pointer"
                          >
                            Manual
                          </Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem
                            data-ocid="simulador.mode_auto.radio"
                            value="auto"
                            id="mode-auto"
                          />
                          <Label
                            htmlFor="mode-auto"
                            className="text-xs font-normal cursor-pointer"
                          >
                            Automático (dados do cliente)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <Separator />

                  {/* Financial fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs mb-1 block">
                        Faturamento Bruto Anual *
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          R$
                        </span>
                        <Input
                          data-ocid="simulador.faturamento.input"
                          className="h-9 text-xs pl-8"
                          placeholder="0,00"
                          value={form.faturamentoBruto}
                          onChange={(e) =>
                            handleFieldChange(
                              "faturamentoBruto",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">
                        Folha de Pagamento Mensal
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          R$
                        </span>
                        <Input
                          data-ocid="simulador.folha.input"
                          className="h-9 text-xs pl-8"
                          placeholder="0,00"
                          value={form.folhaMensal}
                          onChange={(e) =>
                            handleFieldChange("folhaMensal", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">
                        Despesas Dedutíveis Anuais
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          R$
                        </span>
                        <Input
                          data-ocid="simulador.despesas.input"
                          className="h-9 text-xs pl-8"
                          placeholder="0,00"
                          value={form.despesasDedut}
                          onChange={(e) =>
                            handleFieldChange("despesasDedut", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs mb-1 block">
                        Atividade Principal
                      </Label>
                      <Select
                        value={form.atividade}
                        onValueChange={(v) =>
                          handleFieldChange(
                            "atividade",
                            v as "servicos" | "comercio" | "industria",
                          )
                        }
                      >
                        <SelectTrigger
                          data-ocid="simulador.atividade.select"
                          className="h-9 text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="servicos">Serviços</SelectItem>
                          <SelectItem value="comercio">Comércio</SelectItem>
                          <SelectItem value="industria">Indústria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Estado (UF)</Label>
                      <Select
                        value={form.estado}
                        onValueChange={(v) => handleFieldChange("estado", v)}
                      >
                        <SelectTrigger
                          data-ocid="simulador.estado.select"
                          className="h-9 text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UFS.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">
                        CNAE (opcional)
                      </Label>
                      <Input
                        data-ocid="simulador.cnae.input"
                        className="h-9 text-xs"
                        placeholder="ex: 6201-5/01"
                        value={form.cnae}
                        onChange={(e) =>
                          handleFieldChange("cnae", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      data-ocid="simulador.simular.primary_button"
                      onClick={handleSimular}
                      disabled={isSimulating}
                      className="gap-2"
                    >
                      {isSimulating ? (
                        <Sparkles className="w-4 h-4 animate-spin" />
                      ) : (
                        <Scale className="w-4 h-4" />
                      )}
                      {isSimulating ? "Calculando..." : "Simular Regimes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 24 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="space-y-5"
                    data-ocid="simulador.results.panel"
                  >
                    {/* ARIA Recommendation */}
                    <div
                      className="flex items-start gap-4 p-4 rounded-xl border-2"
                      style={{
                        borderColor: "oklch(0.7 0.15 185)",
                        background: "oklch(0.97 0.015 185)",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.65 0.14 185), oklch(0.55 0.16 195))",
                        }}
                      >
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-bold"
                            style={{ color: "oklch(0.45 0.12 185)" }}
                          >
                            ARIA
                          </span>
                          <Badge
                            className="text-[10px]"
                            style={{
                              background: "oklch(0.9 0.06 185)",
                              color: "oklch(0.4 0.12 185)",
                            }}
                          >
                            Recomendação Tributária
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {result.recomendacaoTexto}
                        </p>
                        <div className="flex items-center gap-6 mt-3">
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Regime Recomendado
                            </p>
                            <p
                              className="text-sm font-bold"
                              style={{ color: "oklch(0.45 0.15 150)" }}
                            >
                              {REGIME_LABELS[result.recomendado]}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Economia Anual
                            </p>
                            <p
                              className="text-lg font-bold"
                              style={{ color: "oklch(0.45 0.15 150)" }}
                            >
                              {fmt(result.economiaAnual)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Economia Mensal
                            </p>
                            <p className="text-sm font-semibold text-green-600">
                              {fmt(result.economiaMensal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Regime Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {REGIME_KEYS.map((key) => {
                        const calc = result[key];
                        const isRec = result.recomendado === key;
                        const isNA =
                          key === "simplesNacional" && !result.snElegivel;
                        return (
                          <Card
                            key={key}
                            data-ocid={`simulador.regime.${key}.card`}
                            className={cn(
                              "relative transition-all",
                              isRec && "border-green-500 border-2 shadow-md",
                              isNA && "opacity-60",
                            )}
                          >
                            {isRec && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge
                                  className="text-[10px] gap-1 px-2 shadow-sm"
                                  style={{
                                    background: "oklch(0.45 0.15 150)",
                                    color: "white",
                                  }}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Recomendado
                                </Badge>
                              </div>
                            )}
                            {isNA && (
                              <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 rounded-xl">
                                <Badge variant="secondary" className="text-xs">
                                  Não elegível
                                </Badge>
                              </div>
                            )}
                            <CardHeader className="px-4 pb-2 pt-5">
                              <CardTitle className="text-sm font-bold text-foreground">
                                {calc.nome}
                              </CardTitle>
                              <p
                                className={cn(
                                  "text-2xl font-bold mt-1",
                                  isRec ? "text-green-600" : "text-foreground",
                                )}
                              >
                                {isNA ? "N/A" : fmt(calc.total)}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {isNA
                                  ? ""
                                  : `${fmtPct(calc.aliquotaEfetiva)} do faturamento`}
                              </p>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                              <div className="space-y-1 text-xs">
                                {[
                                  ["IRPJ", calc.irpj],
                                  ["CSLL", calc.csll],
                                  ["PIS", calc.pis],
                                  ["COFINS", calc.cofins],
                                  ["CPP", calc.cpp],
                                  ["ISS/ICMS", calc.iss],
                                ].map(([label, value]) => (
                                  <div
                                    key={String(label)}
                                    className="flex justify-between"
                                  >
                                    <span className="text-muted-foreground">
                                      {String(label)}
                                    </span>
                                    <span className="font-medium tabular-nums">
                                      {isNA ? "—" : fmt(value as number)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Detailed Comparison Table */}
                    <Card>
                      <CardHeader className="px-5 py-3 border-b border-border">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Comparativo Detalhado
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">
                                Componente
                              </TableHead>
                              {REGIME_KEYS.map((key) => (
                                <TableHead
                                  key={key}
                                  className={cn(
                                    "text-xs text-center",
                                    result.recomendado === key &&
                                      "text-green-700 font-bold",
                                  )}
                                >
                                  {REGIME_LABELS[key]}
                                  {result.recomendado === key && " ✓"}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[
                              ["IRPJ", "irpj"],
                              ["CSLL", "csll"],
                              ["PIS", "pis"],
                              ["COFINS", "cofins"],
                              ["CPP (Patronal)", "cpp"],
                              ["ISS/ICMS *", "iss"],
                            ].map(([label, field]) => (
                              <TableRow key={field} className="text-xs">
                                <TableCell className="font-medium">
                                  {label}
                                </TableCell>
                                {REGIME_KEYS.map((key) => {
                                  const isRec = result.recomendado === key;
                                  const isNA =
                                    key === "simplesNacional" &&
                                    !result.snElegivel;
                                  const val = result[key][
                                    field as keyof (typeof result)[typeof key]
                                  ] as number;
                                  return (
                                    <TableCell
                                      key={key}
                                      className={cn(
                                        "text-center tabular-nums",
                                        isRec &&
                                          "bg-green-50 text-green-700 font-semibold",
                                      )}
                                    >
                                      {isNA ? "N/A" : fmt(val)}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                            {/* Total row */}
                            <TableRow className="font-bold border-t-2 border-border bg-muted/30">
                              <TableCell className="text-xs font-bold">
                                TOTAL ANUAL
                              </TableCell>
                              {REGIME_KEYS.map((key) => {
                                const isRec = result.recomendado === key;
                                const isNA =
                                  key === "simplesNacional" &&
                                  !result.snElegivel;
                                return (
                                  <TableCell
                                    key={key}
                                    className={cn(
                                      "text-center text-xs tabular-nums font-bold",
                                      isRec && "text-green-700",
                                    )}
                                  >
                                    {isNA ? "N/A" : fmt(result[key].total)}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                            {/* Alíquota Efetiva row */}
                            <TableRow className="text-xs">
                              <TableCell className="text-muted-foreground">
                                Alíquota Efetiva
                              </TableCell>
                              {REGIME_KEYS.map((key) => {
                                const isRec = result.recomendado === key;
                                const isNA =
                                  key === "simplesNacional" &&
                                  !result.snElegivel;
                                return (
                                  <TableCell
                                    key={key}
                                    className={cn(
                                      "text-center tabular-nums",
                                      isRec &&
                                        "bg-green-50 text-green-700 font-semibold",
                                    )}
                                  >
                                    {isNA
                                      ? "N/A"
                                      : fmtPct(result[key].aliquotaEfetiva)}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          </TableBody>
                        </Table>
                        <p className="text-[10px] text-muted-foreground px-4 py-2">
                          * ISS calculado para serviços; ICMS
                          (comércio/indústria) é estadual e varia conforme
                          produto/estado. Simulação estimativa — consulte seu
                          contador para decisões definitivas.
                        </p>
                      </CardContent>
                    </Card>

                    {/* Export Actions */}
                    <div
                      className="flex items-center gap-2 flex-wrap"
                      data-ocid="simulador.export.panel"
                    >
                      <span className="text-xs text-muted-foreground mr-1">
                        Exportar:
                      </span>
                      <Button
                        data-ocid="simulador.pdf.button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => exportPDF(result)}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        PDF
                      </Button>
                      <Button
                        data-ocid="simulador.word.button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => exportWord(result)}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Word
                      </Button>
                      <Button
                        data-ocid="simulador.excel.button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => exportExcel(result)}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Excel
                      </Button>
                      <Button
                        data-ocid="simulador.csv.button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => exportCSV(result)}
                      >
                        <Download className="w-3.5 h-3.5" />
                        CSV
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* ── HISTÓRICO TAB ── */}
            <TabsContent value="historico" className="space-y-4">
              <div className="flex items-center gap-3">
                <Input
                  data-ocid="simulador.historico.search_input"
                  className="h-9 text-xs max-w-xs"
                  placeholder="Filtrar por cliente..."
                  value={historicoFilter}
                  onChange={(e) => setHistoricoFilter(e.target.value)}
                />
                <Badge variant="secondary" className="text-xs">
                  {filteredHistorico.length} simulação(ões)
                </Badge>
              </div>

              {filteredHistorico.length === 0 ? (
                <div
                  className="py-16 text-center text-muted-foreground"
                  data-ocid="simulador.historico.empty_state"
                >
                  <TrendingDown className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">
                    {historicoFilter
                      ? "Nenhuma simulação encontrada para esse filtro."
                      : "Nenhuma simulação realizada ainda."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3" data-ocid="simulador.historico.list">
                  {filteredHistorico.map((item, i) => (
                    <Card
                      key={item.id}
                      data-ocid={`simulador.historico.item.${i + 1}`}
                      className="hover:border-primary/30 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {item.clientNome || "Simulação avulsa"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleString(
                                    "pt-BR",
                                  )
                                : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Fat.: {fmt(item.input.faturamentoBrutoAnual)}/ano
                              {" · "}
                              {item.input.atividade.charAt(0).toUpperCase() +
                                item.input.atividade.slice(1)}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <Badge
                              className="text-[10px] mb-1"
                              style={{
                                background: "oklch(0.9 0.1 150)",
                                color: "oklch(0.35 0.12 150)",
                              }}
                            >
                              {REGIME_LABELS[item.recomendado]}
                            </Badge>
                            <p className="text-xs font-semibold text-green-600">
                              {fmt(item.economiaAnual)}/ano
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              economia
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                          {REGIME_KEYS.map((key) => (
                            <div
                              key={key}
                              className={cn(
                                "text-center p-1.5 rounded-lg",
                                item.recomendado === key
                                  ? "bg-green-50 border border-green-200"
                                  : "bg-muted/40",
                              )}
                            >
                              <p className="text-[10px] text-muted-foreground">
                                {REGIME_LABELS[key]}
                              </p>
                              <p
                                className={cn(
                                  "text-xs font-semibold tabular-nums",
                                  item.recomendado === key
                                    ? "text-green-600"
                                    : "text-foreground",
                                )}
                              >
                                {key === "simplesNacional" && !item.snElegivel
                                  ? "N/A"
                                  : fmt(item[key].total)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      <footer className="no-print px-6 py-3 border-t border-border text-center flex-shrink-0">
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()}. Feito com ❤️ usando{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
