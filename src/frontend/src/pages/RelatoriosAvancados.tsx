import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowUpDown,
  BarChart3,
  Bot,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Settings2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────
type Regime = "Simples Nacional" | "Lucro Presumido" | "Lucro Real";
type SortKey = "posicao" | "faturamento" | "impostos" | "docs";
type SortDir = "asc" | "desc";

interface Cliente {
  id: number;
  nome: string;
  regime: Regime;
  faturamento: number;
  impostosPagos: number;
  docsProcessados: number;
  status: "em dia" | "pendente" | "inadimplente";
}

interface Config {
  showDashboard: boolean;
  showRanking: boolean;
  showGeracaoLote: boolean;
}

// ── Sample data ────────────────────────────────────────────────────────────────
const CLIENTES: Cliente[] = [
  {
    id: 1,
    nome: "Construtora Horizonte Ltda",
    regime: "Lucro Real",
    faturamento: 4820000,
    impostosPagos: 578400,
    docsProcessados: 312,
    status: "em dia",
  },
  {
    id: 2,
    nome: "Mercado Bom Preço ME",
    regime: "Simples Nacional",
    faturamento: 1340000,
    impostosPagos: 87100,
    docsProcessados: 198,
    status: "em dia",
  },
  {
    id: 3,
    nome: "Studio Arquitetos Associados",
    regime: "Lucro Presumido",
    faturamento: 980000,
    impostosPagos: 142000,
    docsProcessados: 145,
    status: "pendente",
  },
  {
    id: 4,
    nome: "Transportadora Rota Sul S.A.",
    regime: "Lucro Real",
    faturamento: 7200000,
    impostosPagos: 936000,
    docsProcessados: 487,
    status: "em dia",
  },
  {
    id: 5,
    nome: "Clínica Bem Estar Ltda",
    regime: "Lucro Presumido",
    faturamento: 720000,
    impostosPagos: 104400,
    docsProcessados: 89,
    status: "em dia",
  },
  {
    id: 6,
    nome: "TechSoft Sistemas EPP",
    regime: "Simples Nacional",
    faturamento: 560000,
    impostosPagos: 36400,
    docsProcessados: 73,
    status: "inadimplente",
  },
  {
    id: 7,
    nome: "Padaria Tradicional do Bairro ME",
    regime: "Simples Nacional",
    faturamento: 320000,
    impostosPagos: 20800,
    docsProcessados: 54,
    status: "em dia",
  },
  {
    id: 8,
    nome: "Indústria Metalúrgica Delta Ltda",
    regime: "Lucro Real",
    faturamento: 3400000,
    impostosPagos: 442000,
    docsProcessados: 263,
    status: "pendente",
  },
];

const MONTHLY_DATA = [
  { month: "Out", value: 285 },
  { month: "Nov", value: 312 },
  { month: "Dez", value: 398 },
  { month: "Jan", value: 271 },
  { month: "Fev", value: 345 },
  { month: "Mar", value: 436 },
];

const ARIA_INSIGHTS = [
  "3 clientes do Simples Nacional poderiam economizar até R$ 42.000/ano migrando para Lucro Presumido — análise detalhada disponível.",
  "Inadimplência acima da média no setor de tecnologia (TechSoft): 45 dias em atraso. Recomendo ação imediata.",
  "Transportadora Rota Sul representa 39% da receita total — considere diversificar a carteira para reduzir risco de concentração.",
];

