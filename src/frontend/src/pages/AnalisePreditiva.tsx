import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScoreLetra = "A" | "B" | "C" | "D";
type Horizonte = "3" | "6" | "12";
type Severidade = "Crítica" | "Moderada" | "Leve";

interface InsightItem {
  id: string;
  cliente: string;
  mensagem: string;
  impacto: "Alto" | "Médio" | "Baixo";
  tipo: string;
  data: string;
}

interface ClienteScore {
  id: string;
  nome: string;
  cnpj: string;
  score: ScoreLetra;
  liquidez: number;
  endividamento: number;
  margem: number;
  regime: string;
}

interface Inconsistencia {
  id: string;
  cliente: string;
  descricao: string;
  severidade: Severidade;
  data: string;
  modulo: string;
}

// ─── Dados simulados ──────────────────────────────────────────────────────────

const INSIGHTS_INICIAIS: InsightItem[] = [
  {
    id: "1",
    cliente: "Mercearia São João Ltda",
    mensagem:
      "Custos operacionais aumentaram 42% no trimestre — recomenda-se revisão de regime tributário para Lucro Presumido, com economia estimada de R$ 18.400/ano.",
    impacto: "Alto",
    tipo: "Tributário",
    data: "31/03/2026",
  },
  {
    id: "2",
    cliente: "Construtora Horizonte S/A",
    mensagem:
      "Índice de endividamento atingiu 78% — nível crítico. Recomenda-se renegociação de passivos e análise de viabilidade para novos contratos.",
    impacto: "Alto",
    tipo: "Financeiro",
    data: "30/03/2026",
  },
  {
    id: "3",
    cliente: "Tech Solutions Informática ME",
    mensagem:
      "Margem líquida de 31% acima da média do setor — empresa está em condição ideal para expansão. Oportunidade de planejamento sucessório.",
    impacto: "Médio",
    tipo: "Estratégico",
    data: "29/03/2026",
  },
  {
    id: "4",
    cliente: "Farmácia Vida Saudável Ltda",
    mensagem:
      "FGTS com atraso de 2 competências identificado — risco de autuação com multa estimada de R$ 4.200. Regularização urgente recomendada.",
    impacto: "Alto",
    tipo: "Compliance",
    data: "28/03/2026",
  },
  {
    id: "5",
    cliente: "Restaurante Bom Sabor ME",
    mensagem:
      "Sazonalidade típica do setor detectada — faturamento cai 22% em julho/agosto. Sugerido provisionamento de R$ 8.000 para cobertura de obrigações fixas.",
    impacto: "Médio",
    tipo: "Projeção",
    data: "27/03/2026",
  },
  {
    id: "6",
    cliente: "Padaria Pão de Mel Ltda",
    mensagem:
      "Lucro operacional estável por 3 trimestres consecutivos. Empresa elegível para solicitação de linha de crédito com taxa preferencial.",
    impacto: "Baixo",
    tipo: "Financeiro",
    data: "26/03/2026",
  },
];

const SCORES_CLIENTES: ClienteScore[] = [
  {
    id: "1",
    nome: "Tech Solutions Informática ME",
    cnpj: "12.345.678/0001-90",
    score: "A",
    liquidez: 2.8,
    endividamento: 22,
    margem: 31,
    regime: "Lucro Presumido",
  },
  {
    id: "2",
    nome: "Padaria Pão de Mel Ltda",
    cnpj: "23.456.789/0001-01",
    score: "A",
    liquidez: 2.1,
    endividamento: 30,
    margem: 18,
    regime: "Simples Nacional",
  },
  {
    id: "3",
    nome: "Farmácia Vida Saudável Ltda",
    cnpj: "34.567.890/0001-12",
    score: "B",
    liquidez: 1.5,
    endividamento: 45,
    margem: 14,
    regime: "Simples Nacional",
  },
  {
    id: "4",
    nome: "Restaurante Bom Sabor ME",
    cnpj: "45.678.901/0001-23",
    score: "B",
    liquidez: 1.2,
    endividamento: 50,
    margem: 11,
    regime: "Simples Nacional",
  },
  {
    id: "5",
    nome: "Mercearia São João Ltda",
    cnpj: "56.789.012/0001-34",
    score: "C",
    liquidez: 0.9,
    endividamento: 62,
    margem: 7,
    regime: "Simples Nacional",
  },
  {
    id: "6",
    nome: "Auto Peças Central Ltda",
    cnpj: "67.890.123/0001-45",
    score: "C",
    liquidez: 0.8,
    endividamento: 65,
    margem: 5,
    regime: "Lucro Presumido",
  },
  {
    id: "7",
    nome: "Construtora Horizonte S/A",
    cnpj: "78.901.234/0001-56",
    score: "D",
    liquidez: 0.5,
    endividamento: 78,
    margem: -3,
    regime: "Lucro Real",
  },
  {
    id: "8",
    nome: "Transporte Rápido ME",
    cnpj: "89.012.345/0001-67",
    score: "D",
    liquidez: 0.4,
    endividamento: 82,
    margem: -8,
    regime: "Simples Nacional",
  },
];

