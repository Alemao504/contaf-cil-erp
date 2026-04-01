import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Bot,
  Download,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import { getAllRecords, putRecord } from "../lib/db";

interface Cliente {
  id: string;
  nome: string;
  faturamentoAnual?: number;
  regime?: string;
}

interface Cenario {
  id: string;
  nome: string;
  tipo: "otimista" | "realista" | "pessimista" | "personalizado";
  clienteId: string;
  clienteNome: string;
  parametros: {
    faturamentoBase: number;
    crescimentoReceita: number; // % ao ano
    crescimentoCusto: number; // % ao ano
    margemAtual: number; // %
    investimentoAnual: number;
    regime: string;
    anos: number;
  };
  projecoes: ProjecaoAnual[];
  recomendacaoARIA: string;
  dataCriacao: string;
}

interface ProjecaoAnual {
  ano: number;
  receita: number;
  custo: number;
  lucro: number;
  margem: number;
  imposto: number;
  fluxoCaixa: number;
  roi: number;
}

const CLIENTES_MOCK: Cliente[] = [
  {
    id: "c1",
    nome: "TechCorp Ltda",
    faturamentoAnual: 1200000,
    regime: "Simples Nacional",
  },
  {
    id: "c2",
    nome: "Tech Solutions SA",
    faturamentoAnual: 3500000,
    regime: "Lucro Presumido",
  },
  {
    id: "c3",
    nome: "Construtora Omega",
    faturamentoAnual: 8000000,
    regime: "Lucro Real",
  },
  {
    id: "c4",
    nome: "Farmácia Saúde+",
    faturamentoAnual: 950000,
    regime: "Simples Nacional",
  },
  {
    id: "c5",
    nome: "Restaurante Sabor",
    faturamentoAnual: 480000,
    regime: "Simples Nacional",
  },
];

const PRESETS = {
  otimista: { crescimentoReceita: 20, crescimentoCusto: 10, margemAtual: 25 },
  realista: { crescimentoReceita: 10, crescimentoCusto: 8, margemAtual: 18 },
  pessimista: { crescimentoReceita: 2, crescimentoCusto: 12, margemAtual: 10 },
};

function calcularAliquotaImposto(receita: number, regime: string): number {
  if (regime === "Simples Nacional") {
    if (receita <= 180000) return 0.04;
    if (receita <= 360000) return 0.073;
    if (receita <= 720000) return 0.095;
    if (receita <= 1800000) return 0.107;
    if (receita <= 3600000) return 0.143;
    return 0.19;
  }
  if (regime === "Lucro Presumido") return 0.1135;
  return 0.34;
}

function calcularProjecoes(params: Cenario["parametros"]): ProjecaoAnual[] {
  const {
    faturamentoBase,
    crescimentoReceita,
    crescimentoCusto,
    margemAtual,
    investimentoAnual,
    regime,
    anos,
  } = params;
  const projecoes: ProjecaoAnual[] = [];
  let receita = faturamentoBase;
  let custo = faturamentoBase * (1 - margemAtual / 100);

  for (let i = 1; i <= anos; i++) {
    receita = receita * (1 + crescimentoReceita / 100);
    custo = custo * (1 + crescimentoCusto / 100);
    const lucroAntes = receita - custo;
    const aliquota = calcularAliquotaImposto(receita, regime);
    const imposto = Math.max(0, lucroAntes * aliquota);
    const lucro = lucroAntes - imposto;
    const margem = (lucro / receita) * 100;
    const fluxoCaixa = lucro - investimentoAnual;
    const roi = investimentoAnual > 0 ? (lucro / investimentoAnual) * 100 : 0;
    projecoes.push({
      ano: new Date().getFullYear() + i,
      receita: Math.round(receita),
      custo: Math.round(custo),
      lucro: Math.round(lucro),
      margem: Number.parseFloat(margem.toFixed(1)),
      imposto: Math.round(imposto),
      fluxoCaixa: Math.round(fluxoCaixa),
      roi: Number.parseFloat(roi.toFixed(1)),
    });
  }
  return projecoes;
}