const RELATORIO_TYPES = [
  "Balanço Patrimonial",
  "DRE",
  "Balancete",
  "Índices Financeiros",
  "Conformidade Fiscal",
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function loadConfig(): Config {
  try {
    const raw = localStorage.getItem("relatorios_avancados_config");
    if (raw) return JSON.parse(raw) as Config;
  } catch {}
  return { showDashboard: true, showRanking: true, showGeracaoLote: true };
}

function saveConfig(cfg: Config) {
  localStorage.setItem("relatorios_avancados_config", JSON.stringify(cfg));
}

// ── Regime badge ───────────────────────────────────────────────────────────────
function RegimeBadge({ regime }: { regime: Regime }) {
  const map: Record<Regime, string> = {
    "Simples Nacional": "bg-blue-500/20 text-blue-300 border-blue-500/30",
    "Lucro Presumido": "bg-purple-500/20 text-purple-300 border-purple-500/30",
    "Lucro Real": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[regime]}`}
    >
      {regime}
    </span>
  );
}

function StatusBadge({ status }: { status: Cliente["status"] }) {
  if (status === "em dia")
    return (
      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border">
        Em Dia
      </Badge>
    );
  if (status === "pendente")
    return (
      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 border">
        Pendente
      </Badge>
    );
  return (
    <Badge className="bg-red-500/20 text-red-300 border-red-500/30 border">
      Inadimplente
    </Badge>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function RelatoriosAvancados() {
  const [periodo, setPeriodo] = useState("trimestre");
  const [regime, setRegime] = useState("todos");
  const [porte, setPorte] = useState("todos");
  const [sortKey, setSortKey] = useState<SortKey>("faturamento");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedClientes, setSelectedClientes] = useState<number[]>(
    CLIENTES.map((c) => c.id),
  );
  const [selectedRelatorios, setSelectedRelatorios] = useState<string[]>([
    "Balanço Patrimonial",
    "DRE",
  ]);
  const [exportFormat, setExportFormat] = useState("zip");
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<Config>(loadConfig);

  const updateConfig = (patch: Partial<Config>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    saveConfig(next);
  };

  // Sort logic
  const sortedClientes = [...CLIENTES].sort((a, b) => {
    let va: number;
    let vb: number;
    if (sortKey === "faturamento") {
      va = a.faturamento;
      vb = b.faturamento;
    } else if (sortKey === "impostos") {
      va = a.impostosPagos;
      vb = b.impostosPagos;
    } else if (sortKey === "docs") {
      va = a.docsProcessados;
      vb = b.docsProcessados;
    } else {
      va = a.id;
      vb = b.id;
    }
    return sortDir === "desc" ? vb - va : va - vb;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const toggleCliente = (id: number) => {
    setSelectedClientes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleRelatorio = (r: string) => {
    setSelectedRelatorios((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  };

  const handleGenerate = async () => {
    if (selectedClientes.length === 0) {
      toast.error("Selecione ao menos um cliente.");
      return;
    }
    if (selectedRelatorios.length === 0) {
      toast.error("Selecione ao menos um tipo de relatório.");
      return;
    }
    setIsGenerating(true);
    toast.loading("Iniciando geração em lote...", { id: "gen" });
    await new Promise((r) => setTimeout(r, 1200));
    toast.loading(`Processando ${selectedClientes.length} clientes...`, {
      id: "gen",
    });
    await new Promise((r) => setTimeout(r, 1500));
    toast.loading(
      `Gerando ${selectedRelatorios.length} tipo(s) de relatório...`,
      { id: "gen" },
    );
    await new Promise((r) => setTimeout(r, 1000));
    const fmtLabel =
      exportFormat === "zip"
        ? "ZIP"
        : exportFormat === "pdf"
          ? "PDF"
          : "Word (.docx)";
    toast.success(
      `${selectedClientes.length * selectedRelatorios.length} relatórios gerados em ${fmtLabel} com sucesso!`,
      { id: "gen" },
    );
    setIsGenerating(false);
  };

  const maxMonthly = Math.max(...MONTHLY_DATA.map((d) => d.value));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Relatórios Avançados
          </h1>
          <p className="text-sm text-muted-foreground">
            Dashboard gerencial, ranking e geração em lote
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-muted/40 border border-border">
            {config.showDashboard && (
              <TabsTrigger value="dashboard" data-ocid="relatorios.tab">
                Dashboard
              </TabsTrigger>
            )}
            {config.showRanking && (
              <TabsTrigger value="ranking" data-ocid="relatorios.tab">
                Ranking de Clientes
              </TabsTrigger>
            )}
            {config.showGeracaoLote && (
              <TabsTrigger value="lote" data-ocid="relatorios.tab">
                Geração em Lote
              </TabsTrigger>
            )}
            <TabsTrigger value="configuracoes" data-ocid="relatorios.tab">
              <Settings2 className="w-3.5 h-3.5 mr-1" />
              Config
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Dashboard ── */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-44" data-ocid="relatorios.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="trimestre">Último Trimestre</SelectItem>
                  <SelectItem value="ano">Este Ano</SelectItem>
                </SelectContent>
              </Select>
              <Select value={regime} onValueChange={setRegime}>
                <SelectTrigger className="w-44" data-ocid="relatorios.select">
                  <SelectValue placeholder="Regime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Regimes</SelectItem>
                  <SelectItem value="simples">Simples Nacional</SelectItem>
                  <SelectItem value="presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
              <Select value={porte} onValueChange={setPorte}>
                <SelectTrigger className="w-36" data-ocid="relatorios.select">
                  <SelectValue placeholder="Porte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="mei">MEI</SelectItem>
                  <SelectItem value="me">ME</SelectItem>
                  <SelectItem value="epp">EPP</SelectItem>
                  <SelectItem value="grande">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card
                className="border border-border rounded-xl bg-card/60"
                data-ocid="relatorios.card"
              >
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Receita Total
                  </p>
                  <p className="text-2xl font-bold text-foreground">R$ 1,84M</p>
                  <p className="text-xs text-green-400 mt-1">
                    ↑ 12,3% vs. período anterior
                  </p>
                </CardContent>
              </Card>
              <Card
                className="border border-border rounded-xl bg-card/60"
                data-ocid="relatorios.card"
              >
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Impostos Devidos
                  </p>
                  <p className="text-2xl font-bold text-yellow-400">R$ 187K</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    8 empresas
                  </p>
                </CardContent>
              </Card>
              <Card
                className="border border-border rounded-xl bg-card/60"
                data-ocid="relatorios.card"
              >
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Inadimplência
                  </p>
                  <p className="text-2xl font-bold text-red-400">R$ 43,2K</p>
                  <p className="text-xs text-red-400 mt-1">
                    ↑ 2,1% vs. média do setor
                  </p>
                </CardContent>
              </Card>
              <Card
                className="border border-border rounded-xl bg-card/60"
                data-ocid="relatorios.card"
              >
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Docs Pendentes
                  </p>
                  <p className="text-2xl font-bold text-orange-400">17</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    3 clientes afetados
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Bar chart */}
            <Card className="border border-border rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Receita Consolidada — Últimos 6 Meses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 h-40 pt-4">
                  {MONTHLY_DATA.map((d) => (
                    <div
                      key={d.month}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-xs text-muted-foreground">
                        {Math.round(d.value / 10) * 10}k
                      </span>
                      <div
                        className="w-full rounded-t-md bg-primary/70 hover:bg-primary transition-colors"
                        style={{ height: `${(d.value / maxMonthly) * 120}px` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {d.month}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ARIA insights */}
            <Card className="border border-primary/30 rounded-xl bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  Análise ARIA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ARIA_INSIGHTS.map((insight) => (
                  <div
                    key={insight.slice(0, 20)}
                    className="flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground/90">{insight}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 2: Ranking ── */}
          <TabsContent value="ranking" className="space-y-4">
            <Card className="border border-border rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Ranking de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                          <button
                            type="button"
                            onClick={() => handleSort("posicao")}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                            data-ocid="relatorios.button"
                          >
                            # <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                          Cliente
                        </th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                          Regime
                        </th>
                        <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                          <button
                            type="button"
                            onClick={() => handleSort("faturamento")}
                            className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                            data-ocid="relatorios.button"
                          >
                            Faturamento <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                          <button
                            type="button"
                            onClick={() => handleSort("impostos")}
                            className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                            data-ocid="relatorios.button"
                          >
                            Impostos <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                          <button
                            type="button"
                            onClick={() => handleSort("docs")}
                            className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                            data-ocid="relatorios.button"
                          >
                            Docs <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                          Status
                        </th>
                        <th className="py-3 px-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedClientes.map((c, idx) => (
                        <tr
                          key={c.id}
                          className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                          data-ocid={`relatorios.row.${idx + 1}`}
                        >
                          <td className="py-3 px-4 text-muted-foreground font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground">
                            {c.nome}
                          </td>
                          <td className="py-3 px-4">
                            <RegimeBadge regime={c.regime} />
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-foreground">
                            {formatBRL(c.faturamento)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {formatBRL(c.impostosPagos)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {c.docsProcessados}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-primary hover:text-primary"
                              data-ocid={`relatorios.button.${idx + 1}`}
                              onClick={() =>
                                toast.info(
                                  `ARIA: ${c.nome} — ${c.regime === "Simples Nacional" ? "Possível economia tributária de até 18% com mudança de regime." : c.regime === "Lucro Presumido" ? "Índice de liquidez corrente em 1,4 — saudável. Atenção ao ciclo financeiro." : "Empresa grande porte: aproveitar créditos PIS/COFINS não-cumulativos."}`,
                                  { duration: 6000 },
                                )
                              }
                            >
                              <Bot className="w-3.5 h-3.5 mr-1" /> ARIA
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 3: Geração em Lote ── */}
          <TabsContent value="lote" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: client selection */}
              <Card className="border border-border rounded-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Selecionar Clientes
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      data-ocid="relatorios.button"
                      onClick={() =>
                        setSelectedClientes(
                          selectedClientes.length === CLIENTES.length
                            ? []
                            : CLIENTES.map((c) => c.id),
                        )
                      }
                    >
                      {selectedClientes.length === CLIENTES.length
                        ? "Desmarcar Todos"
                        : "Selecionar Todos"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {CLIENTES.map((c, idx) => (
                    <button
                      key={c.id}
                      type="button"
                      className="flex w-full items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors text-left"
                      data-ocid={`relatorios.item.${idx + 1}`}
                      onClick={() => toggleCliente(c.id)}
                    >
                      <Checkbox
                        checked={selectedClientes.includes(c.id)}
                        onCheckedChange={() => toggleCliente(c.id)}
                        data-ocid={`relatorios.checkbox.${idx + 1}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {c.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.regime}
                        </p>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Right: options */}
              <div className="space-y-4">
                <Card className="border border-border rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Tipos de Relatório
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {RELATORIO_TYPES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        className="flex w-full items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors text-left"
                        onClick={() => toggleRelatorio(r)}
                      >
                        <Checkbox
                          checked={selectedRelatorios.includes(r)}
                          onCheckedChange={() => toggleRelatorio(r)}
                          data-ocid="relatorios.checkbox"
                        />
                        <span className="text-sm text-foreground">{r}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border border-border rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Download className="w-4 h-4 text-primary" />
                      Formato de Exportação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select
                      value={exportFormat}
                      onValueChange={setExportFormat}
                    >
                      <SelectTrigger data-ocid="relatorios.select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zip">
                          📦 ZIP — pasta organizada por cliente
                        </SelectItem>
                        <SelectItem value="pdf">
                          📄 PDF — documento único consolidado
                        </SelectItem>
                        <SelectItem value="word">
                          📝 Word — arquivo .docx editável
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Settings2 className="w-3 h-3" />
                      Configurável como padrão nas Configurações
                    </p>
                    <Button
                      className="w-full mt-2"
                      disabled={isGenerating}
                      onClick={handleGenerate}
                      data-ocid="relatorios.primary_button"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Gerar Relatórios ({selectedClientes.length} clientes)
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Summary */}
            {selectedClientes.length > 0 && selectedRelatorios.length > 0 && (
              <Card className="border border-primary/20 bg-primary/5 rounded-xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                  <p className="text-sm text-foreground/90">
                    <strong>{selectedClientes.length}</strong> clientes ×{" "}
                    <strong>{selectedRelatorios.length}</strong> tipo(s) ={" "}
                    <strong>
                      {selectedClientes.length * selectedRelatorios.length}
                    </strong>{" "}
                    arquivos em formato{" "}
                    <strong>
                      {exportFormat === "zip"
                        ? "ZIP"
                        : exportFormat === "pdf"
                          ? "PDF"
                          : "Word"}
                    </strong>
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Tab: Configurações ── */}
          <TabsContent value="configuracoes" className="space-y-6">
            <Card className="border border-border rounded-xl">
              <CardHeader>
                <CardTitle className="text-base">Seções Ativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <div>
                    <Label className="text-sm font-medium">
                      Dashboard Consolidado
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Métricas gerais, gráficos e análise ARIA
                    </p>
                  </div>
                  <Switch
                    checked={config.showDashboard}
                    onCheckedChange={(v) => updateConfig({ showDashboard: v })}
                    data-ocid="relatorios.switch"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <div>
                    <Label className="text-sm font-medium">
                      Ranking de Clientes
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Tabela ordenável com análise por cliente
                    </p>
                  </div>
                  <Switch
                    checked={config.showRanking}
                    onCheckedChange={(v) => updateConfig({ showRanking: v })}
                    data-ocid="relatorios.switch"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <div>
                    <Label className="text-sm font-medium">
                      Geração em Lote
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Exportação ZIP, PDF ou Word para múltiplos clientes
                    </p>
                  </div>
                  <Switch
                    checked={config.showGeracaoLote}
                    onCheckedChange={(v) =>
                      updateConfig({ showGeracaoLote: v })
                    }
                    data-ocid="relatorios.switch"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