const INCONSISTENCIAS: Inconsistencia[] = [
  {
    id: "1",
    cliente: "Mercearia São João Ltda",
    descricao:
      "Variação atípica de 310% nas despesas de Dezembro/2025 — possível lançamento duplicado de R$ 12.450.",
    severidade: "Crítica",
    data: "31/03/2026",
    modulo: "Lançamentos",
  },
  {
    id: "2",
    cliente: "Construtora Horizonte S/A",
    descricao:
      "NF-e emitida fora do prazo de 72h para serviços de março — risco de rejeição pela SEFAZ.",
    severidade: "Crítica",
    data: "30/03/2026",
    modulo: "Fiscal",
  },
  {
    id: "3",
    cliente: "Auto Peças Central Ltda",
    descricao:
      "Divergência de R$ 3.200 entre balancete e Razão Contábil na conta 1.1.2.01 (Bancos).",
    severidade: "Moderada",
    data: "29/03/2026",
    modulo: "Contábil",
  },
  {
    id: "4",
    cliente: "Restaurante Bom Sabor ME",
    descricao:
      "CNPJ do fornecedor 12.345.000/0001-00 inativo na base da Receita Federal — nota fiscal inválida.",
    severidade: "Moderada",
    data: "28/03/2026",
    modulo: "Documentos",
  },
  {
    id: "5",
    cliente: "Transporte Rápido ME",
    descricao:
      "Folha de pagamento de fevereiro não enviada ao eSocial — competência em aberto há 28 dias.",
    severidade: "Moderada",
    data: "27/03/2026",
    modulo: "Folha",
  },
  {
    id: "6",
    cliente: "Padaria Pão de Mel Ltda",
    descricao:
      "Data de emissão da NF 1.847 anterior à data de competência do serviço prestado em 15 dias.",
    severidade: "Leve",
    data: "26/03/2026",
    modulo: "Fiscal",
  },
];

// ─── Gerador de dados de projeção ─────────────────────────────────────────────

function gerarProjecao(horizonte: Horizonte) {
  const meses = Number.parseInt(horizonte);
  const hoje = new Date();
  const resultado: {
    mes: string;
    receita: number;
    despesa: number;
    imposto: number;
  }[] = [];
  for (let i = 1; i <= meses; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    const label = d.toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    });
    const receita = 480000 + Math.sin(i * 0.8) * 40000 + i * 8000;
    const despesa = 310000 + Math.cos(i * 0.6) * 20000 + i * 5000;
    const imposto = receita * 0.12;
    resultado.push({
      mes: label,
      receita: Math.round(receita),
      despesa: Math.round(despesa),
      imposto: Math.round(imposto),
    });
  }
  return resultado;
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function scoreColor(s: ScoreLetra) {
  if (s === "A")
    return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
  if (s === "B") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  if (s === "C") return "bg-orange-500/20 text-orange-400 border-orange-500/40";
  return "bg-red-500/20 text-red-400 border-red-500/40";
}

function impactoColor(i: string) {
  if (i === "Alto") return "bg-red-500/20 text-red-400 border-red-500/40";
  if (i === "Médio")
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  return "bg-blue-500/20 text-blue-400 border-blue-500/40";
}

function severidadeColor(s: Severidade) {
  if (s === "Crítica") return "bg-red-500/20 text-red-400 border-red-500/40";
  if (s === "Moderada")
    return "bg-orange-500/20 text-orange-400 border-orange-500/40";
  return "bg-blue-500/20 text-blue-400 border-blue-500/40";
}

// ─── SVG Gráfico simples ──────────────────────────────────────────────────────

