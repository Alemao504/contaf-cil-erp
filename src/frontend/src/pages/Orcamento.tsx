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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  BarChart2,
  Bot,
  Download,
  Edit2,
  FileSpreadsheet,
  FileText,
  Layers,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip as RechTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import { deleteRecord, getAllRecords, putRecord } from "../lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CentroCusto {
  id: string;
  nome: string;
  tipo: "Receita" | "Despesa" | "Misto";
  responsavel: string;
  orcamentoTotal: number;
  status: "Ativo" | "Inativo";
}

export interface LancamentoOrcamento {
  id: string;
  centroId: string;
  ano: number;
  mes: number; // 1-12
  orcado: number;
  realizado: number;
}

// ---------------------------------------------------------------------------
// Static data helpers
// ---------------------------------------------------------------------------
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const DEFAULT_CENTROS: CentroCusto[] = [
  {
    id: "c1",
    nome: "Vendas",
    tipo: "Receita",
    responsavel: "Carlos Mendes",
    orcamentoTotal: 480000,
    status: "Ativo",
  },
  {
    id: "c2",
    nome: "Compras",
    tipo: "Despesa",
    responsavel: "Ana Paula Costa",
    orcamentoTotal: 310000,
    status: "Ativo",
  },
  {
    id: "c3",
    nome: "Administrativo",
    tipo: "Despesa",
    responsavel: "Ricardo Lima",
    orcamentoTotal: 195000,
    status: "Ativo",
  },
  {
    id: "c4",
    nome: "RH",
    tipo: "Despesa",
    responsavel: "Fernanda Silva",
    orcamentoTotal: 280000,
    status: "Ativo",
  },
  {
    id: "c5",
    nome: "TI",
    tipo: "Despesa",
    responsavel: "Bruno Alves",
    orcamentoTotal: 145000,
    status: "Ativo",
  },
  {
    id: "c6",
    nome: "Marketing",
    tipo: "Despesa",
    responsavel: "Juliana Torres",
    orcamentoTotal: 120000,
    status: "Ativo",
  },
];

const DEFAULT_LANCAMENTOS: LancamentoOrcamento[] = (() => {
  const items: LancamentoOrcamento[] = [];
  const configs: Record<string, { orcBase: number; realBase: number }> = {
    c1: { orcBase: 40000, realBase: 38000 },
    c2: { orcBase: 25000, realBase: 26200 },
    c3: { orcBase: 16250, realBase: 15800 },
    c4: { orcBase: 23333, realBase: 24100 },
    c5: { orcBase: 12083, realBase: 14600 }, // TI over budget
    c6: { orcBase: 10000, realBase: 8900 },
  };
  const CENTROS_IDS = ["c1", "c2", "c3", "c4", "c5", "c6"];
  for (const cid of CENTROS_IDS) {
    const cfg = configs[cid];
    for (let mes = 1; mes <= 12; mes++) {
      const varianceFactor = 0.92 + Math.random() * 0.18;
      const isRealized = mes <= 3;
      items.push({
        id: `${cid}_2026_${mes}`,
        centroId: cid,
        ano: 2026,
        mes,
        orcado: Math.round(cfg.orcBase * (1 + (mes - 1) * 0.005)),
        realizado: isRealized ? Math.round(cfg.realBase * varianceFactor) : 0,
      });
    }
  }
  return items;
})();

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtK = (v: number) =>
  v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : fmt(v);

