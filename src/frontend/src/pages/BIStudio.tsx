import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  Activity,
  BarChart2,
  Brain,
  Database,
  Download,
  FileText,
  Layers,
  LineChart,
  PieChart,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useARIA } from "../context/ARIAContext";
import { addRecord, deleteRecord, getAllRecords } from "../lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DataSource {
  id: string;
  name: string;
  records: number;
  lastSync: string;
  connected: boolean;
  icon: string;
  anomalias?: number;
}

export interface BIMetrica {
  id: string;
  nome: string;
  fonte: string;
  operacao: string;
  periodo: string;
  cliente: string;
  valor: number;
  createdAt: string;
}

export interface BIWidget {
  id: string;
  titulo: string;
  metrica: string;
  tipo: "barras" | "linhas" | "pizza" | "area";
  createdAt: string;
}

// ─── Sample data ──────────────────────────────────────────────────────────────

const INITIAL_SOURCES: DataSource[] = [
  {
    id: "clientes",
    name: "Clientes",
    records: 47,
    lastSync: "h\u00e1 2 min",
    connected: true,
    icon: "users",
    anomalias: 0,
  },
  {
    id: "contratos",
    name: "Contratos",
    records: 38,
    lastSync: "h\u00e1 5 min",
    connected: true,
    icon: "file",
    anomalias: 2,
  },
  {
    id: "lancamentos",
    name: "Lan\u00e7amentos",
    records: 1_284,
    lastSync: "h\u00e1 1 min",
    connected: true,
    icon: "activity",
    anomalias: 3,
  },
  {
    id: "notas",
    name: "Notas Fiscais",
    records: 312,
    lastSync: "h\u00e1 8 min",
    connected: true,
    icon: "layers",
    anomalias: 0,
  },
  {
    id: "folha",
    name: "Folha de Pagamento",
    records: 95,
    lastSync: "h\u00e1 15 min",
    connected: false,
    icon: "users",
    anomalias: 0,
  },
  {
    id: "fiscal",
    name: "M\u00f3dulo Fiscal",
    records: 56,
    lastSync: "h\u00e1 30 min",
    connected: true,
    icon: "db",
    anomalias: 1,
  },
];

const FONTES = [
  "Clientes",
  "Contratos",
  "Lan\u00e7amentos",
  "Notas Fiscais",
  "Folha de Pagamento",
  "M\u00f3dulo Fiscal",
];
const OPERACOES = [
  "Soma",
  "M\u00e9dia",
  "Contagem",
  "M\u00e1ximo",
  "M\u00ednimo",
];
const PERIODOS = ["M\u00eas atual", "Trimestre", "Ano", "Personalizado"];

const INITIAL_WIDGETS: BIWidget[] = [
  {
    id: "w1",
    titulo: "Receita por Cliente",
    metrica: "Receita Total",
    tipo: "barras",
    createdAt: new Date().toISOString(),
  },
  {
    id: "w2",
    titulo: "Evolu\u00e7\u00e3o Mensal de Impostos",
    metrica: "Impostos Devidos",
    tipo: "linhas",
    createdAt: new Date().toISOString(),
  },
  {
    id: "w3",
    titulo: "Distribui\u00e7\u00e3o por Regime Tribut\u00e1rio",
    metrica: "Regime",
    tipo: "pizza",
    createdAt: new Date().toISOString(),
  },
];

const SUGGESTED_METRICS: Omit<BIMetrica, "id" | "createdAt">[] = [
  {
    nome: "Receita M\u00e9dia por Cliente",
    fonte: "Contratos",
    operacao: "M\u00e9dia",
    periodo: "M\u00eas atual",
    cliente: "Todos",
    valor: 4820,
  },
  {
    nome: "Total de Impostos no Trimestre",
    fonte: "M\u00f3dulo Fiscal",
    operacao: "Soma",
    periodo: "Trimestre",
    cliente: "Todos",
    valor: 127_500,
  },
  {
    nome: "Lan\u00e7amentos com Anomalia",
    fonte: "Lan\u00e7amentos",
    operacao: "Contagem",
    periodo: "M\u00eas atual",
    cliente: "Todos",
    valor: 6,
  },
];

