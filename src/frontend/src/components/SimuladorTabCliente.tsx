import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Bot, CheckCircle2, Scale, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import {
  type SimulacaoResult,
  type SimuladorInput,
  calcularRegimes,
} from "../lib/simuladorService";

interface Props {
  clienteNome: string;
  clienteCnpj: string;
  regimeAtual: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );

const REGIME_KEYS = ["simplesNacional", "lucroPresumido", "lucroReal"] as const;
const REGIME_LABELS: Record<string, string> = {
  simplesNacional: "Simples Nacional",
  lucroPresumido: "Lucro Presumido",
  lucroReal: "Lucro Real",
};

function fmtInput(v: string): string {
  const n = v.replace(/\D/g, "");
  if (!n) return "";
  return (Number.parseInt(n, 10) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseNum(s: string): number {
  return Math.max(
    0,
    Number.parseFloat(s.replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
  );
}

export function SimuladorTabCliente({ clienteNome, regimeAtual }: Props) {
  const { addMessage } = useARIA();
  const [faturamento, setFaturamento] = useState("");
  const [folha, setFolha] = useState("");
  const [despesas, setDespesas] = useState("");
  const [atividade, setAtividade] = useState<
    "servicos" | "comercio" | "industria"
  >("servicos");
  const [result, setResult] = useState<SimulacaoResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Hint regime current
  const regimeHint =
    regimeAtual.includes("Simples") || regimeAtual === "SN"
      ? "simplesNacional"
      : regimeAtual.includes("Presumido") || regimeAtual === "LP"
        ? "lucroPresumido"
        : "lucroReal";

  const handleSimular = async () => {
    const fat = parseNum(faturamento);
    if (fat <= 0) {
      toast.error("Informe o faturamento bruto anual");
      return;
    }
    setIsSimulating(true);
    try {
      const input: SimuladorInput = {
        faturamentoBrutoAnual: fat,
        folhaMensalTotal: parseNum(folha),
        despesasDedutiveisAnual: parseNum(despesas),
        cnae: "",
        atividade,
        estado: "SP",
      };
      const calc = calcularRegimes(input);
      setResult(calc);
      addMessage({
        type: "success",
        text: `📊 Simulação para ${clienteNome}: ${REGIME_LABELS[calc.recomendado]} é o regime mais vantajoso. Economia: ${fmt(calc.economiaAnual)}/ano.`,
      });
    } catch {
      toast.error("Erro ao calcular");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current regime badge */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Regime atual:</span>
        <Badge variant="secondary" className="text-[10px]">
          {regimeAtual}
        </Badge>
      </div>

      {/* Compact form */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Faturamento Anual *</Label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              R$
            </span>
            <Input
              data-ocid="simulador_tab.faturamento.input"
              className="h-8 text-xs pl-7"
              placeholder="0,00"
              value={faturamento}
              onChange={(e) => setFaturamento(fmtInput(e.target.value))}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Folha Mensal</Label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              R$
            </span>
            <Input
              data-ocid="simulador_tab.folha.input"
              className="h-8 text-xs pl-7"
              placeholder="0,00"
              value={folha}
              onChange={(e) => setFolha(fmtInput(e.target.value))}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Despesas Dedutíveis</Label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              R$
            </span>
            <Input
              data-ocid="simulador_tab.despesas.input"
              className="h-8 text-xs pl-7"
              placeholder="0,00"
              value={despesas}
              onChange={(e) => setDespesas(fmtInput(e.target.value))}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Atividade</Label>
          <Select
            value={atividade}
            onValueChange={(v) =>
              setAtividade(v as "servicos" | "comercio" | "industria")
            }
          >
            <SelectTrigger
              data-ocid="simulador_tab.atividade.select"
              className="h-8 text-xs"
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
      </div>

      <Button
        data-ocid="simulador_tab.simular.primary_button"
        size="sm"
        className="w-full gap-2"
        onClick={handleSimular}
        disabled={isSimulating}
      >
        {isSimulating ? (
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Scale className="w-3.5 h-3.5" />
        )}
        {isSimulating ? "Calculando..." : "Simular Regimes"}
      </Button>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {/* ARIA Rec */}
            <div
              className="flex items-start gap-2.5 p-3 rounded-lg border"
              style={{
                borderColor: "oklch(0.7 0.15 185)",
                background: "oklch(0.97 0.015 185)",
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.14 185), oklch(0.55 0.16 195))",
                }}
              >
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: "oklch(0.45 0.12 185)" }}
                  >
                    ARIA
                  </span>
                  <Badge
                    className="text-[9px] px-1.5"
                    style={{
                      background: "oklch(0.9 0.06 185)",
                      color: "oklch(0.4 0.12 185)",
                    }}
                  >
                    {REGIME_LABELS[result.recomendado]}
                  </Badge>
                  {result.recomendado === regimeHint ? (
                    <Badge
                      className="text-[9px] px-1.5"
                      style={{
                        background: "oklch(0.9 0.1 150)",
                        color: "oklch(0.4 0.14 150)",
                      }}
                    >
                      Regime atual ✓
                    </Badge>
                  ) : (
                    <Badge className="text-[9px] px-1.5" variant="secondary">
                      Trocar recomendado
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {result.recomendacaoTexto}
                </p>
                <p className="text-xs font-bold text-green-600 mt-1">
                  Economia: {fmt(result.economiaAnual)}/ano
                </p>
              </div>
            </div>

            {/* Compact comparison table */}
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] py-2">Componente</TableHead>
                  {REGIME_KEYS.map((key) => (
                    <TableHead
                      key={key}
                      className={cn(
                        "text-[11px] py-2 text-center",
                        result.recomendado === key &&
                          "text-green-700 font-bold",
                      )}
                    >
                      {key === "simplesNacional"
                        ? "Simples N."
                        : key === "lucroPresumido"
                          ? "L. Presumido"
                          : "Lucro Real"}
                      {result.recomendado === key && (
                        <CheckCircle2 className="w-3 h-3 inline ml-0.5 text-green-600" />
                      )}
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
                  ["CPP", "cpp"],
                  ["ISS/ICMS", "iss"],
                ].map(([label, field]) => (
                  <TableRow key={field}>
                    <TableCell className="py-1.5 text-muted-foreground">
                      {label}
                    </TableCell>
                    {REGIME_KEYS.map((key) => {
                      const isRec = result.recomendado === key;
                      const isNA =
                        key === "simplesNacional" && !result.snElegivel;
                      const val = result[key][
                        field as keyof (typeof result)[typeof key]
                      ] as number;
                      return (
                        <TableCell
                          key={key}
                          className={cn(
                            "py-1.5 text-center tabular-nums",
                            isRec && "bg-green-50 font-semibold text-green-700",
                          )}
                        >
                          {isNA ? "N/A" : fmt(val)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/30 border-t-2">
                  <TableCell className="py-2">TOTAL</TableCell>
                  {REGIME_KEYS.map((key) => {
                    const isRec = result.recomendado === key;
                    const isNA =
                      key === "simplesNacional" && !result.snElegivel;
                    return (
                      <TableCell
                        key={key}
                        className={cn(
                          "py-2 text-center tabular-nums",
                          isRec && "text-green-700",
                        )}
                      >
                        {isNA ? "N/A" : fmt(result[key].total)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