function getStatusDesvio(pct: number): { label: string; cls: string } {
  if (Math.abs(pct) >= 20)
    return { label: "Crítico", cls: "bg-red-100 text-red-700 border-red-200" };
  if (Math.abs(pct) >= 10)
    return {
      label: "Atenção",
      cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
  return { label: "OK", cls: "bg-green-100 text-green-700 border-green-200" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Orcamento() {
  const { addMessage } = useARIA();

  const [centros, setCentros] = useState<CentroCusto[]>([]);
  const [lancamentos, setLancamentos] = useState<LancamentoOrcamento[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [anoSel, setAnoSel] = useState("2026");
  const [centroSel, setCentroSel] = useState("todos");
  const [periodoSel, setPeriodoSel] = useState("anual");
  const [activeTab, setActiveTab] = useState("centros");

  // dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCentro, setEditingCentro] = useState<CentroCusto | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formTipo, setFormTipo] = useState<CentroCusto["tipo"]>("Despesa");
  const [formResp, setFormResp] = useState("");
  const [formOrc, setFormOrc] = useState("");

  // inline editing
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const modoSimulado = localStorage.getItem("orcamento_modo") !== "real";

  // ---------------------------------------------------------------------------
  // Load / seed IndexedDB
  // ---------------------------------------------------------------------------
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let cs = await getAllRecords<CentroCusto>("orcamento_centros");
      if (cs.length === 0) {
        for (const c of DEFAULT_CENTROS)
          await putRecord("orcamento_centros", c);
        cs = DEFAULT_CENTROS;
      }
      let ls = await getAllRecords<LancamentoOrcamento>(
        "orcamento_lancamentos",
      );
      if (ls.length === 0) {
        for (const l of DEFAULT_LANCAMENTOS)
          await putRecord("orcamento_lancamentos", l);
        ls = DEFAULT_LANCAMENTOS;
      }
      setCentros(cs);
      setLancamentos(ls);
    } catch {
      setCentros(DEFAULT_CENTROS);
      setLancamentos(DEFAULT_LANCAMENTOS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // Comparativo ARIA notification
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== "comparativo" || loading) return;
    const ano = Number(anoSel);
    const desvios: string[] = [];
    for (const c of centros) {
      const ls = lancamentos.filter(
        (l) => l.centroId === c.id && l.ano === ano && l.realizado > 0,
      );
      if (ls.length === 0) continue;
      const totalOrc = ls.reduce((s, l) => s + l.orcado, 0);
      const totalReal = ls.reduce((s, l) => s + l.realizado, 0);
      const pct = ((totalReal - totalOrc) / totalOrc) * 100;
      if (Math.abs(pct) >= 10) {
        const dir = pct > 0 ? "acima" : "abaixo";
        desvios.push(
          `${c.nome} está ${Math.abs(pct).toFixed(1)}% ${dir} do orçamento`,
        );
      }
    }
    if (desvios.length > 0) {
      addMessage({
        type: "info",
        text: `📊 Orçamento ${ano}: ${desvios.join(", ")}`,
      });
    }
  }, [activeTab, loading, centros, lancamentos, anoSel, addMessage]);

  // ---------------------------------------------------------------------------
  // Centros CRUD
  // ---------------------------------------------------------------------------
  const openNewCentro = () => {
    setEditingCentro(null);
    setFormNome("");
    setFormTipo("Despesa");
    setFormResp("");
    setFormOrc("");
    setDialogOpen(true);
  };

  const openEditCentro = (c: CentroCusto) => {
    setEditingCentro(c);
    setFormNome(c.nome);
    setFormTipo(c.tipo);
    setFormResp(c.responsavel);
    setFormOrc(String(c.orcamentoTotal));
    setDialogOpen(true);
  };

  const saveCentro = async () => {
    if (!formNome.trim()) {
      toast.error("Nome obrigatório");
      return;
    }
    const novo: CentroCusto = {
      id: editingCentro?.id ?? `c${Date.now()}`,
      nome: formNome.trim(),
      tipo: formTipo,
      responsavel: formResp.trim() || "—",
      orcamentoTotal: Number(formOrc) || 0,
      status: "Ativo",
    };
    try {
      await putRecord("orcamento_centros", novo);
      setCentros((prev) =>
        editingCentro
          ? prev.map((x) => (x.id === novo.id ? novo : x))
          : [...prev, novo],
      );
      setDialogOpen(false);
      toast.success(editingCentro ? "Centro atualizado" : "Centro criado");
    } catch {
      toast.error("Erro ao salvar centro");
    }
  };

  const deleteCentro = async (id: string) => {
    try {
      await deleteRecord("orcamento_centros", id);
      setCentros((prev) => prev.filter((c) => c.id !== id));
      toast.success("Centro excluído");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  // ---------------------------------------------------------------------------
  // Inline edit cell
  // ---------------------------------------------------------------------------
  const startEdit = (key: string, val: number) => {
    setEditingCell(key);
    setEditValue(String(val));
  };

  const commitEdit = async (lancId: string, field: "orcado" | "realizado") => {
    const val = Number(editValue.replace(/[^0-9.]/g, ""));
    if (Number.isNaN(val)) {
      setEditingCell(null);
      return;
    }
    try {
      const lc = lancamentos.find((l) => l.id === lancId);
      if (!lc) return;
      const updated = { ...lc, [field]: val };
      await putRecord("orcamento_lancamentos", updated);
      setLancamentos((prev) =>
        prev.map((l) => (l.id === lancId ? updated : l)),
      );
    } catch {
      toast.error("Erro ao salvar");
    }
    setEditingCell(null);
  };

  // ---------------------------------------------------------------------------
  // Export helpers
  // ---------------------------------------------------------------------------
  const exportPrint = () => window.print();

  const exportCSV = (data: string[][], filename: string) => {
    const csv = data
      .map((row) => row.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------------------------------
  // Computed data
  // ---------------------------------------------------------------------------
  const ano = Number(anoSel);
  const _centrosFiltrados =
    centroSel === "todos" ? centros : centros.filter((c) => c.id === centroSel);

  // Orçamento Anual — lançamentos por centro + mes
  const orcAnoLancs = lancamentos.filter(
    (l) => l.ano === ano && (centroSel === "todos" || l.centroId === centroSel),
  );

  const orcAnoMeses = MESES.map((m, i) => {
    const mesLancs = orcAnoLancs.filter((l) => l.mes === i + 1);
    const orcado = mesLancs.reduce((s, l) => s + l.orcado, 0);
    const realizado = mesLancs.reduce((s, l) => s + l.realizado, 0);
    const varR = realizado - orcado;
    const varPct = orcado > 0 ? (varR / orcado) * 100 : 0;
    return {
      mes: m,
      orcado,
      realizado,
      varR,
      varPct,
      isRealized: realizado > 0,
    };
  });

  const totalOrc = orcAnoMeses.reduce((s, m) => s + m.orcado, 0);
  const totalReal = orcAnoMeses.reduce((s, m) => s + m.realizado, 0);
  const totalVarR = totalReal - totalOrc;
  const totalVarPct = totalOrc > 0 ? (totalVarR / totalOrc) * 100 : 0;

  // Comparativo por centro
  const comparativo = centros
    .map((c) => {
      const ls = lancamentos.filter(
        (l) => l.centroId === c.id && l.ano === ano && l.realizado > 0,
      );
      const orcado = ls.reduce((s, l) => s + l.orcado, 0);
      const realizado = ls.reduce((s, l) => s + l.realizado, 0);
      const varR = realizado - orcado;
      const varPct = orcado > 0 ? (varR / orcado) * 100 : 0;
      const status = getStatusDesvio(varPct);
      return { ...c, orcado, realizado, varR, varPct, status };
    })
    .filter((c) => c.orcado > 0);

  const criticos = comparativo.filter((c) => Math.abs(c.varPct) >= 20).length;
  const atencao = comparativo.filter(
    (c) => Math.abs(c.varPct) >= 10 && Math.abs(c.varPct) < 20,
  ).length;

  // Chart data for Projeções
  const chartData = MESES.map((m, i) => {
    const mesLancs = orcAnoLancs.filter((l) => l.mes === i + 1);
    return {
      mes: m.slice(0, 3),
      Orçado: mesLancs.reduce((s, l) => s + l.orcado, 0),
      Realizado: mesLancs.reduce((s, l) => s + l.realizado, 0) || undefined,
    };
  });

  const recProjetada = orcAnoMeses.reduce((s, m) => s + m.orcado, 0);
  const despProjetada = centros
    .filter((c) => c.tipo === "Despesa" || c.tipo === "Misto")
    .reduce((s, c) => {
      const ls = lancamentos.filter(
        (l) => l.centroId === c.id && l.ano === ano,
      );
      return s + ls.reduce((ss, l) => ss + l.orcado, 0);
    }, 0);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="animate-spin w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-ocid="orcamento.page">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Orçamento & Previsão</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Centros de custo, planejamento anual e análise comparativa
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {modoSimulado ? (
            <Badge variant="outline" className="text-xs">
              Modo Simulado
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-700 text-xs">
              Modo Real
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={exportPrint}
            data-ocid="orcamento.export.button"
          >
            <Download className="w-4 h-4 mr-1" /> Exportar
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="centros" data-ocid="orcamento.centros.tab">
              <Layers className="w-4 h-4 mr-1.5" /> Centros de Custo
            </TabsTrigger>
            <TabsTrigger value="anual" data-ocid="orcamento.anual.tab">
              <Target className="w-4 h-4 mr-1.5" /> Orçamento Anual
            </TabsTrigger>
            <TabsTrigger
              value="comparativo"
              data-ocid="orcamento.comparativo.tab"
              className="relative"
            >
              <TrendingUp className="w-4 h-4 mr-1.5" /> Comparativo
              {(criticos > 0 || atencao > 0) && (
                <span className="ml-1.5 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">
                  {criticos + atencao}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="projecoes" data-ocid="orcamento.projecoes.tab">
              <BarChart2 className="w-4 h-4 mr-1.5" /> Projeções
            </TabsTrigger>
          </TabsList>

          {/* ---------------------------------------------------------------- */}
          {/* ABA 1 — Centros de Custo                                         */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="centros">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4 px-5 border-b border-border">
                <CardTitle className="text-base">Centros de Custo</CardTitle>
                <Button
                  size="sm"
                  onClick={openNewCentro}
                  data-ocid="orcamento.add_centro.button"
                >
                  <Plus className="w-4 h-4 mr-1" /> Novo Centro de Custo
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {[
                        "Nome",
                        "Tipo",
                        "Responsável",
                        "Orçamento Total",
                        "Status",
                        "Ações",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs text-muted-foreground px-4 py-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {centros.map((c, i) => (
                      <tr
                        key={c.id}
                        data-ocid={`orcamento.centro.item.${i + 1}`}
                        className="border-b border-border/50 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 font-medium">{c.nome}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {c.tipo}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.responsavel}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {fmt(c.orcamentoTotal)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              c.status === "Ativo"
                                ? "bg-green-100 text-green-700 text-xs"
                                : "bg-gray-100 text-gray-500 text-xs"
                            }
                          >
                            {c.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => openEditCentro(c)}
                              data-ocid={`orcamento.centro.edit_button.${i + 1}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteCentro(c.id)}
                              data-ocid={`orcamento.centro.delete_button.${i + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* ABA 2 — Orçamento Anual                                          */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="anual">
            <div className="flex items-center gap-3 mb-4">
              <Select value={anoSel} onValueChange={setAnoSel}>
                <SelectTrigger
                  className="w-28"
                  data-ocid="orcamento.anual.year.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["2024", "2025", "2026"].map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={centroSel} onValueChange={setCentroSel}>
                <SelectTrigger
                  className="w-52"
                  data-ocid="orcamento.anual.centro.select"
                >
                  <SelectValue placeholder="Centro de custo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os centros</SelectItem>
                  {centros.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    exportCSV(
                      [
                        [
                          "Mês",
                          "Orçado",
                          "Realizado",
                          "Variação R$",
                          "Variação %",
                        ],
                        ...orcAnoMeses.map((m) => [
                          m.mes,
                          String(m.orcado),
                          String(m.realizado),
                          String(m.varR),
                          m.varPct.toFixed(1),
                        ]),
                      ],
                      `orcamento_${anoSel}.csv`,
                    )
                  }
                  data-ocid="orcamento.anual.csv.button"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1" /> CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportPrint}
                  data-ocid="orcamento.anual.pdf.button"
                >
                  <FileText className="w-4 h-4 mr-1" /> PDF
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {[
                        "Mês",
                        "Orçado",
                        "Realizado",
                        "Variação R$",
                        "Variação %",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs text-muted-foreground px-4 py-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orcAnoMeses.map((m, i) => {
                      const lancId = lancamentos.find(
                        (l) =>
                          l.ano === ano &&
                          l.mes === i + 1 &&
                          (centroSel === "todos" || l.centroId === centroSel),
                      )?.id;
                      return (
                        <tr
                          key={m.mes}
                          data-ocid={`orcamento.anual.row.${i + 1}`}
                          className="border-b border-border/50 hover:bg-muted/20"
                        >
                          <td className="px-4 py-2.5 font-medium">{m.mes}</td>
                          <td className="px-4 py-2.5">
                            {editingCell === `${lancId}_orcado` ? (
                              <Input
                                className="h-7 w-28 text-xs"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() =>
                                  lancId && commitEdit(lancId, "orcado")
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  lancId &&
                                  commitEdit(lancId, "orcado")
                                }
                                autoFocus
                              />
                            ) : (
                              <button
                                type="button"
                                className="cursor-pointer hover:underline bg-transparent border-0 p-0 text-inherit font-inherit text-left"
                                onClick={() =>
                                  lancId &&
                                  startEdit(`${lancId}_orcado`, m.orcado)
                                }
                              >
                                {fmtK(m.orcado)}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {m.isRealized ? (
                              fmtK(m.realizado)
                            ) : (
                              <span className="text-muted-foreground/50">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {m.isRealized ? (
                              <span
                                className={
                                  m.varR >= 0
                                    ? "text-green-600 font-medium"
                                    : "text-red-600 font-medium"
                                }
                              >
                                {m.varR >= 0 ? "+" : ""}
                                {fmtK(m.varR)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {m.isRealized ? (
                              <span
                                className={
                                  m.varPct >= 0
                                    ? "text-green-600 font-medium"
                                    : "text-red-600 font-medium"
                                }
                              >
                                {m.varPct >= 0 ? "+" : ""}
                                {m.varPct.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Totals row */}
                    <tr className="bg-muted/20 font-semibold">
                      <td className="px-4 py-3">Total {anoSel}</td>
                      <td className="px-4 py-3">{fmtK(totalOrc)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {totalReal > 0 ? fmtK(totalReal) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {totalReal > 0 && (
                          <span
                            className={
                              totalVarR >= 0 ? "text-green-600" : "text-red-600"
                            }
                          >
                            {totalVarR >= 0 ? "+" : ""}
                            {fmtK(totalVarR)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {totalReal > 0 && (
                          <span
                            className={
                              totalVarPct >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {totalVarPct >= 0 ? "+" : ""}
                            {totalVarPct.toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* ABA 3 — Comparativo                                              */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="comparativo">
            <div className="flex items-center gap-3 mb-4">
              <Select value={periodoSel} onValueChange={setPeriodoSel}>
                <SelectTrigger
                  className="w-36"
                  data-ocid="orcamento.comp.periodo.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trimestre">1º Trimestre</SelectItem>
                  <SelectItem value="semestre">1º Semestre</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
              <Select value={anoSel} onValueChange={setAnoSel}>
                <SelectTrigger
                  className="w-24"
                  data-ocid="orcamento.comp.ano.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["2024", "2025", "2026"].map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="ml-auto flex gap-2">
                {criticos > 0 && (
                  <Badge className="bg-red-100 text-red-700">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {criticos} crítico{criticos > 1 ? "s" : ""}
                  </Badge>
                )}
                {atencao > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-700">
                    {atencao} atenção
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportPrint}
                  data-ocid="orcamento.comp.export.button"
                >
                  <Download className="w-4 h-4 mr-1" /> Exportar
                </Button>
              </div>
            </div>

            {/* ARIA panel */}
            {comparativo.some((c) => Math.abs(c.varPct) >= 10) && (
              <Card className="mb-4 border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex gap-3">
                  <Bot className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-foreground mb-1">
                      Análise ARIA
                    </p>
                    <p className="text-muted-foreground">
                      {comparativo
                        .filter((c) => Math.abs(c.varPct) >= 20)
                        .map(
                          (c) =>
                            `${c.nome} está ${Math.abs(c.varPct).toFixed(1)}% ${c.varPct > 0 ? "acima" : "abaixo"} do orçamento (crítico)`,
                        )
                        .join(" | ") ||
                        comparativo
                          .filter((c) => Math.abs(c.varPct) >= 10)
                          .map(
                            (c) =>
                              `${c.nome} com desvio de ${Math.abs(c.varPct).toFixed(1)}%`,
                          )
                          .join(" | ")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {[
                        "Centro",
                        "Orçado",
                        "Realizado",
                        "Variação R$",
                        "Variação %",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs text-muted-foreground px-4 py-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparativo.map((c, i) => (
                      <tr
                        key={c.id}
                        data-ocid={`orcamento.comp.row.${i + 1}`}
                        className="border-b border-border/50 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 font-medium">{c.nome}</td>
                        <td className="px-4 py-3">{fmtK(c.orcado)}</td>
                        <td className="px-4 py-3">
                          {c.realizado > 0 ? (
                            fmtK(c.realizado)
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {c.realizado > 0 && (
                            <span
                              className={
                                c.varR >= 0
                                  ? "text-green-600 font-medium"
                                  : "text-red-600 font-medium"
                              }
                            >
                              {c.varR >= 0 ? "+" : ""}
                              {fmtK(c.varR)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {c.realizado > 0 && (
                            <span
                              className={
                                c.varPct >= 0
                                  ? "text-green-600 font-medium"
                                  : "text-red-600 font-medium"
                              }
                            >
                              {c.varPct >= 0 ? "+" : ""}
                              {c.varPct.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {c.realizado > 0 ? (
                            <Badge className={`text-xs ${c.status.cls}`}>
                              {c.status.label}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              A realizar
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* ABA 4 — Projeções                                                */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="projecoes">
            <div className="flex items-center gap-3 mb-4">
              <Select value={centroSel} onValueChange={setCentroSel}>
                <SelectTrigger
                  className="w-52"
                  data-ocid="orcamento.proj.centro.select"
                >
                  <SelectValue placeholder="Centro de custo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os centros</SelectItem>
                  {centros.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={anoSel} onValueChange={setAnoSel}>
                <SelectTrigger
                  className="w-24"
                  data-ocid="orcamento.proj.ano.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["2024", "2025", "2026"].map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: "Receita Projetada",
                  val: recProjetada,
                  color: "text-green-600",
                },
                {
                  label: "Despesa Projetada",
                  val: despProjetada,
                  color: "text-red-600",
                },
                {
                  label: "Resultado Esperado",
                  val: recProjetada - despProjetada,
                  color: "text-primary",
                },
                {
                  label: "Desvio Médio",
                  val: totalReal > 0 ? Math.abs(totalVarPct) : 0,
                  isPercent: true,
                  color:
                    Math.abs(totalVarPct) >= 10
                      ? "text-red-600"
                      : "text-green-600",
                },
              ].map((kpi, i) => (
                <Card key={kpi.label} data-ocid={`orcamento.kpi.item.${i + 1}`}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      {kpi.label}
                    </p>
                    <p className={`text-xl font-bold ${kpi.color}`}>
                      {kpi.isPercent ? `${kpi.val.toFixed(1)}%` : fmtK(kpi.val)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="py-4 px-5 border-b border-border">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  Orçado vs. Realizado — {anoSel}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(0,0,0,0.06)"
                    />
                    <XAxis
                      dataKey="mes"
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    />
                    <RechTooltip
                      formatter={(v: number) => fmt(v)}
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#6b7280", fontSize: 12 }} />
                    <Bar
                      dataKey="Orçado"
                      fill="oklch(0.6 0.1 240)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Realizado"
                      fill="oklch(0.65 0.18 145)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Dialog — Novo/Editar Centro                                      */}
      {/* ---------------------------------------------------------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="orcamento.centro.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingCentro
                ? "Editar Centro de Custo"
                : "Novo Centro de Custo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="oc-nome">Nome *</Label>
              <Input
                id="oc-nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: Marketing Digital"
                data-ocid="orcamento.centro.nome.input"
              />
            </div>
            <div>
              <Label htmlFor="oc-tipo">Tipo</Label>
              <Select
                value={formTipo}
                onValueChange={(v) => setFormTipo(v as CentroCusto["tipo"])}
              >
                <SelectTrigger
                  id="oc-tipo"
                  data-ocid="orcamento.centro.tipo.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                  <SelectItem value="Misto">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="oc-resp">Responsável</Label>
              <Input
                id="oc-resp"
                value={formResp}
                onChange={(e) => setFormResp(e.target.value)}
                placeholder="Nome do responsável"
                data-ocid="orcamento.centro.resp.input"
              />
            </div>
            <div>
              <Label htmlFor="oc-orc">Orçamento Total (R$)</Label>
              <Input
                id="oc-orc"
                type="number"
                value={formOrc}
                onChange={(e) => setFormOrc(e.target.value)}
                placeholder="0.00"
                data-ocid="orcamento.centro.orcamento.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="orcamento.centro.cancel.button"
            >
              Cancelar
            </Button>
            <Button
              onClick={saveCentro}
              data-ocid="orcamento.centro.save.button"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