function GraficoProjecao({
  dados,
}: { dados: ReturnType<typeof gerarProjecao> }) {
  const W = 700;
  const H = 200;
  const PAD = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const allValues = dados.flatMap((d) => [d.receita, d.despesa, d.imposto]);
  const maxVal = Math.max(...allValues) * 1.1;
  const minVal = 0;

  const xScale = (i: number) => PAD.left + (i / (dados.length - 1)) * innerW;
  const yScale = (v: number) =>
    PAD.top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

  function linha(serie: "receita" | "despesa" | "imposto") {
    return dados
      .map(
        (d, i) =>
          `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(d[serie]).toFixed(1)}`,
      )
      .join(" ");
  }

  const fmt = (v: number) =>
    v >= 1000000
      ? `R$ ${(v / 1000000).toFixed(1)}M`
      : `R$ ${(v / 1000).toFixed(0)}k`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 320 }}
        role="img"
        aria-label="Gráfico de projeção financeira"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = PAD.top + innerH * (1 - t);
          const v = minVal + (maxVal - minVal) * t;
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="rgba(255,255,255,0.4)"
              >
                {fmt(v)}
              </text>
            </g>
          );
        })}
        {/* X axis labels */}
        {dados.map((d, i) => (
          <text
            key={d.mes}
            x={xScale(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(255,255,255,0.4)"
          >
            {d.mes}
          </text>
        ))}
        {/* Lines */}
        <path
          d={linha("receita")}
          fill="none"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d={linha("despesa")}
          fill="none"
          stroke="#f87171"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d={linha("imposto")}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeDasharray="4 3"
        />
        {/* Dots — receita */}
        {dados.map((d, i) => (
          <circle
            // biome-ignore lint/suspicious/noArrayIndexKey: SVG positional rendering
            key={i}
            cx={xScale(i)}
            cy={yScale(d.receita)}
            r="3"
            fill="#34d399"
          />
        ))}
      </svg>
      {/* Legend */}
      <div className="flex gap-6 justify-center mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
          Receita Projetada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-red-400 inline-block" />
          Despesas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-yellow-400 inline-block" />
          Impostos
        </span>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AnalisePreditiva() {
  const { addMessage } = useARIA();
  const [loading, setLoading] = useState(false);
  const [horizonte, setHorizonte] = useState<Horizonte>("6");
  const [insights, setInsights] = useState<InsightItem[]>(INSIGHTS_INICIAIS);
  const projecao = gerarProjecao(horizonte);

  const altosRisco = SCORES_CLIENTES.filter(
    (c) => c.score === "D" || c.score === "C",
  ).length;
  const insightsAlto = insights.filter((i) => i.impacto === "Alto").length;
  const inconsistenciasCriticas = INCONSISTENCIAS.filter(
    (i) => i.severidade === "Crítica",
  ).length;

  const handleAnalisarARIA = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const novosInsights: InsightItem[] = [
        {
          id: String(Date.now()),
          cliente: "Auto Peças Central Ltda",
          mensagem:
            "ARIA detectou padrão sazonal de queda em abril — faturamento historicamente 18% abaixo da média. Sugerido antecipamento de recebíveis de R$ 15.000.",
          impacto: "Médio",
          tipo: "Projeção",
          data: new Date().toLocaleDateString("pt-BR"),
        },
        {
          id: String(Date.now() + 1),
          cliente: "Farmácia Vida Saudável Ltda",
          mensagem:
            "Análise de 18 meses indica crescimento consistente de 9% a.m. — empresa está em patamar elegível para troca de Simples Nacional para Lucro Presumido com ganho tributário de R$ 22.000/ano.",
          impacto: "Alto",
          tipo: "Tributário",
          data: new Date().toLocaleDateString("pt-BR"),
        },
      ];
      setInsights((prev) => [...novosInsights, ...prev]);
      addMessage({
        type: "success",
        text: `✅ Análise preditiva concluída! Identifiquei 2 novos insights de alto impacto. Total de ${insights.length + 2} insights ativos, ${inconsistenciasCriticas} inconsistências críticas pendentes de ação.`,
      });
      toast.success("Análise preditiva atualizada com 2 novos insights!");
    }, 3000);
  };

  const handleGerarRelatorio = (formato: "PDF" | "Word") => {
    const conteudo = [
      "RELATÓRIO DE ANÁLISE PREDITIVA — ContaFácil ERP",
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
      "",
      "=== RESUMO EXECUTIVO ===",
      `Total de insights ativos: ${insights.length}`,
      `Insights de alto impacto: ${insightsAlto}`,
      `Clientes em risco (C/D): ${altosRisco}`,
      `Inconsistências críticas: ${inconsistenciasCriticas}`,
      "",
      "=== INSIGHTS PRIORITÁRIOS ===",
      ...insights
        .slice(0, 5)
        .map(
          (i, idx) =>
            `${idx + 1}. [${i.impacto}] ${i.cliente}\n   ${i.mensagem}\n   Tipo: ${i.tipo} | Data: ${i.data}`,
        ),
      "",
      "=== SCORES DE SAÚDE FINANCEIRA ===",
      ...SCORES_CLIENTES.map(
        (c) =>
          `• ${c.nome} (${c.cnpj}) — Score: ${c.score} | Liquidez: ${c.liquidez}x | Endividamento: ${c.endividamento}% | Margem: ${c.margem}%`,
      ),
      "",
      "=== INCONSISTÊNCIAS DETECTADAS ===",
      ...INCONSISTENCIAS.map(
        (i) => `• [${i.severidade}] ${i.cliente}: ${i.descricao} (${i.data})`,
      ),
      "",
      "--- Fim do Relatório ContaFácil ERP ---",
    ].join("\n");

    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analise-preditiva-${new Date().toISOString().slice(0, 10)}.${formato === "PDF" ? "pdf" : "docx"}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Relatório ${formato} exportado com sucesso!`);
  };

  return (
    <div className="flex flex-col gap-6 p-6" data-ocid="analise-preditiva.page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Análise Preditiva e Insights Contábeis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ARIA analisa tendências, identifica inconsistências e entrega
            recomendações consultivas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGerarRelatorio("Word")}
            data-ocid="analise-preditiva.secondary_button"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Word
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGerarRelatorio("PDF")}
            data-ocid="analise-preditiva.primary_button"
          >
            <Download className="w-4 h-4 mr-1.5" />
            PDF
          </Button>
          <Button
            size="sm"
            onClick={handleAnalisarARIA}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            data-ocid="analise-preditiva.submit_button"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1.5" />
            )}
            {loading ? "Analisando..." : "Analisar com ARIA"}
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-ocid="analise-preditiva.card">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Insights Ativos</p>
            <p className="text-3xl font-bold text-foreground mt-1">
              {insights.length}
            </p>
            <p className="text-xs text-emerald-400 mt-1">
              {insightsAlto} de alto impacto
            </p>
          </CardContent>
        </Card>
        <Card data-ocid="analise-preditiva.card">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Clientes Analisados</p>
            <p className="text-3xl font-bold text-foreground mt-1">
              {SCORES_CLIENTES.length}
            </p>
            <p className="text-xs text-red-400 mt-1">
              {altosRisco} em risco (C/D)
            </p>
          </CardContent>
        </Card>
        <Card data-ocid="analise-preditiva.card">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Inconsistências</p>
            <p className="text-3xl font-bold text-foreground mt-1">
              {INCONSISTENCIAS.length}
            </p>
            <p className="text-xs text-red-400 mt-1">
              {inconsistenciasCriticas} críticas
            </p>
          </CardContent>
        </Card>
        <Card data-ocid="analise-preditiva.card">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Score Médio</p>
            <p className="text-3xl font-bold text-foreground mt-1">B+</p>
            <p className="text-xs text-yellow-400 mt-1">
              Acima da média setorial
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="insights" data-ocid="analise-preditiva.tab">
        <TabsList>
          <TabsTrigger
            value="insights"
            data-ocid="analise-preditiva.insights.tab"
          >
            <Brain className="w-4 h-4 mr-1.5" />
            Insights ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="scores" data-ocid="analise-preditiva.scores.tab">
            <TrendingUp className="w-4 h-4 mr-1.5" />
            Score de Saúde
          </TabsTrigger>
          <TabsTrigger
            value="projecoes"
            data-ocid="analise-preditiva.projecoes.tab"
          >
            <TrendingDown className="w-4 h-4 mr-1.5" />
            Projeções
          </TabsTrigger>
          <TabsTrigger
            value="inconsistencias"
            data-ocid="analise-preditiva.inconsistencias.tab"
          >
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            Inconsistências ({INCONSISTENCIAS.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Insights ── */}
        <TabsContent value="insights" className="mt-4 space-y-3">
          {loading && (
            <div
              className="flex items-center gap-3 p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              data-ocid="analise-preditiva.loading_state"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">
                ARIA está processando os dados contábeis de todos os clientes...
              </span>
            </div>
          )}
          {insights.map((item, idx) => (
            <Card key={item.id} data-ocid={`analise-preditiva.item.${idx + 1}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={`text-xs border ${impactoColor(item.impacto)}`}
                      >
                        {item.impacto}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.tipo}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {item.cliente}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {item.mensagem}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {item.data}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Scores ── */}
        <TabsContent value="scores" className="mt-4">
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Melhores */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />5 Melhores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {SCORES_CLIENTES.filter(
                    (c) => c.score === "A" || c.score === "B",
                  )
                    .slice(0, 5)
                    .map((c, i) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3"
                        data-ocid={`analise-preditiva.scores.item.${i + 1}`}
                      >
                        <span
                          className={`text-lg font-bold w-8 h-8 rounded-full border flex items-center justify-center text-sm ${scoreColor(c.score)}`}
                        >
                          {c.score}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {c.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Liquidez {c.liquidez}x · Margem {c.margem}%
                          </p>
                        </div>
                        <Progress value={c.margem * 2} className="w-16 h-1.5" />
                      </div>
                    ))}
                </CardContent>
              </Card>
              {/* Piores */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    Atenção Requerida
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {SCORES_CLIENTES.filter(
                    (c) => c.score === "C" || c.score === "D",
                  )
                    .slice(0, 5)
                    .map((c, i) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3"
                        data-ocid={`analise-preditiva.risk.item.${i + 1}`}
                      >
                        <span
                          className={`text-lg font-bold w-8 h-8 rounded-full border flex items-center justify-center text-sm ${scoreColor(c.score)}`}
                        >
                          {c.score}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {c.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Endividamento {c.endividamento}% · Margem {c.margem}
                            %
                          </p>
                        </div>
                        <Progress
                          value={c.endividamento}
                          className="w-16 h-1.5"
                        />
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>

            {/* Tabela completa */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Todos os Clientes — Score de Saúde Financeira
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table data-ocid="analise-preditiva.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Regime</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-right">Liquidez</TableHead>
                      <TableHead className="text-right">
                        Endividamento
                      </TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SCORES_CLIENTES.map((c, i) => (
                      <TableRow
                        key={c.id}
                        data-ocid={`analise-preditiva.row.${i + 1}`}
                      >
                        <TableCell className="font-medium">{c.nome}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {c.cnpj}
                        </TableCell>
                        <TableCell className="text-xs">{c.regime}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`border ${scoreColor(c.score)}`}>
                            {c.score}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {c.liquidez}x
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {c.endividamento}%
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm font-medium ${c.margem < 0 ? "text-red-400" : "text-emerald-400"}`}
                        >
                          {c.margem > 0 ? "+" : ""}
                          {c.margem}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Projeções ── */}
        <TabsContent value="projecoes" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Projeção Financeira Consolidada (todos os clientes)
                </CardTitle>
                <Select
                  value={horizonte}
                  onValueChange={(v) => setHorizonte(v as Horizonte)}
                >
                  <SelectTrigger
                    className="w-36 h-8 text-xs"
                    data-ocid="analise-preditiva.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Próximos 3 meses</SelectItem>
                    <SelectItem value="6">Próximos 6 meses</SelectItem>
                    <SelectItem value="12">Próximos 12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <GraficoProjecao dados={projecao} />
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="rounded-lg border border-border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Receita Projetada
                  </p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">
                    R${" "}
                    {(
                      projecao.reduce((s, d) => s + d.receita, 0) / 1000
                    ).toFixed(0)}
                    k
                  </p>
                  <p className="text-xs text-muted-foreground">
                    total {horizonte} meses
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Despesas Projetadas
                  </p>
                  <p className="text-xl font-bold text-red-400 mt-1">
                    R${" "}
                    {(
                      projecao.reduce((s, d) => s + d.despesa, 0) / 1000
                    ).toFixed(0)}
                    k
                  </p>
                  <p className="text-xs text-muted-foreground">
                    total {horizonte} meses
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Impostos Projetados
                  </p>
                  <p className="text-xl font-bold text-yellow-400 mt-1">
                    R${" "}
                    {(
                      projecao.reduce((s, d) => s + d.imposto, 0) / 1000
                    ).toFixed(0)}
                    k
                  </p>
                  <p className="text-xs text-muted-foreground">
                    total {horizonte} meses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Inconsistências ── */}
        <TabsContent value="inconsistencias" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <Table data-ocid="analise-preditiva.inconsistencias.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INCONSISTENCIAS.map((item, i) => (
                    <TableRow
                      key={item.id}
                      data-ocid={`analise-preditiva.inconsistencias.item.${i + 1}`}
                    >
                      <TableCell className="font-medium text-sm">
                        {item.cliente}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.modulo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`border text-xs ${severidadeColor(item.severidade)}`}
                        >
                          {item.severidade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs">
                        {item.descricao}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.data}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