function gerarRecomendacaoARIA(
  cenario: Omit<Cenario, "recomendacaoARIA" | "id" | "dataCriacao">,
): string {
  const { projecoes, parametros } = cenario;
  if (!projecoes.length) return "";
  const ultimo = projecoes[projecoes.length - 1];
  const primeiro = projecoes[0];
  const crescimentoTotal =
    ((ultimo.receita - parametros.faturamentoBase) /
      parametros.faturamentoBase) *
    100;
  const tendenciaMargin =
    ultimo.margem > primeiro.margem
      ? "crescente"
      : ultimo.margem < primeiro.margem
        ? "decrescente"
        : "estável";

  let texto = `Com base nas projeções do cenário ${cenario.tipo === "otimista" ? "Otimista" : cenario.tipo === "realista" ? "Realista" : cenario.tipo === "pessimista" ? "Pessimista" : "Personalizado"} para ${cenario.clienteNome}:\n\n`;

  texto += `📈 Crescimento de receita projetado: ${crescimentoTotal.toFixed(0)}% em ${parametros.anos} anos.\n`;
  texto += `💰 Lucro estimado em ${ultimo.ano}: R$ ${ultimo.lucro.toLocaleString("pt-BR")}.\n`;
  texto += `📊 Margem de lucro ${tendenciaMargin} — chegando a ${ultimo.margem.toFixed(1)}% no último ano.\n`;

  if (ultimo.margem < 10) {
    texto +=
      "⚠️ Atenção: margem abaixo de 10% indica necessidade de revisar custos operacionais.";
  } else if (ultimo.margem > 20) {
    texto +=
      "✅ Margem saudável! A empresa está no caminho certo — considere realocar parte dos lucros em expansão.";
  } else {
    texto +=
      "📌 Margem moderada. Recomendo monitorar os custos variáveis e avaliar oportunidades de redução de impostos via mudança de regime tributário.";
  }

  if (
    parametros.regime === "Simples Nacional" &&
    parametros.faturamentoBase > 3600000
  ) {
    texto +=
      "\n\n🔄 Sugestão: com faturamento acima de R$ 3,6M, avalie migrar para Lucro Presumido — pode haver economia tributária significativa.";
  }

  return texto;
}