const CHART_THEMES: Record<string, string[]> = {
  Azul: ["#3b82f6", "#60a5fa", "#93c5fd", "#1d4ed8", "#2563eb"],
  Verde: ["#22c55e", "#4ade80", "#86efac", "#15803d", "#16a34a"],
  Roxo: ["#a855f7", "#c084fc", "#d8b4fe", "#7e22ce", "#9333ea"],
  Laranja: ["#f97316", "#fb923c", "#fdba74", "#c2410c", "#ea580c"],
};

// ─── Chart Components ─────────────────────────────────────────────────────────

function BarChartSVG({ colors }: { colors: string[] }) {
  const data = [
    { label: "Alfa Ltda", value: 85 },
    { label: "Tech SA", value: 72 },
    { label: "Construtora", value: 60 },
    { label: "Gama ME", value: 45 },
    { label: "Delta EPP", value: 38 },
  ];
  const max = Math.max(...data.map((d) => d.value));
  const w = 280;
  const h = 140;
  const pad = 30;
  const barW = (w - pad * 2) / data.length - 8;
  return (
    <svg
      role="img"
      aria-label="Gr\u00e1fico de barras"
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-full"
    >
      {data.map((d, i) => {
        const barH = (d.value / max) * (h - pad - 20);
        const x = pad + i * ((w - pad * 2) / data.length) + 4;
        const y = h - pad - barH;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill={colors[i % colors.length]}
              opacity={0.85}
            />
            <text
              x={x + barW / 2}
              y={h - pad + 12}
              textAnchor="middle"
              fontSize={8}
              fill="#94a3b8"
            >
              {d.label}
            </text>
            <text
              x={x + barW / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize={8}
              fill="#e2e8f0"
              fontWeight="600"
            >
              {d.value}k
            </text>
          </g>
        );
      })}
      <line
        x1={pad}
        y1={h - pad}
        x2={w - pad}
        y2={h - pad}
        stroke="#334155"
        strokeWidth={1}
      />
    </svg>
  );
}

function LineChartSVG({ colors }: { colors: string[] }) {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const values = [42, 58, 51, 73, 65, 88];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const w = 280;
  const h = 140;
  const pad = 30;
  const pts = values.map((v, i) => ({
    x: pad + i * ((w - pad * 2) / (values.length - 1)),
    y: h - pad - ((v - min) / (max - min)) * (h - pad - 20),
  }));
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const area = `${path} L${pts[pts.length - 1].x},${h - pad} L${pts[0].x},${h - pad} Z`;
  return (
    <svg
      role="img"
      aria-label="Gr\u00e1fico de linhas"
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-full"
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors[0]} stopOpacity={0.3} />
          <stop offset="100%" stopColor={colors[0]} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaGrad)" />
      <path
        d={path}
        fill="none"
        stroke={colors[0]}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <g key={months[i]}>
          <circle cx={p.x} cy={p.y} r={3.5} fill={colors[0]} />
          <text
            x={p.x}
            y={h - pad + 12}
            textAnchor="middle"
            fontSize={8}
            fill="#94a3b8"
          >
            {months[i]}
          </text>
        </g>
      ))}
      <line
        x1={pad}
        y1={h - pad}
        x2={w - pad}
        y2={h - pad}
        stroke="#334155"
        strokeWidth={1}
      />
    </svg>
  );
}