function formatCurrency(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function MiniBarChart({
  projecoes,
  campo,
}: { projecoes: ProjecaoAnual[]; campo: keyof ProjecaoAnual }) {
  if (!projecoes.length) return null;
  const values = projecoes.map((p) => Number(p[campo]));
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div
          key={projecoes[i]?.ano ?? i}
          className="flex flex-col items-center gap-0.5 flex-1"
        >
          <div
            className="w-full rounded-sm bg-blue-500 opacity-80 transition-all"
            style={{
              height: `${max > 0 ? (v / max) * 44 : 2}px`,
              minHeight: "2px",
            }}
          />
          <span className="text-[9px] text-muted-foreground">
            {projecoes[i].ano}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SimulacaoCenarios() {
  const { addMessage } = useARIA();
  const [clientes, setClientes] = useState<Cliente[]>(CLIENTES_MOCK);
  const [cenarios, setCenarios] = useState<Cenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [ariaPensando, setAriaPensando] = useState(false);
  const [selectedCenario, setSelectedCenario] = useState<Cenario | null>(null);
  const [activeTab, setActiveTab] = useState("novo");

  // Form state
  const [clienteId, setClienteId] = useState("");
  const [tipoPreset, setTipoPreset] = useState<
    "otimista" | "realista" | "pessimista" | "personalizado"
  >("realista");
  const [nomeCenario, setNomeCenario] = useState("");
  const [faturamentoBase, setFaturamentoBase] = useState(1000000);
  const [crescimentoReceita, setCrescimentoReceita] = useState(10);
  const [crescimentoCusto, setCrescimentoCusto] = useState(8);
  const [margemAtual, setMargemAtual] = useState(18);
  const [investimentoAnual, setInvestimentoAnual] = useState(0);
  const [regime, setRegime] = useState("Simples Nacional");
  const [anos, setAnos] = useState(3);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [cls, cens] = await Promise.all([
        getAllRecords<Cliente>("clientes"),
        getAllRecords<Cenario>("simulacao_cenarios"),
      ]);
      if (cls.length > 0) setClientes(cls);
      setCenarios(
        cens.sort(
          (a, b) =>
            new Date(b.dataCriacao).getTime() -
            new Date(a.dataCriacao).getTime(),
        ),
      );
    } catch {
      // silently fall back to mock data
    }
  }

  function applyPreset(tipo: typeof tipoPreset) {
    setTipoPreset(tipo);
    if (tipo !== "personalizado") {
      const p = PRESETS[tipo];
      setCrescimentoReceita(p.crescimentoReceita);
      setCrescimentoCusto(p.crescimentoCusto);
      setMargemAtual(p.margemAtual);
    }
    const cliente = clientes.find((c) => c.id === clienteId);
    const base = `${tipo === "otimista" ? "Otimista" : tipo === "realista" ? "Realista" : tipo === "pessimista" ? "Pessimista" : ""} ${cliente?.nome || ""}`;
    setNomeCenario(base.trim());
  }

  function selectCliente(id: string) {
    setClienteId(id);
    const c = clientes.find((cl) => cl.id === id);
    if (c) {
      if (c.faturamentoAnual) setFaturamentoBase(c.faturamentoAnual);
      if (c.regime) setRegime(c.regime);
      const base = `${tipoPreset === "otimista" ? "Otimista" : tipoPreset === "realista" ? "Realista" : tipoPreset === "pessimista" ? "Pessimista" : ""} ${c.nome}`;
      setNomeCenario(base.trim());
    }
  }

  const simular = useCallback(async () => {
    if (!clienteId) {
      toast.error("Selecione um cliente");
      return;
    }
    if (!nomeCenario.trim()) {
      toast.error("Dê um nome ao cenário");
      return;
    }
    setLoading(true);
    setAriaPensando(true);
    addMessage({
      type: "processing",
      text: `ARIA está calculando projeções financeiras para ${clientes.find((c) => c.id === clienteId)?.nome}...`,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const cliente = clientes.find((c) => c.id === clienteId)!;
    const params: Cenario["parametros"] = {
      faturamentoBase,
      crescimentoReceita,
      crescimentoCusto,
      margemAtual,
      investimentoAnual,
      regime,
      anos,
    };
    const projecoes = calcularProjecoes(params);
    const draft = {
      nome: nomeCenario,
      tipo: tipoPreset,
      clienteId,
      clienteNome: cliente.nome,
      parametros: params,
      projecoes,
      dataCriacao: new Date().toISOString(),
    };
    const recomendacaoARIA = gerarRecomendacaoARIA(draft);
    const cenario: Cenario = {
      id: `sc-${Date.now()}`,
      ...draft,
      recomendacaoARIA,
    };

    try {
      await putRecord("simulacao_cenarios", cenario);
    } catch {
      /* ignore */
    }
    setCenarios((prev) => [cenario, ...prev]);
    setSelectedCenario(cenario);
    setActiveTab("resultado");
    setLoading(false);
    setAriaPensando(false);

    addMessage({
      type: "success",
      text: `✅ Simulação concluída para ${cliente.nome}. Projeção de receita em ${anos} anos: ${formatCurrency(projecoes[projecoes.length - 1].receita)}. Lucro estimado: ${formatCurrency(projecoes[projecoes.length - 1].lucro)}.`,
    });
    toast.success("Simulação calculada com sucesso!");
  }, [
    clienteId,
    nomeCenario,
    faturamentoBase,
    crescimentoReceita,
    crescimentoCusto,
    margemAtual,
    investimentoAnual,
    regime,
    anos,
    tipoPreset,
    clientes,
    addMessage,
  ]);

  async function deletarCenario(id: string) {
    try {
      const { deleteRecord } = await import("../lib/db");
      await deleteRecord("simulacao_cenarios", id);
    } catch {
      /* ignore */
    }
    setCenarios((prev) => prev.filter((c) => c.id !== id));
    if (selectedCenario?.id === id) setSelectedCenario(null);
    toast.success("Cenário removido");
  }

  function exportar(tipo: "pdf" | "csv") {
    if (!selectedCenario) return;
    if (tipo === "csv") {
      const header =
        "Ano,Receita,Custo,Lucro,Margem(%),Imposto,Fluxo de Caixa,ROI(%)";
      const rows = selectedCenario.projecoes.map(
        (p) =>
          `${p.ano},${p.receita},${p.custo},${p.lucro},${p.margem},${p.imposto},${p.fluxoCaixa},${p.roi}`,
      );
      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cenario_${selectedCenario.nome}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exportado!");
    } else {
      window.print();
      toast.success("Enviado para impressão/PDF");
    }
    addMessage({
      type: "info",
      text: `📁 Cenário "${selectedCenario.nome}" exportado como ${tipo.toUpperCase()}.`,
    });
  }

  const tipoColor = {
    otimista: "bg-green-100 text-green-800",
    realista: "bg-blue-100 text-blue-800",
    pessimista: "bg-red-100 text-red-800",
    personalizado: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="text-blue-600" /> Simulação de Cenários
            Futuros
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Projete receitas, lucros e fluxo de caixa com análise da ARIA
          </p>
        </div>
        <Badge
          variant="outline"
          className="flex items-center gap-1 text-blue-600 border-blue-300"
        >
          <Bot className="w-3 h-3" /> ARIA ativa
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="novo">
            <Plus className="w-4 h-4 mr-1" />
            Novo Cenário
          </TabsTrigger>
          <TabsTrigger value="resultado" disabled={!selectedCenario}>
            <TrendingUp className="w-4 h-4 mr-1" />
            Resultado
          </TabsTrigger>
          <TabsTrigger value="historico">
            <BarChart3 className="w-4 h-4 mr-1" />
            Histórico ({cenarios.length})
          </TabsTrigger>
        </TabsList>

        {/* ── NOVO CENÁRIO ── */}
        <TabsContent value="novo" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Preset cards */}
            {(["otimista", "realista", "pessimista"] as const).map((tipo) => (
              <Card
                key={tipo}
                className={`cursor-pointer border-2 transition-all ${tipoPreset === tipo ? "border-blue-500 bg-blue-50" : "border-transparent hover:border-blue-200"}`}
                onClick={() => applyPreset(tipo)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 capitalize">
                    {tipo === "otimista" ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : tipo === "pessimista" ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                    )}
                    Cenário {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p>
                    Crescimento receita:{" "}
                    <strong>+{PRESETS[tipo].crescimentoReceita}%/ano</strong>
                  </p>
                  <p>
                    Crescimento custos:{" "}
                    <strong>+{PRESETS[tipo].crescimentoCusto}%/ano</strong>
                  </p>
                  <p>
                    Margem atual: <strong>{PRESETS[tipo].margemAtual}%</strong>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Parâmetros do Cenário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Cliente</Label>
                    <Select value={clienteId} onValueChange={selectCliente}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Nome do Cenário</Label>
                    <Input
                      value={nomeCenario}
                      onChange={(e) => setNomeCenario(e.target.value)}
                      placeholder="Ex: Expansão 2027"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Faturamento Base (R$)</Label>
                    <Input
                      type="number"
                      value={faturamentoBase}
                      onChange={(e) =>
                        setFaturamentoBase(Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Regime Tributário</Label>
                    <Select value={regime} onValueChange={setRegime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Simples Nacional">
                          Simples Nacional
                        </SelectItem>
                        <SelectItem value="Lucro Presumido">
                          Lucro Presumido
                        </SelectItem>
                        <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>
                    Crescimento de Receita:{" "}
                    <strong>{crescimentoReceita}%/ano</strong>
                  </Label>
                  <Slider
                    value={[crescimentoReceita]}
                    onValueChange={([v]) => {
                      setCrescimentoReceita(v);
                      setTipoPreset("personalizado");
                    }}
                    min={-10}
                    max={50}
                    step={1}
                  />
                </div>

                <div className="space-y-1">
                  <Label>
                    Crescimento de Custos:{" "}
                    <strong>{crescimentoCusto}%/ano</strong>
                  </Label>
                  <Slider
                    value={[crescimentoCusto]}
                    onValueChange={([v]) => {
                      setCrescimentoCusto(v);
                      setTipoPreset("personalizado");
                    }}
                    min={0}
                    max={40}
                    step={1}
                  />
                </div>

                <div className="space-y-1">
                  <Label>
                    Margem de Lucro Atual: <strong>{margemAtual}%</strong>
                  </Label>
                  <Slider
                    value={[margemAtual]}
                    onValueChange={([v]) => {
                      setMargemAtual(v);
                      setTipoPreset("personalizado");
                    }}
                    min={1}
                    max={60}
                    step={1}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Investimento Anual (R$)</Label>
                    <Input
                      type="number"
                      value={investimentoAnual}
                      onChange={(e) =>
                        setInvestimentoAnual(Number(e.target.value))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Horizonte de Projeção</Label>
                    <Select
                      value={String(anos)}
                      onValueChange={(v) => setAnos(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 ano</SelectItem>
                        <SelectItem value="2">2 anos</SelectItem>
                        <SelectItem value="3">3 anos</SelectItem>
                        <SelectItem value="5">5 anos</SelectItem>
                        <SelectItem value="10">10 anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={simular} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Simular com ARIA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview rápido */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prévia da Projeção</CardTitle>
              </CardHeader>
              <CardContent>
                {faturamentoBase > 0 ? (
                  (() => {
                    const prev = calcularProjecoes({
                      faturamentoBase,
                      crescimentoReceita,
                      crescimentoCusto,
                      margemAtual,
                      investimentoAnual,
                      regime,
                      anos,
                    });
                    const ultimo = prev[prev.length - 1];
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            {
                              label: "Receita final",
                              value: formatCurrency(ultimo?.receita ?? 0),
                              color: "text-blue-600",
                            },
                            {
                              label: "Lucro final",
                              value: formatCurrency(ultimo?.lucro ?? 0),
                              color: "text-green-600",
                            },
                            {
                              label: "Margem final",
                              value: `${ultimo?.margem ?? 0}%`,
                              color:
                                ultimo?.margem > 15
                                  ? "text-green-600"
                                  : "text-orange-500",
                            },
                            {
                              label: "Imposto total",
                              value: formatCurrency(
                                prev.reduce((a, p) => a + p.imposto, 0),
                              ),
                              color: "text-red-500",
                            },
                          ].map(({ label, value, color }) => (
                            <div
                              key={label}
                              className="bg-muted rounded-lg p-3"
                            >
                              <p className="text-xs text-muted-foreground">
                                {label}
                              </p>
                              <p className={`font-bold text-sm ${color}`}>
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Evolução da Receita
                          </p>
                          <MiniBarChart projecoes={prev} campo="receita" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Evolução do Lucro
                          </p>
                          <MiniBarChart projecoes={prev} campo="lucro" />
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Preencha os parâmetros para ver a prévia
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── RESULTADO ── */}
        <TabsContent value="resultado" className="space-y-4 mt-4">
          {selectedCenario && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">
                    {selectedCenario.nome}
                  </h2>
                  <Badge className={tipoColor[selectedCenario.tipo]}>
                    {selectedCenario.tipo}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedCenario.clienteNome}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportar("csv")}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportar("pdf")}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>

              {/* KPIs resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: "Receita final",
                    value: formatCurrency(
                      selectedCenario.projecoes.at(-1)?.receita ?? 0,
                    ),
                    icon: TrendingUp,
                    color: "text-blue-600",
                  },
                  {
                    label: "Lucro final",
                    value: formatCurrency(
                      selectedCenario.projecoes.at(-1)?.lucro ?? 0,
                    ),
                    icon: TrendingUp,
                    color: "text-green-600",
                  },
                  {
                    label: "Margem final",
                    value: `${selectedCenario.projecoes.at(-1)?.margem ?? 0}%`,
                    icon: BarChart3,
                    color: "text-purple-600",
                  },
                  {
                    label: "Impostos totais",
                    value: formatCurrency(
                      selectedCenario.projecoes.reduce(
                        (a, p) => a + p.imposto,
                        0,
                      ),
                    ),
                    icon: TrendingDown,
                    color: "text-red-500",
                  },
                ].map(({ label, value, icon: Icon, color }) => (
                  <Card key={label}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </div>
                      <p className={`font-bold text-lg mt-1 ${color}`}>
                        {value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Tabela detalhada */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Projeções Anuais Detalhadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ano</TableHead>
                          <TableHead className="text-right">Receita</TableHead>
                          <TableHead className="text-right">Custos</TableHead>
                          <TableHead className="text-right">Impostos</TableHead>
                          <TableHead className="text-right">
                            Lucro Líquido
                          </TableHead>
                          <TableHead className="text-right">Margem</TableHead>
                          <TableHead className="text-right">
                            Fluxo de Caixa
                          </TableHead>
                          {selectedCenario.parametros.investimentoAnual > 0 && (
                            <TableHead className="text-right">ROI</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCenario.projecoes.map((p) => (
                          <TableRow key={p.ano}>
                            <TableCell className="font-medium">
                              {p.ano}
                            </TableCell>
                            <TableCell className="text-right text-blue-600">
                              {formatCurrency(p.receita)}
                            </TableCell>
                            <TableCell className="text-right text-orange-500">
                              {formatCurrency(p.custo)}
                            </TableCell>
                            <TableCell className="text-right text-red-500">
                              {formatCurrency(p.imposto)}
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-semibold">
                              {formatCurrency(p.lucro)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className={
                                  p.margem >= 15
                                    ? "text-green-600 border-green-300"
                                    : p.margem >= 8
                                      ? "text-orange-500 border-orange-300"
                                      : "text-red-500 border-red-300"
                                }
                              >
                                {p.margem}%
                              </Badge>
                            </TableCell>
                            <TableCell
                              className={`text-right ${p.fluxoCaixa >= 0 ? "text-green-600" : "text-red-500"}`}
                            >
                              {formatCurrency(p.fluxoCaixa)}
                            </TableCell>
                            {selectedCenario.parametros.investimentoAnual >
                              0 && (
                              <TableCell className="text-right">
                                {p.roi}%
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Gráficos mini */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { titulo: "Receita por Ano", campo: "receita" as const },
                  { titulo: "Lucro por Ano", campo: "lucro" as const },
                  { titulo: "Fluxo de Caixa", campo: "fluxoCaixa" as const },
                ].map(({ titulo, campo }) => (
                  <Card key={titulo}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{titulo}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MiniBarChart
                        projecoes={selectedCenario.projecoes}
                        campo={campo}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recomendação ARIA */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                    <Bot className="w-4 h-4" /> Análise e Recomendação da ARIA
                    {ariaPensando && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-900 whitespace-pre-line">
                    {selectedCenario.recomendacaoARIA}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── HISTÓRICO ── */}
        <TabsContent value="historico" className="mt-4">
          {cenarios.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum cenário simulado ainda.</p>
              <p className="text-sm">
                Crie seu primeiro cenário na aba "Novo Cenário".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cenarios.map((c) => (
                <Card key={c.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm">{c.nome}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {c.clienteNome}
                        </p>
                      </div>
                      <Badge className={`text-xs ${tipoColor[c.tipo]}`}>
                        {c.tipo}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <MiniBarChart projecoes={c.projecoes} campo="lucro" />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Receita final</p>
                        <p className="font-semibold text-blue-600">
                          {formatCurrency(c.projecoes.at(-1)?.receita ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Lucro final</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(c.projecoes.at(-1)?.lucro ?? 0)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.dataCriacao).toLocaleDateString("pt-BR")}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCenario(c);
                          setActiveTab("resultado");
                        }}
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletarCenario(c.id)}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