function PieChartSVG({ colors }: { colors: string[] }) {
  const slices = [
    { label: "Simples Nacional", value: 55, color: colors[0] },
    { label: "Lucro Presumido", value: 30, color: colors[1] },
    { label: "Lucro Real", value: 15, color: colors[2] },
  ];
  const cx = 80;
  const cy = 70;
  const r = 55;
  let start = -Math.PI / 2;
  const paths = slices.map((s) => {
    const angle = (s.value / 100) * Math.PI * 2;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(start + angle);
    const y2 = cy + r * Math.sin(start + angle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
    start += angle;
    return { d, color: s.color, label: s.label, value: s.value };
  });
  return (
    <svg
      role="img"
      aria-label="Gr\u00e1fico pizza"
      viewBox="0 0 280 140"
      className="w-full h-full"
    >
      {paths.map((p) => (
        <path
          key={p.label}
          d={p.d}
          fill={p.color}
          opacity={0.85}
          stroke="#1e293b"
          strokeWidth={1.5}
        />
      ))}
      {slices.map((s, i) => (
        <g key={s.label}>
          <rect
            x={160}
            y={20 + i * 28}
            width={10}
            height={10}
            rx={2}
            fill={colors[i]}
          />
          <text x={175} y={30 + i * 28} fontSize={9} fill="#cbd5e1">
            {s.label}
          </text>
          <text x={175} y={40 + i * 28} fontSize={9} fill="#64748b">
            {s.value}%
          </text>
        </g>
      ))}
    </svg>
  );
}

function ChartRenderer({
  tipo,
  colors,
}: { tipo: BIWidget["tipo"]; colors: string[] }) {
  switch (tipo) {
    case "barras":
      return <BarChartSVG colors={colors} />;
    case "linhas":
      return <LineChartSVG colors={colors} />;
    case "pizza":
      return <PieChartSVG colors={colors} />;
    case "area":
      return <LineChartSVG colors={colors} />;
  }
}

const SOURCE_ICON: Record<string, React.ReactNode> = {
  users: <Users className="w-4 h-4" />,
  file: <FileText className="w-4 h-4" />,
  activity: <Activity className="w-4 h-4" />,
  layers: <Layers className="w-4 h-4" />,
  db: <Database className="w-4 h-4" />,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BIStudio() {
  const { addMessage, setIsChatOpen } = useARIA();

  const [sources, setSources] = useState<DataSource[]>(INITIAL_SOURCES);
  const [metricas, setMetricas] = useState<BIMetrica[]>([]);
  const [widgets, setWidgets] = useState<BIWidget[]>([]);

  // Metric form
  const [metricaNome, setMetricaNome] = useState("");
  const [metricaFonte, setMetricaFonte] = useState("");
  const [metricaOp, setMetricaOp] = useState("");
  const [metricaPeriodo, setMetricaPeriodo] = useState("");

  // Widget dialog
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [widgetMetrica, setWidgetMetrica] = useState("");
  const [widgetTipo, setWidgetTipo] = useState<BIWidget["tipo"]>("barras");
  const [widgetTitulo, setWidgetTitulo] = useState("");

  // Settings
  const [modoSimulado, setModoSimulado] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [ariaAuto, setAriaAuto] = useState(false);
  const [chartTheme, setChartTheme] = useState("Azul");
  const [ariaInsights, setAriaInsights] = useState<string[] | null>(null);

  const activeColors = CHART_THEMES[chartTheme] || CHART_THEMES.Azul;

  useEffect(() => {
    Promise.all([
      getAllRecords<BIMetrica>("bi_metricas"),
      getAllRecords<BIWidget>("bi_widgets"),
    ])
      .then(([m, w]) => {
        if (m.length) setMetricas(m);
        setWidgets(w.length ? w : INITIAL_WIDGETS);
      })
      .catch(() => {
        setWidgets(INITIAL_WIDGETS);
      });
  }, []);

  const toggleSource = useCallback((id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, connected: !s.connected } : s)),
    );
  }, []);

  const syncSource = useCallback(
    (s: DataSource) => {
      setSources((prev) =>
        prev.map((src) =>
          src.id === s.id
            ? { ...src, lastSync: "agora", connected: true }
            : src,
        ),
      );
      addMessage({
        type: "success",
        text: `\u2705 Fonte "${s.name}" sincronizada com sucesso \u2014 ${s.records} registros.`,
      });
      setIsChatOpen(true);
    },
    [addMessage, setIsChatOpen],
  );

  const handleSuggestSources = () => {
    const anomalias = sources.filter((s) => (s.anomalias ?? 0) > 0);
    if (anomalias.length === 0) {
      addMessage({
        type: "success",
        text: "\u2705 ARIA analisou todas as fontes de dados \u2014 nenhuma anomalia detectada.",
      });
    } else {
      for (const src of anomalias) {
        addMessage({
          type: "warning",
          text: `\u26a0\ufe0f ARIA detectou ${src.anomalias} poss\u00edveis inconsist\u00eancia(s) na fonte "${src.name}". Recomendo revisar os lan\u00e7amentos recentes.`,
        });
      }
    }
    setIsChatOpen(true);
  };

  const criarMetrica = async () => {
    if (!metricaNome || !metricaFonte || !metricaOp || !metricaPeriodo) return;
    const nova: BIMetrica = {
      id: `bim_${Date.now()}`,
      nome: metricaNome,
      fonte: metricaFonte,
      operacao: metricaOp,
      periodo: metricaPeriodo,
      cliente: "Todos",
      valor: Math.floor(Math.random() * 90_000) + 10_000,
      createdAt: new Date().toISOString(),
    };
    await addRecord("bi_metricas", nova);
    setMetricas((prev) => [...prev, nova]);
    setMetricaNome("");
    setMetricaFonte("");
    setMetricaOp("");
    setMetricaPeriodo("");
  };

  const removerMetrica = async (id: string) => {
    await deleteRecord("bi_metricas", id);
    setMetricas((prev) => prev.filter((m) => m.id !== id));
  };

  const sugerirMetricas = () => {
    addMessage({
      type: "info",
      text: "\ud83e\udde0 ARIA analisando contexto do escrit\u00f3rio para sugerir m\u00e9tricas relevantes...",
    });
    setIsChatOpen(true);
    setTimeout(() => {
      addMessage({
        type: "success",
        text: "\u2705 ARIA sugeriu 3 novas m\u00e9tricas baseadas nos dados do escrit\u00f3rio: Receita M\u00e9dia por Cliente, Total de Impostos no Trimestre e Lan\u00e7amentos com Anomalia. Acesse a aba M\u00e9tricas para importar.",
      });
    }, 1800);
  };

  const adicionarWidget = async () => {
    if (!widgetMetrica || !widgetTitulo) return;
    const novo: BIWidget = {
      id: `biw_${Date.now()}`,
      titulo: widgetTitulo,
      metrica: widgetMetrica,
      tipo: widgetTipo,
      createdAt: new Date().toISOString(),
    };
    await addRecord("bi_widgets", novo);
    setWidgets((prev) => [...prev, novo]);
    setAddWidgetOpen(false);
    setWidgetTitulo("");
    setWidgetMetrica("");
  };

  const removerWidget = async (id: string) => {
    await deleteRecord("bi_widgets", id);
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const analisarComARIA = () => {
    addMessage({
      type: "info",
      text: "\ud83e\udde0 ARIA iniciando an\u00e1lise do dashboard BI...",
    });
    setIsChatOpen(true);
    setTimeout(() => {
      setAriaInsights([
        "\ud83d\udcc8 Receita dos top 5 clientes cresceu 18% no \u00faltimo trimestre \u2014 Empresa Alfa Ltda lidera com R$ 85k.",
        "\u26a0\ufe0f Carga tribut\u00e1ria de Contratos acima da m\u00e9dia em Abr/Mai \u2014 recomendo revisar dedu\u00e7\u00f5es dispon\u00edveis.",
        "\ud83d\udca1 Dois clientes no Simples Nacional t\u00eam faturamento pr\u00f3ximo do limite \u2014 an\u00e1lise de transi\u00e7\u00e3o para Lucro Presumido \u00e9 recomendada.",
      ]);
      addMessage({
        type: "success",
        text: "\u2705 An\u00e1lise BI conclu\u00edda. 3 insights identificados no dashboard.",
      });
    }, 2200);
  };

  const exportarDashboard = (formato: string) => {
    addMessage({
      type: "success",
      text: `\u2705 Dashboard exportado em ${formato} com ${widgets.length} gr\u00e1ficos \u2014 pronto para download.`,
    });
    setIsChatOpen(true);
  };

  const importarSugestoes = async () => {
    const novas: BIMetrica[] = SUGGESTED_METRICS.map((s) => ({
      ...s,
      id: `bim_sug_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    }));
    for (const m of novas) await addRecord("bi_metricas", m);
    setMetricas((prev) => [...prev, ...novas]);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-ocid="bi-studio.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <LineChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">BI Studio</h1>
            <p className="text-xs text-muted-foreground">
              Business Intelligence \u2014 an\u00e1lise inteligente dos dados do
              escrit\u00f3rio
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            {modoSimulado ? "Simulado" : "Real"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={analisarComARIA}
            data-ocid="bi-studio.primary_button"
          >
            <Brain className="w-3.5 h-3.5" />
            Analisar com ARIA
          </Button>
        </div>
      </div>

      <Tabs defaultValue="fontes" className="space-y-4">
        <TabsList
          className="grid grid-cols-4 w-full max-w-xl"
          data-ocid="bi-studio.tab"
        >
          <TabsTrigger value="fontes">Fontes de Dados</TabsTrigger>
          <TabsTrigger value="metricas">M\u00e9tricas</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="config">Configura\u00e7\u00f5es</TabsTrigger>
        </TabsList>

        {/* Tab 1: Data Sources */}
        <TabsContent value="fontes" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Gerencie as fontes de dados internas conectadas ao BI Studio
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSuggestSources}
              className="gap-1"
              data-ocid="bi-studio.secondary_button"
            >
              <Sparkles className="w-3.5 h-3.5" />
              ARIA Analisar Fontes
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((src, sIdx) => (
              <Card
                key={src.id}
                className="relative overflow-hidden"
                data-ocid={`bi-studio.item.${sIdx + 1}`}
              >
                {(src.anomalias ?? 0) > 0 && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-500" />
                )}
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${src.connected ? "bg-blue-500/15 text-blue-400" : "bg-muted text-muted-foreground"}`}
                      >
                        {SOURCE_ICON[src.icon]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {src.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {src.records.toLocaleString("pt-BR")} registros
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={src.connected}
                      onCheckedChange={() => toggleSource(src.id)}
                      data-ocid="bi-studio.switch"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {src.connected ? (
                        <Wifi className="w-3 h-3 text-green-400" />
                      ) : (
                        <WifiOff className="w-3 h-3 text-red-400" />
                      )}
                      <span>Sync: {src.lastSync}</span>
                    </div>
                    {(src.anomalias ?? 0) > 0 && (
                      <Badge
                        variant="outline"
                        className="text-yellow-400 border-yellow-400/30 text-[10px]"
                      >
                        \u26a0\ufe0f {src.anomalias} anomalia(s)
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 gap-1 text-xs"
                    onClick={() => syncSource(src)}
                    data-ocid="bi-studio.secondary_button"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sincronizar Agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: Metrics Builder */}
        <TabsContent value="metricas" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Criar Nova M\u00e9trica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome da M\u00e9trica</Label>
                  <Input
                    placeholder="Ex: Receita Total Mensal"
                    value={metricaNome}
                    onChange={(e) => setMetricaNome(e.target.value)}
                    className="text-sm"
                    data-ocid="bi-studio.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Fonte de Dados</Label>
                  <Select value={metricaFonte} onValueChange={setMetricaFonte}>
                    <SelectTrigger
                      className="text-sm"
                      data-ocid="bi-studio.select"
                    >
                      <SelectValue placeholder="Selecionar fonte..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FONTES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Opera\u00e7\u00e3o</Label>
                  <Select value={metricaOp} onValueChange={setMetricaOp}>
                    <SelectTrigger
                      className="text-sm"
                      data-ocid="bi-studio.select"
                    >
                      <SelectValue placeholder="Selecionar opera\u00e7\u00e3o..." />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERACOES.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Per\u00edodo</Label>
                  <Select
                    value={metricaPeriodo}
                    onValueChange={setMetricaPeriodo}
                  >
                    <SelectTrigger
                      className="text-sm"
                      data-ocid="bi-studio.select"
                    >
                      <SelectValue placeholder="Selecionar per\u00edodo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODOS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full gap-1 mt-1"
                  size="sm"
                  onClick={criarMetrica}
                  disabled={
                    !metricaNome ||
                    !metricaFonte ||
                    !metricaOp ||
                    !metricaPeriodo
                  }
                  data-ocid="bi-studio.submit_button"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Criar M\u00e9trica
                </Button>
                <div className="border-t border-border pt-3 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1 text-xs"
                    onClick={sugerirMetricas}
                    data-ocid="bi-studio.secondary_button"
                  >
                    <Sparkles className="w-3 h-3" />
                    Sugerir M\u00e9tricas (ARIA)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-1 text-xs text-muted-foreground"
                    onClick={importarSugestoes}
                    data-ocid="bi-studio.secondary_button"
                  >
                    <Download className="w-3 h-3" />
                    Importar sugest\u00f5es da ARIA
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-3">
              <p className="text-sm font-medium text-foreground">
                M\u00e9tricas Criadas ({metricas.length})
              </p>
              {metricas.length === 0 && (
                <Card
                  className="border-dashed"
                  data-ocid="bi-studio.empty_state"
                >
                  <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
                    <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
                    <p>Nenhuma m\u00e9trica criada ainda.</p>
                    <p className="text-xs mt-1">
                      Use o formul\u00e1rio ou importe as sugest\u00f5es da
                      ARIA.
                    </p>
                  </CardContent>
                </Card>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {metricas.map((m, idx) => (
                  <Card key={m.id} data-ocid={`bi-studio.item.${idx + 1}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {m.nome}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            <Badge variant="secondary" className="text-[10px]">
                              {m.fonte}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {m.operacao}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {m.periodo}
                            </Badge>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removerMetrica(m.id)}
                          className="ml-2 text-muted-foreground hover:text-red-400 transition-colors"
                          data-ocid="bi-studio.delete_button"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="mt-3 pt-2 border-t border-border">
                        <p className="text-lg font-bold text-blue-400">
                          {m.operacao === "Contagem"
                            ? m.valor
                            : m.valor.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {m.cliente === "Todos"
                            ? "Todos os clientes"
                            : m.cliente}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {widgets.length} widget(s) no dashboard
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={analisarComARIA}
                data-ocid="bi-studio.secondary_button"
              >
                <Brain className="w-3.5 h-3.5" />
                Analisar com ARIA
              </Button>
              <Button
                size="sm"
                className="gap-1"
                onClick={() => setAddWidgetOpen(true)}
                data-ocid="bi-studio.open_modal_button"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Widget
              </Button>
            </div>
          </div>

          {ariaInsights && (
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-blue-400" />
                  <p className="text-sm font-semibold text-blue-400">
                    Insights da ARIA
                  </p>
                  <button
                    type="button"
                    className="ml-auto text-muted-foreground hover:text-foreground"
                    onClick={() => setAriaInsights(null)}
                  >
                    ×
                  </button>
                </div>
                <ul className="space-y-2">
                  {ariaInsights.map((insight) => (
                    <li key={insight} className="text-sm text-foreground/80">
                      {insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {widgets.map((w, idx) => (
              <Card
                key={w.id}
                className="overflow-hidden"
                data-ocid={`bi-studio.item.${idx + 1}`}
              >
                <CardHeader className="pb-0 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {w.tipo === "barras" && (
                        <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      {w.tipo === "linhas" && (
                        <LineChart className="w-3.5 h-3.5 text-green-400" />
                      )}
                      {w.tipo === "pizza" && (
                        <PieChart className="w-3.5 h-3.5 text-purple-400" />
                      )}
                      {w.tipo === "area" && (
                        <Activity className="w-3.5 h-3.5 text-orange-400" />
                      )}
                      <p className="text-xs font-semibold text-foreground">
                        {w.titulo}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerWidget(w.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors"
                      data-ocid="bi-studio.delete_button"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {w.metrica}
                  </p>
                </CardHeader>
                <CardContent className="px-2 pb-2">
                  <div className="h-36 w-full">
                    <ChartRenderer tipo={w.tipo} colors={activeColors} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
            <DialogContent className="max-w-sm" data-ocid="bi-studio.dialog">
              <DialogHeader>
                <DialogTitle>Adicionar Widget</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">T\u00edtulo do Widget</Label>
                  <Input
                    placeholder="Ex: Receita Mensal"
                    value={widgetTitulo}
                    onChange={(e) => setWidgetTitulo(e.target.value)}
                    data-ocid="bi-studio.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">M\u00e9trica a Exibir</Label>
                  <Input
                    placeholder="Ex: Receita Total"
                    value={widgetMetrica}
                    onChange={(e) => setWidgetMetrica(e.target.value)}
                    data-ocid="bi-studio.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de Gr\u00e1fico</Label>
                  <Select
                    value={widgetTipo}
                    onValueChange={(v) => setWidgetTipo(v as BIWidget["tipo"])}
                  >
                    <SelectTrigger data-ocid="bi-studio.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="barras">Barras</SelectItem>
                      <SelectItem value="linhas">Linhas</SelectItem>
                      <SelectItem value="pizza">Pizza</SelectItem>
                      <SelectItem value="area">\u00c1rea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddWidgetOpen(false)}
                  data-ocid="bi-studio.cancel_button"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={adicionarWidget}
                  disabled={!widgetTitulo || !widgetMetrica}
                  data-ocid="bi-studio.confirm_button"
                >
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab 4: Settings */}
        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Modo de Opera\u00e7\u00e3o
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Modo Simulado</p>
                    <p className="text-xs text-muted-foreground">
                      Usa dados de exemplo para demonstra\u00e7\u00e3o
                    </p>
                  </div>
                  <Switch
                    checked={modoSimulado}
                    onCheckedChange={setModoSimulado}
                    data-ocid="bi-studio.switch"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Atualiza\u00e7\u00e3o Autom\u00e1tica
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sincroniza fontes a cada 30 minutos
                    </p>
                  </div>
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                    data-ocid="bi-studio.switch"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">ARIA Analisa ao Abrir</p>
                    <p className="text-xs text-muted-foreground">
                      ARIA gera insights automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={ariaAuto}
                    onCheckedChange={setAriaAuto}
                    data-ocid="bi-studio.switch"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Tema dos Gr\u00e1ficos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(CHART_THEMES).map(([name, colors]) => (
                    <button
                      type="button"
                      key={name}
                      onClick={() => setChartTheme(name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        chartTheme === name
                          ? "border-blue-500 bg-blue-500/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-blue-500/50"
                      }`}
                      data-ocid="bi-studio.toggle"
                    >
                      <div className="flex gap-0.5">
                        {colors.slice(0, 3).map((c) => (
                          <div
                            key={c}
                            className="w-3 h-3 rounded-full"
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                      {name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Exportar Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Exporta todos os gr\u00e1ficos e m\u00e9tricas do dashboard
                  atual.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => exportarDashboard("PDF")}
                    data-ocid="bi-studio.secondary_button"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => exportarDashboard("Excel")}
                    data-ocid="bi-studio.secondary_button"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar Excel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {!modoSimulado && (
              <Card className="md:col-span-2 border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <Zap className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-yellow-400">
                        Modo Real \u2014 Requisitos
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>
                          Chave de API configurada em Configura\u00e7\u00f5es
                          \u2192 ARIA para an\u00e1lise inteligente
                        </li>
                        <li>
                          Conex\u00e3o com banco de dados PostgreSQL ativa (Sync
                          Nuvem)
                        </li>
                        <li>
                          Permiss\u00e3o de acesso a fontes externas (eSocial,
                          SPED, SEFAZ) habilitada
                        </li>
                        <li>
                          Modo Real processa dados reais dos clientes \u2014
                          recomenda-se revis\u00e3o manual dos relat\u00f3rios
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
