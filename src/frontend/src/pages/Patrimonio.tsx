import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Calculator,
  Calendar,
  Eye,
  FileText,
  Pencil,
  Plus,
  Printer,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import {
  type PatrimonioBem,
  type PatrimonioCategoria,
  deleteRecord,
  getAllRecords,
  putRecord,
} from "../lib/db";

// ── Seed data ────────────────────────────────────────────────────────────────

const SEED_BENS: PatrimonioBem[] = [
  {
    id: "1",
    code: "TI-001",
    desc: "Computador Dell Optiplex",
    group: "Equip. TI",
    acquisition: "15/03/2022",
    original: 4800,
    life: "5 anos",
    rate: "20%",
    accumulated: 3360,
    current: 1440,
    status: "Ativo",
    localizacao: "Sala 1 - 1º andar",
    responsavel: "TI",
  },
  {
    id: "2",
    code: "TI-002",
    desc: "Notebook Lenovo ThinkPad",
    group: "Equip. TI",
    acquisition: "22/06/2022",
    original: 6500,
    life: "5 anos",
    rate: "20%",
    accumulated: 4160,
    current: 2340,
    status: "Ativo",
    localizacao: "Sala 2 - 1º andar",
    responsavel: "Gerência",
  },
  {
    id: "3",
    code: "TI-003",
    desc: "Impressora HP LaserJet",
    group: "Equip. TI",
    acquisition: "10/01/2021",
    original: 2200,
    life: "5 anos",
    rate: "20%",
    accumulated: 2200,
    current: 0,
    status: "Totalmente Depreciado",
    localizacao: "Recepção",
  },
  {
    id: "4",
    code: "TI-004",
    desc: "Servidor HP ProLiant",
    group: "Equip. TI",
    acquisition: "05/08/2023",
    original: 18000,
    life: "5 anos",
    rate: "20%",
    accumulated: 5400,
    current: 12600,
    status: "Ativo",
    localizacao: "Sala de Servidores",
    responsavel: "TI",
  },
  {
    id: "5",
    code: "MU-001",
    desc: "Mesa de Escritório",
    group: "Móveis e Utensílios",
    acquisition: "20/02/2020",
    original: 1800,
    life: "10 anos",
    rate: "10%",
    accumulated: 1080,
    current: 720,
    status: "Ativo",
    localizacao: "Sala 3 - 2º andar",
  },
  {
    id: "6",
    code: "MU-002",
    desc: "Cadeira Ergonômica",
    group: "Móveis e Utensílios",
    acquisition: "20/02/2020",
    original: 1200,
    life: "10 anos",
    rate: "10%",
    accumulated: 720,
    current: 480,
    status: "Ativo",
    localizacao: "Sala 3 - 2º andar",
  },
  {
    id: "7",
    code: "EQ-001",
    desc: "Ar Condicionado Split",
    group: "Equipamentos",
    acquisition: "15/11/2021",
    original: 3500,
    life: "10 anos",
    rate: "10%",
    accumulated: 1225,
    current: 2275,
    status: "Ativo",
    localizacao: "Sala de Reuniões",
  },
  {
    id: "8",
    code: "VE-001",
    desc: "Veículo VW Gol",
    group: "Veículos",
    acquisition: "10/03/2021",
    original: 52000,
    life: "5 anos",
    rate: "20%",
    accumulated: 36400,
    current: 15600,
    status: "Ativo",
    responsavel: "Logística",
  },
  {
    id: "9",
    code: "VE-002",
    desc: "Veículo Toyota Hilux",
    group: "Veículos",
    acquisition: "08/07/2023",
    original: 185000,
    life: "5 anos",
    rate: "20%",
    accumulated: 46250,
    current: 138750,
    status: "Ativo",
    responsavel: "Diretoria",
  },
  {
    id: "10",
    code: "IN-001",
    desc: "Software ERP (Licença)",
    group: "Intangível",
    acquisition: "01/01/2023",
    original: 15000,
    life: "5 anos",
    rate: "20%",
    accumulated: 3750,
    current: 11250,
    status: "Ativo",
  },
  {
    id: "11",
    code: "IM-001",
    desc: "Edificação Comercial",
    group: "Imóveis",
    acquisition: "15/06/2018",
    original: 850000,
    life: "25 anos",
    rate: "4%",
    accumulated: 238000,
    current: 612000,
    status: "Ativo",
    localizacao: "Centro - São Paulo",
  },
  {
    id: "12",
    code: "IM-002",
    desc: "Terreno Industrial",
    group: "Imóveis",
    acquisition: "10/04/2015",
    original: 145000,
    life: "—",
    rate: "0%",
    accumulated: 0,
    current: 145000,
    status: "Ativo (Não depreciável)",
    localizacao: "Zona Industrial",
  },
];

const DEFAULT_CATEGORIAS: PatrimonioCategoria[] = [
  { id: "cat-1", name: "Equip. TI", rate: 20, lifeYears: 5 },
  { id: "cat-2", name: "Móveis e Utensílios", rate: 10, lifeYears: 10 },
  { id: "cat-3", name: "Veículos", rate: 20, lifeYears: 5 },
  { id: "cat-4", name: "Imóveis", rate: 4, lifeYears: 25 },
  { id: "cat-5", name: "Intangível", rate: 20, lifeYears: 5 },
  { id: "cat-6", name: "Equipamentos", rate: 10, lifeYears: 10 },
];

const CLIENTES = [
  "Empresa ABC",
  "Tech Solutions",
  "Varejo Plus",
  "Construtora XYZ",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusColor = (s: string) => {
  if (s === "Ativo")
    return "bg-green-500/20 text-green-400 border-green-500/30";
  if (s === "Totalmente Depreciado")
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  if (s === "Em Manutenção")
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
};

// ── Depreciation types ────────────────────────────────────────────────────────
interface DepRow {
  code: string;
  desc: string;
  valorOriginal: number;
  taxa: string;
  depMensal: number;
  acumulado: number;
  valorLiquido: number;
}

// ── Month list ────────────────────────────────────────────────────────────────
const now = new Date();
const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
  const val = `${String(d.getMonth() + 1).padStart(2, "0")}${d.getFullYear()}`;
  const label = d
    .toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
    .replace(". ", "/")
    .replace(".", "");
  return { value: val, label };
});

// ── Depreciation engine ───────────────────────────────────────────────────────
function calcularDepreciacao(
  bem: PatrimonioBem,
  metodo: string,
  periodoValue: string,
): DepRow {
  const lifeMatch = bem.life.match(/(\d+(?:\.\d+)?)/);
  const years = lifeMatch ? Number(lifeMatch[1]) : 5;
  const residual = bem.original * 0.1;

  // Parse acquisition date dd/mm/yyyy
  let monthsElapsed = 0;
  const acqParts = bem.acquisition.match(/(\d+)\/(\d+)\/(\d+)/);
  if (acqParts) {
    const acqDate = new Date(
      Number(acqParts[3]),
      Number(acqParts[2]) - 1,
      Number(acqParts[1]),
    );
    const periodoYear = Number(periodoValue.slice(2));
    const periodoMonth = Number(periodoValue.slice(0, 2));
    const periodoDate = new Date(periodoYear, periodoMonth - 1, 1);
    const diffMs = periodoDate.getTime() - acqDate.getTime();
    monthsElapsed = Math.max(
      0,
      Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44)),
    );
  } else {
    monthsElapsed = Math.round(years * 12 * 0.5);
  }

  const totalDepMonths = years * 12;
  let depMensal = 0;

  if (metodo === "slm") {
    // Straight line
    depMensal = (bem.original - residual) / totalDepMonths;
  } else {
    // Sum of digits (SDA) — simplified: weight by remaining months
    const monthsRemaining = Math.max(0, totalDepMonths - monthsElapsed);
    const sdaTotal = (totalDepMonths * (totalDepMonths + 1)) / 2;
    const sdaFactor = (monthsRemaining || 1) / sdaTotal;
    depMensal = (bem.original - residual) * sdaFactor;
  }

  depMensal = Math.max(0, depMensal);
  const acumulado = Math.min(
    bem.original - residual,
    depMensal * monthsElapsed,
  );
  const valorLiquido = Math.max(residual, bem.original - acumulado);

  return {
    code: bem.code,
    desc: bem.desc,
    valorOriginal: bem.original,
    taxa: bem.rate,
    depMensal,
    acumulado,
    valorLiquido,
  };
}

function buildDepreciationTimeline(bem: PatrimonioBem) {
  const lifeMatch = bem.life.match(/(\d+)/);
  if (!lifeMatch) return [];
  const years = Number(lifeMatch[1]);
  const rateNum = Number.parseFloat(bem.rate) / 100;
  const rows: { year: number; start: number; dep: number; end: number }[] = [];
  let val = bem.original;
  for (let y = 1; y <= years; y++) {
    const annualDep = bem.original * rateNum;
    const endVal = Math.max(0, val - annualDep);
    rows.push({ year: y, start: val, dep: annualDep, end: endVal });
    val = endVal;
    if (val <= 0) break;
  }
  return rows;
}

function nextCode(bens: PatrimonioBem[], group: string): string {
  const prefixMap: Record<string, string> = {
    "Equip. TI": "TI",
    "Móveis e Utensílios": "MU",
    Veículos: "VE",
    Imóveis: "IM",
    Intangível: "IN",
    Equipamentos: "EQ",
  };
  const prefix = prefixMap[group] ?? "BM";
  const existing = bens
    .filter((b) => b.code.startsWith(`${prefix}-`))
    .map((b) => Number.parseInt(b.code.split("-")[1] ?? "0", 10))
    .filter(Number.isFinite);
  const next = existing.length ? Math.max(...existing) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

// ── Empty form ────────────────────────────────────────────────────────────────

const emptyForm = (): Omit<
  PatrimonioBem,
  "id" | "code" | "accumulated" | "current"
> => ({
  desc: "",
  group: "",
  acquisition: "",
  original: 0,
  life: "",
  rate: "",
  status: "Ativo",
  serie: "",
  localizacao: "",
  responsavel: "",
  fornecedor: "",
  numeroNF: "",
  observacoes: "",
  cliente: "",
});

// ── Component ────────────────────────────────────────────────────────────────

export default function Patrimonio() {
  const { addMessage } = useARIA();

  const [bens, setBens] = useState<PatrimonioBem[]>([]);
  const [categorias, setCategorias] = useState<PatrimonioCategoria[]>([]);
  const [loaded, setLoaded] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBem, setEditingBem] = useState<PatrimonioBem | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [formOriginal, setFormOriginal] = useState("");

  // ficha state
  const [fichaOpen, setFichaOpen] = useState(false);
  const [fichaBem, setFichaBem] = useState<PatrimonioBem | null>(null);

  // categoria dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", rate: "", life: "" });

  // depreciacao state
  const [depMonth, setDepMonth] = useState(() => {
    const d = new Date();
    return String(d.getMonth() + 1).padStart(2, "0") + String(d.getFullYear());
  });
  const [depMetodo, setDepMetodo] = useState("slm");
  const [depRows, setDepRows] = useState<DepRow[]>([]);
  const [laudoOpen, setLaudoOpen] = useState(false);

  // ── Load from IndexedDB ────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const [dbBens, dbCats] = await Promise.all([
      getAllRecords<PatrimonioBem>("patrimonio_bens"),
      getAllRecords<PatrimonioCategoria>("patrimonio_categorias"),
    ]);

    let finalBens = dbBens;
    let finalCats = dbCats;

    if (dbBens.length === 0) {
      await Promise.all(SEED_BENS.map((b) => putRecord("patrimonio_bens", b)));
      finalBens = SEED_BENS;
    }

    if (dbCats.length === 0) {
      await Promise.all(
        DEFAULT_CATEGORIAS.map((c) => putRecord("patrimonio_categorias", c)),
      );
      finalCats = DEFAULT_CATEGORIAS;
    }

    setBens(finalBens);
    setCategorias(finalCats);
    setLoaded(true);

    // ARIA warning: nearly deprecated assets
    const nearEnd = finalBens.filter(
      (b) => b.original > 0 && b.current / b.original < 0.1 && b.current > 0,
    );
    if (nearEnd.length > 0) {
      addMessage({
        type: "warning",
        text: `⚠️ Atenção: ${nearEnd.length} ${nearEnd.length === 1 ? "bem está próximo" : "bens estão próximos"} do fim da vida útil. Verifique em Patrimônio.`,
      });
    }
  }, [addMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filtered bens ─────────────────────────────────────────────────────
  const filteredBens = bens.filter((b) => {
    const matchSearch =
      !search ||
      b.desc.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase());
    const matchGroup = filterGroup === "all" || b.group === filterGroup;
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchGroup && matchStatus;
  });

  const groups = Array.from(new Set(bens.map((b) => b.group)));

  // ── Open modal ────────────────────────────────────────────────────────
  const openNew = () => {
    setEditingBem(null);
    setForm(emptyForm());
    setFormOriginal("");
    setModalOpen(true);
  };

  const openEdit = (bem: PatrimonioBem) => {
    setEditingBem(bem);
    setForm({
      desc: bem.desc,
      group: bem.group,
      acquisition: bem.acquisition,
      original: bem.original,
      life: bem.life,
      rate: bem.rate,
      status: bem.status,
      serie: bem.serie ?? "",
      localizacao: bem.localizacao ?? "",
      responsavel: bem.responsavel ?? "",
      fornecedor: bem.fornecedor ?? "",
      numeroNF: bem.numeroNF ?? "",
      observacoes: bem.observacoes ?? "",
      cliente: bem.cliente ?? "",
    });
    setFormOriginal(String(bem.original));
    setModalOpen(true);
  };

  // ── Save bem ───────────────────────────────────────────────────────────
  const saveBem = async () => {
    if (!form.desc || !form.group) {
      toast.error("Preencha descrição e grupo.");
      return;
    }
    const originalVal =
      Number.parseFloat(formOriginal.replace(",", ".")) || form.original;
    const rateNum = Number.parseFloat(form.rate) / 100;
    const lifeNum = Number.parseFloat(form.life);
    const approxYears = 3.5; // rough midpoint for demo
    const computedAccum = Math.min(
      originalVal,
      originalVal * rateNum * approxYears,
    );

    if (editingBem) {
      const updated: PatrimonioBem = {
        ...editingBem,
        ...form,
        original: originalVal,
        accumulated: editingBem.accumulated,
        current: editingBem.current,
        life: Number.isNaN(lifeNum) ? form.life : `${lifeNum} anos`,
      };
      await putRecord("patrimonio_bens", updated);
      setBens((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      toast.success("Bem atualizado com sucesso.");
      addMessage({
        type: "success",
        text: `✅ Bem "${updated.desc}" atualizado. Categoria: ${updated.group}, Taxa: ${updated.rate}/ano.`,
      });
    } else {
      const newBem: PatrimonioBem = {
        id: `bem_${Date.now()}`,
        code: nextCode(bens, form.group),
        ...form,
        original: originalVal,
        accumulated: Number.isNaN(rateNum) ? 0 : computedAccum,
        current: Number.isNaN(rateNum)
          ? originalVal
          : Math.max(0, originalVal - computedAccum),
        life: Number.isNaN(lifeNum) ? form.life || "—" : `${lifeNum} anos`,
      };
      await putRecord("patrimonio_bens", newBem);
      setBens((prev) => [...prev, newBem]);
      toast.success(`Bem "${newBem.desc}" cadastrado com sucesso.`);
      addMessage({
        type: "success",
        text: `✅ Bem "${newBem.desc}" cadastrado com sucesso. Categoria: ${newBem.group}, Taxa de depreciação: ${newBem.rate} ao ano.`,
      });
    }
    setModalOpen(false);
  };

  // ── Delete bem ────────────────────────────────────────────────────────
  const deleteBem = async (id: string) => {
    await deleteRecord("patrimonio_bens", id);
    setBens((prev) => prev.filter((b) => b.id !== id));
    toast.success("Bem excluído.");
  };

  // ── Save categoria ─────────────────────────────────────────────────────
  const saveCategoria = async () => {
    if (!catForm.name || !catForm.rate || !catForm.life) {
      toast.error("Preencha todos os campos.");
      return;
    }
    const cat: PatrimonioCategoria = {
      id: `cat_${Date.now()}`,
      name: catForm.name,
      rate: Number.parseFloat(catForm.rate),
      lifeYears: Number.parseFloat(catForm.life),
      custom: true,
    };
    await putRecord("patrimonio_categorias", cat);
    setCategorias((prev) => [...prev, cat]);
    setCatForm({ name: "", rate: "", life: "" });
    setCatDialogOpen(false);
    toast.success(`Categoria "${cat.name}" criada.`);
  };

  // ── KPIs ───────────────────────────────────────────────────────────────
  const totalBens = bens.length;
  const totalOriginal = bens.reduce((s, b) => s + b.original, 0);
  const totalAccum = bens.reduce((s, b) => s + b.accumulated, 0);
  const totalCurrent = bens.reduce((s, b) => s + b.current, 0);

  // ── Depreciation handler ─────────────────────────────────────────────
  const handleCalcularDepreciacao = () => {
    const ativos = bens.filter(
      (b) => b.status === "Ativo" || b.status === "Em Manutenção",
    );
    if (ativos.length === 0) {
      toast.error("Nenhum bem ativo encontrado.");
      return;
    }
    const rows = ativos.map((b) => calcularDepreciacao(b, depMetodo, depMonth));
    setDepRows(rows);
    toast.success(`Depreciação calculada para ${rows.length} bens.`);
    const nearEnd = rows.filter((r) => r.acumulado / r.valorOriginal > 0.9);
    const criticalNames = nearEnd
      .map((r) => r.desc)
      .slice(0, 3)
      .join(", ");
    if (nearEnd.length > 0) {
      addMessage({
        type: "warning",
        text: `⚠️ ARIA: ${nearEnd.length} bem(s) com depreciação acima de 90% do valor original: ${criticalNames}. Considere reavaliação ou baixa contábil.`,
      });
    }
    addMessage({
      type: "success",
      text: `📊 Depreciação calculada (método: ${depMetodo === "slm" ? "Linha Reta" : "Soma dos Dígitos"}) — ${rows.length} bens ativos. Dep. mensal total: ${fmt(rows.reduce((s, r) => s + r.depMensal, 0))}.`,
    });
  };

  // ── Chart data from real bens ────────────────────────────────────────
  const groupsSet = Array.from(new Set(bens.map((b) => b.group)));
  const chartDataReal = groupsSet.map((g) => {
    const inGroup = bens.filter((b) => b.group === g);
    const original = inGroup.reduce((s, b) => s + b.original, 0);
    const accumulated = inGroup.reduce((s, b) => s + b.accumulated, 0);
    const liquid = inGroup.reduce((s, b) => s + b.current, 0);
    return { group: g, original, accumulated, liquid, count: inGroup.length };
  });

  // ── Bens totalmente depreciados ──────────────────────────────────────
  const bensDepreciados = bens.filter(
    (b) => b.original > 0 && b.accumulated >= b.original * 0.95,
  );

  // ── ARIA report message ──────────────────────────────────────────────
  const pctDep =
    totalOriginal > 0 ? Math.round((totalAccum / totalOriginal) * 100) : 0;
  const ariaRelatorioMsg =
    bens.length === 0
      ? "Nenhum bem cadastrado no patrimônio ainda."
      : `O patrimônio total é de ${fmt(totalOriginal)}, com ${pctDep}% já depreciado (${fmt(totalAccum)}). Valor líquido contábil: ${fmt(totalCurrent)}. ${bensDepreciados.length > 0 ? `Há ${bensDepreciados.length} bem(s) com depreciação ≥ 95% — recomendo análise de baixa ou substituição.` : "Todos os bens estão dentro dos limites normais de vida útil."}`;

  const totalMonthlyDep =
    depRows.length > 0
      ? depRows.reduce((s, r) => s + r.depMensal, 0)
      : bens
          .filter((b) => b.status === "Ativo")
          .reduce((s, b) => {
            const r = Number.parseFloat(b.rate) / 100 || 0.2;
            return s + (b.original * r) / 12;
          }, 0);

  const KPIS = [
    {
      label: "Total de Bens",
      value: `${totalBens} itens`,
      sub: fmt(totalOriginal),
      icon: Building2,
      color: "text-blue-400",
    },
    {
      label: "Dep. Acumulada",
      value: fmt(totalAccum),
      sub: `${totalOriginal > 0 ? Math.round((totalAccum / totalOriginal) * 100) : 0}% do valor original`,
      icon: TrendingDown,
      color: "text-orange-400",
    },
    {
      label: "Valor Líquido Contábil",
      value: fmt(totalCurrent),
      sub: `${totalOriginal > 0 ? Math.round((totalCurrent / totalOriginal) * 100) : 0}% do valor original`,
      icon: Building2,
      color: "text-green-400",
    },
    {
      label: "Depreciação do Mês",
      value: fmt(totalMonthlyDep),
      sub: MONTHS.find((m) => m.value === depMonth)?.label ?? depMonth,
      icon: Calendar,
      color: "text-purple-400",
    },
  ];

  if (!loaded) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm animate-pulse">
          Carregando bens...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-ocid="patrimonio.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Patrimônio & Imobilizado
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Controle de bens, depreciação e relatórios
          </p>
        </div>
        <Button onClick={openNew} data-ocid="patrimonio.open_modal_button">
          <Plus className="w-4 h-4 mr-2" /> Cadastrar Bem
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {KPIS.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <p className="text-xl font-bold text-white">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bens">
        <TabsList>
          <TabsTrigger data-ocid="patrimonio.bens.tab" value="bens">
            Bens Cadastrados
          </TabsTrigger>
          <TabsTrigger
            data-ocid="patrimonio.depreciacao.tab"
            value="depreciacao"
          >
            Depreciação
          </TabsTrigger>
          <TabsTrigger data-ocid="patrimonio.relatorio.tab" value="relatorio">
            Relatório
          </TabsTrigger>
          <TabsTrigger data-ocid="patrimonio.categorias.tab" value="categorias">
            Categorias
          </TabsTrigger>
        </TabsList>

        {/* ── Bens ──────────────────────────────────────────────────────── */}
        <TabsContent value="bens" className="mt-4 space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Buscar por descrição ou código..."
              className="w-72"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-ocid="patrimonio.search_input"
            />
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger
                className="w-48"
                data-ocid="patrimonio.group_filter.select"
              >
                <SelectValue placeholder="Todos os grupos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os grupos</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger
                className="w-52"
                data-ocid="patrimonio.status_filter.select"
              >
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Totalmente Depreciado">
                  Totalmente Depreciado
                </SelectItem>
                <SelectItem value="Em Manutenção">Em Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Código",
                      "Descrição",
                      "Grupo",
                      "Aquisição",
                      "V. Original",
                      "Vida Útil",
                      "Tx. Dep.",
                      "Dep. Acum.",
                      "V. Atual",
                      "Situação",
                      "Ações",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs text-muted-foreground px-4 py-3 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBens.map((a, i) => (
                    <tr
                      key={a.id}
                      data-ocid={`patrimonio.bem.item.${i + 1}`}
                      className="border-b border-border/50 hover:bg-white/3"
                    >
                      <td className="px-4 py-2.5 text-accent font-mono text-xs">
                        {a.code}
                      </td>
                      <td className="px-4 py-2.5 text-white font-medium whitespace-nowrap">
                        {a.desc}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {a.group}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {a.acquisition}
                      </td>
                      <td className="px-4 py-2.5 text-white">
                        {fmt(a.original)}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {a.life}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {a.rate}
                      </td>
                      <td className="px-4 py-2.5 text-orange-400">
                        {fmt(a.accumulated)}
                      </td>
                      <td className="px-4 py-2.5 text-green-400 font-medium">
                        {fmt(a.current)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge className={`text-xs ${statusColor(a.status)}`}>
                          {a.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-400"
                            onClick={() => {
                              setFichaBem(a);
                              setFichaOpen(true);
                            }}
                            data-ocid={`patrimonio.ficha.button.${i + 1}`}
                            title="Ver Ficha"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-yellow-400"
                            onClick={() => openEdit(a)}
                            data-ocid={`patrimonio.edit_button.${i + 1}`}
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                                data-ocid={`patrimonio.delete_button.${i + 1}`}
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Excluir bem?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir{" "}
                                  <strong>{a.desc}</strong>? Esta ação não pode
                                  ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  data-ocid={`patrimonio.delete_cancel.${i + 1}`}
                                >
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => deleteBem(a.id)}
                                  data-ocid={`patrimonio.delete_confirm.${i + 1}`}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBens.length === 0 && (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-10 text-center text-muted-foreground"
                        data-ocid="patrimonio.empty_state"
                      >
                        Nenhum bem encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Depreciação ───────────────────────────────────────────────── */}
        <TabsContent value="depreciacao" className="mt-4 space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Select value={depMonth} onValueChange={setDepMonth}>
                <SelectTrigger
                  data-ocid="patrimonio.month.select"
                  className="w-40"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={depMetodo} onValueChange={setDepMetodo}>
                <SelectTrigger
                  data-ocid="patrimonio.metodo.select"
                  className="w-44"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slm">Linha Reta (SLM)</SelectItem>
                  <SelectItem value="sda">Soma dos Dígitos (SDA)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                data-ocid="patrimonio.calcular.button"
                onClick={handleCalcularDepreciacao}
              >
                <Calculator className="w-4 h-4 mr-2" /> Calcular Depreciação
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                data-ocid="patrimonio.laudos.button"
                onClick={() => setLaudoOpen(true)}
              >
                <FileText className="w-4 h-4 mr-2" /> Gerar Laudos
              </Button>
              <Button
                size="sm"
                data-ocid="patrimonio.lancamento.button"
                onClick={() => {
                  if (depRows.length === 0) {
                    toast.error("Calcule a depreciação primeiro.");
                    return;
                  }
                  toast.success(
                    "Lançamento contábil gerado com sucesso! Encaminhado para Workflow de Aprovação.",
                  );
                  addMessage({
                    type: "success",
                    text: `✅ Lançamento de depreciação gerado para ${depRows.length} bens — Competência ${MONTHS.find((m) => m.value === depMonth)?.label ?? depMonth}. Total: ${fmt(depRows.reduce((s, r) => s + r.depMensal, 0))}.`,
                  });
                }}
              >
                Gerar Lançamento Contábil
              </Button>
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {depRows.length === 0 ? (
                <div
                  data-ocid="patrimonio.dep.empty_state"
                  className="py-12 text-center text-muted-foreground text-sm"
                >
                  Clique em "Calcular Depreciação" para processar os bens
                  ativos.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        "Código",
                        "Descrição",
                        "Valor Original",
                        "Taxa",
                        "Dep. Mensal",
                        "Acumulado",
                        "Valor Líquido",
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
                    {depRows.map((d, i) => (
                      <tr
                        key={d.code}
                        data-ocid={`patrimonio.dep.item.${i + 1}`}
                        className="border-b border-border/50 hover:bg-white/3"
                      >
                        <td className="px-4 py-2.5 text-accent font-mono text-xs">
                          {d.code}
                        </td>
                        <td className="px-4 py-2.5 text-white">{d.desc}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {fmt(d.valorOriginal)}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {d.taxa}
                        </td>
                        <td className="px-4 py-2.5 text-orange-400 font-semibold">
                          {fmt(d.depMensal)}
                        </td>
                        <td className="px-4 py-2.5 text-red-400">
                          {fmt(d.acumulado)}
                        </td>
                        <td className="px-4 py-2.5 text-green-400 font-medium">
                          {fmt(d.valorLiquido)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-white/5 border-t border-border">
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-white font-bold"
                      >
                        Total —{" "}
                        {MONTHS.find((m) => m.value === depMonth)?.label ??
                          depMonth}
                      </td>
                      <td className="px-4 py-3 text-orange-400 font-bold text-base">
                        {fmt(depRows.reduce((s, r) => s + r.depMensal, 0))}
                      </td>
                      <td className="px-4 py-3 text-red-400 font-bold">
                        {fmt(depRows.reduce((s, r) => s + r.acumulado, 0))}
                      </td>
                      <td className="px-4 py-3 text-green-400 font-bold">
                        {fmt(depRows.reduce((s, r) => s + r.valorLiquido, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Relatório ─────────────────────────────────────────────────── */}
        <TabsContent value="relatorio" className="mt-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                Relatório de Depreciação — NBC TG 27
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Empresa: ContaFácil Contabilidade LTDA &nbsp;|&nbsp; CNPJ:
                00.000.000/0001-00 &nbsp;|&nbsp; Data:{" "}
                {new Date().toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                data-ocid="patrimonio.export_excel.button"
                onClick={() =>
                  toast.success("Exportação Excel iniciada (simulado).")
                }
              >
                Excel
              </Button>
              <Button
                size="sm"
                variant="outline"
                data-ocid="patrimonio.export_pdf.button"
                onClick={() =>
                  toast.success("Exportação PDF iniciada (simulado).")
                }
              >
                PDF
              </Button>
            </div>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Depreciação por Grupo de Bem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartDataReal} margin={{ left: 10 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="group"
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v: number) => fmt(v)}
                    contentStyle={{
                      background: "#1e293b",
                      border: "none",
                      borderRadius: 8,
                    }}
                  />
                  <Bar
                    dataKey="original"
                    name="Valor Original"
                    fill="oklch(0.65 0.15 240)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="accumulated"
                    name="Dep. Acumulada"
                    fill="oklch(0.65 0.15 40)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="liquid"
                    name="Valor Líquido"
                    fill="oklch(0.65 0.15 145)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Consolidated table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Resumo Consolidado por Grupo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Grupo",
                      "Qtd. Bens",
                      "Valor Original",
                      "Dep. Acumulada",
                      "Valor Líquido",
                      "% Depreciado",
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
                  {chartDataReal.map((g, i) => (
                    <tr
                      key={g.group}
                      data-ocid={`patrimonio.summary.item.${i + 1}`}
                      className="border-b border-border/50"
                    >
                      <td className="px-4 py-2.5 text-white">{g.group}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {g.count}
                      </td>
                      <td className="px-4 py-2.5 text-white">
                        {fmt(g.original)}
                      </td>
                      <td className="px-4 py-2.5 text-orange-400">
                        {fmt(g.accumulated)}
                      </td>
                      <td className="px-4 py-2.5 text-green-400 font-medium">
                        {fmt(g.liquid)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-xs font-semibold ${g.original > 0 && g.accumulated / g.original > 0.8 ? "text-red-400" : "text-muted-foreground"}`}
                        >
                          {g.original > 0
                            ? Math.round((g.accumulated / g.original) * 100)
                            : 0}
                          %
                        </span>
                      </td>
                    </tr>
                  ))}
                  {chartDataReal.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-muted-foreground text-sm"
                        data-ocid="patrimonio.summary.empty_state"
                      >
                        Nenhum bem cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Fully deprecated */}
          {bensDepreciados.length > 0 && (
            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="text-sm text-red-400">
                  Bens Totalmente Depreciados ({bensDepreciados.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        "Código",
                        "Descrição",
                        "Valor Original",
                        "Dep. Acumulada",
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
                    {bensDepreciados.map((b, i) => (
                      <tr
                        key={b.id}
                        data-ocid={`patrimonio.deprecated.item.${i + 1}`}
                        className="border-b border-border/50"
                      >
                        <td className="px-4 py-2.5 font-mono text-xs text-accent">
                          {b.code}
                        </td>
                        <td className="px-4 py-2.5 text-white">{b.desc}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {fmt(b.original)}
                        </td>
                        <td className="px-4 py-2.5 text-red-400">
                          {fmt(b.accumulated)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* ARIA analysis card */}
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-sm font-bold">A</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-400 mb-1">
                    Análise ARIA — Patrimônio
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ariaRelatorioMsg}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Ativo",
                count: bens.filter((b) => b.status === "Ativo").length,
                color: "text-green-400",
              },
              {
                label: "Tot. Depreciado",
                count: bens.filter((b) => b.status === "Totalmente Depreciado")
                  .length,
                color: "text-gray-400",
              },
              {
                label: "Em Manutenção",
                count: bens.filter((b) => b.status === "Em Manutenção").length,
                color: "text-blue-400",
              },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {s.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* NBC TG 27 conformity note */}
          <p className="text-xs text-muted-foreground text-center border-t border-border pt-4">
            📋 Relatório elaborado conforme{" "}
            <strong className="text-white">
              NBC TG 27 — Ativo Imobilizado
            </strong>{" "}
            &nbsp;|&nbsp; ContaFácil ERP &nbsp;|&nbsp;{" "}
            {new Date().toLocaleDateString("pt-BR")}
          </p>
        </TabsContent>

        {/* ── Categorias ────────────────────────────────────────────────── */}
        <TabsContent value="categorias" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {categorias.length} categoria{categorias.length !== 1 ? "s" : ""}{" "}
              configurada{categorias.length !== 1 ? "s" : ""}
            </p>
            <Button
              size="sm"
              onClick={() => setCatDialogOpen(true)}
              data-ocid="patrimonio.nova_categoria.button"
            >
              <Plus className="w-4 h-4 mr-2" /> Nova Categoria
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {categorias.map((cat) => {
              const count = bens.filter(
                (b) => b.group === cat.name && b.status === "Ativo",
              ).length;
              return (
                <Card
                  key={cat.id}
                  className="border border-border hover:border-primary/40 transition-colors"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-white text-sm">
                        {cat.name}
                      </h3>
                      {cat.custom && (
                        <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                          Custom
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Taxa de depreciação</span>
                        <span className="text-orange-400 font-medium">
                          {cat.rate}% / ano
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vida útil</span>
                        <span className="text-white">{cat.lifeYears} anos</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bens ativos</span>
                        <span className="text-blue-400 font-semibold">
                          {count} iten{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Cadastrar / Editar Bem Modal ──────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBem ? "Editar Bem" : "Cadastrar Novo Bem"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2 col-span-2">
              <Label>Descrição *</Label>
              <Input
                data-ocid="patrimonio.desc.input"
                placeholder="Ex: Notebook Dell Latitude"
                value={form.desc}
                onChange={(e) =>
                  setForm((f) => ({ ...f, desc: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Grupo *</Label>
              <Select
                value={form.group}
                onValueChange={(v) => setForm((f) => ({ ...f, group: v }))}
              >
                <SelectTrigger data-ocid="patrimonio.group.select">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={form.cliente ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, cliente: v }))}
              >
                <SelectTrigger data-ocid="patrimonio.cliente.select">
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {CLIENTES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Aquisição</Label>
              <Input
                data-ocid="patrimonio.acquisition.input"
                type="date"
                value={form.acquisition}
                onChange={(e) =>
                  setForm((f) => ({ ...f, acquisition: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Original (R$)</Label>
              <Input
                data-ocid="patrimonio.value.input"
                placeholder="0,00"
                value={formOriginal}
                onChange={(e) => setFormOriginal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Vida Útil (anos)</Label>
              <Input
                data-ocid="patrimonio.life.input"
                placeholder="5"
                value={form.life}
                onChange={(e) =>
                  setForm((f) => ({ ...f, life: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Taxa Depreciação (%/ano)</Label>
              <Input
                data-ocid="patrimonio.rate.input"
                placeholder="20"
                value={form.rate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Número de Série</Label>
              <Input
                placeholder="Ex: SN123456789"
                value={form.serie ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, serie: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Localização Física</Label>
              <Input
                placeholder="Ex: Sala 3 - 2º andar"
                value={form.localizacao ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, localizacao: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input
                placeholder="Nome do responsável"
                value={form.responsavel ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, responsavel: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Input
                placeholder="Nome do fornecedor"
                value={form.fornecedor ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fornecedor: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Número NF</Label>
              <Input
                placeholder="Ex: 000.456"
                value={form.numeroNF ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, numeroNF: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Totalmente Depreciado">
                    Totalmente Depreciado
                  </SelectItem>
                  <SelectItem value="Em Manutenção">Em Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Informações adicionais..."
                rows={3}
                value={form.observacoes ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, observacoes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveBem} data-ocid="patrimonio.save_button">
              {editingBem ? "Salvar Alterações" : "Cadastrar Bem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Nova Categoria Dialog ─────────────────────────────────────── */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da categoria</Label>
              <Input
                placeholder="Ex: Máquinas Industriais"
                value={catForm.name}
                onChange={(e) =>
                  setCatForm((f) => ({ ...f, name: e.target.value }))
                }
                data-ocid="patrimonio.cat_name.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Taxa de depreciação (%/ano)</Label>
              <Input
                placeholder="10"
                value={catForm.rate}
                onChange={(e) =>
                  setCatForm((f) => ({ ...f, rate: e.target.value }))
                }
                data-ocid="patrimonio.cat_rate.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Vida útil (anos)</Label>
              <Input
                placeholder="10"
                value={catForm.life}
                onChange={(e) =>
                  setCatForm((f) => ({ ...f, life: e.target.value }))
                }
                data-ocid="patrimonio.cat_life.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={saveCategoria}
              data-ocid="patrimonio.cat_save.button"
            >
              Criar Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Ficha Técnica Sheet ───────────────────────────────────────── */}

      {/* ── Laudo Sheet ──────────────────────────────────────────────────── */}
      <Sheet open={laudoOpen} onOpenChange={setLaudoOpen}>
        <SheetContent
          side="right"
          className="w-[600px] sm:max-w-[600px] overflow-y-auto"
        >
          <SheetHeader className="mb-6">
            <SheetTitle>Laudos de Avaliação — NBC TG 27</SheetTitle>
          </SheetHeader>
          <div className="space-y-6">
            {bens
              .filter(
                (b) => b.status === "Ativo" || b.status === "Em Manutenção",
              )
              .slice(0, 5)
              .map((b) => {
                const rateNum = Number.parseFloat(b.rate) / 100 || 0.2;
                const depAnual = b.original * rateNum;
                const depMensal = depAnual / 12;
                return (
                  <div
                    key={b.id}
                    className="border border-border rounded-lg p-5 space-y-3"
                  >
                    {/* Cabeçalho */}
                    <div className="text-center border-b border-border pb-3">
                      <p className="font-bold text-white text-base">
                        LAUDO DE AVALIAÇÃO DE BEM IMOBILIZADO
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ContaFácil Contabilidade LTDA | CNPJ: 00.000.000/0001-00
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Data de emissão:{" "}
                        {new Date().toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {/* Identificação */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Código:
                        </span>
                        <p className="text-white font-mono">{b.code}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Status:
                        </span>
                        <p className="text-white">{b.status}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground text-xs">
                          Descrição:
                        </span>
                        <p className="text-white font-semibold">{b.desc}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Grupo:
                        </span>
                        <p className="text-white">{b.group}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Data de Aquisição:
                        </span>
                        <p className="text-white">{b.acquisition}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Vida Útil:
                        </span>
                        <p className="text-white">{b.life}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Taxa de Depreciação:
                        </span>
                        <p className="text-orange-400 font-semibold">
                          {b.rate}/ano
                        </p>
                      </div>
                      {b.localizacao && (
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Localização:
                          </span>
                          <p className="text-white">{b.localizacao}</p>
                        </div>
                      )}
                      {b.responsavel && (
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Responsável:
                          </span>
                          <p className="text-white">{b.responsavel}</p>
                        </div>
                      )}
                    </div>
                    {/* Valores */}
                    <div className="bg-white/5 rounded-lg p-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Valor Original:
                        </span>
                        <p className="text-white font-bold">
                          {b.original.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Dep. Acumulada:
                        </span>
                        <p className="text-orange-400 font-bold">
                          {b.accumulated.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Valor Líquido Contábil:
                        </span>
                        <p className="text-green-400 font-bold">
                          {b.current.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Dep. Mensal (Linha Reta):
                        </span>
                        <p className="text-white">
                          {depMensal.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      </div>
                    </div>
                    {/* Método */}
                    <div className="text-xs text-muted-foreground bg-blue-500/5 border border-blue-500/20 rounded p-2">
                      <p>
                        <strong className="text-white">Método:</strong>{" "}
                        Depreciação pelo Método da Linha Reta (SLM) — NBC TG 27,
                        item 62.
                      </p>
                      <p className="mt-1">
                        <strong className="text-white">Valor Residual:</strong>{" "}
                        10% do valor original ={" "}
                        {(b.original * 0.1).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                      {b.observacoes && (
                        <p className="mt-1">
                          <strong className="text-white">Observações:</strong>{" "}
                          {b.observacoes}
                        </p>
                      )}
                    </div>
                    {/* Assinatura */}
                    <div className="border-t border-border pt-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        _______________________________________
                      </p>
                      <p className="text-xs text-white font-medium mt-1">
                        Contador Responsável
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CRC/XX 000.000/O-0
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      data-ocid="patrimonio.print.button"
                      onClick={() =>
                        toast.success(
                          "Exportação do laudo iniciada (simulado).",
                        )
                      }
                    >
                      <Printer className="w-3 h-3 mr-2" /> Imprimir / Exportar
                      PDF
                    </Button>
                  </div>
                );
              })}
            {bens.filter(
              (b) => b.status === "Ativo" || b.status === "Em Manutenção",
            ).length === 0 && (
              <p
                className="text-center text-muted-foreground text-sm py-12"
                data-ocid="patrimonio.laudos.empty_state"
              >
                Nenhum bem ativo para gerar laudo.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={fichaOpen} onOpenChange={setFichaOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto p-0"
          data-ocid="patrimonio.ficha.sheet"
        >
          {fichaBem && (
            <FichaTecnica
              bem={fichaBem}
              onEdit={() => {
                setFichaOpen(false);
                openEdit(fichaBem);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Ficha Técnica Component ───────────────────────────────────────────────

function FichaTecnica({
  bem,
  onEdit,
}: {
  bem: PatrimonioBem;

  onEdit: () => void;
}) {
  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusColor = (s: string) => {
    if (s === "Ativo")
      return "bg-green-500/20 text-green-400 border-green-500/30";
    if (s === "Totalmente Depreciado")
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    if (s === "Em Manutenção")
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  };

  const depPercent =
    bem.original > 0 ? Math.round((bem.accumulated / bem.original) * 100) : 0;
  const timeline = buildDepreciationTimeline(bem);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <SheetHeader className="p-6 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
                {bem.code}
              </span>
              <Badge className={`text-xs ${statusColor(bem.status)}`}>
                {bem.status}
              </Badge>
            </div>
            <SheetTitle className="text-lg text-white leading-tight">
              {bem.desc}
            </SheetTitle>
          </div>
          <div className="flex gap-2 mt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              data-ocid="patrimonio.ficha.edit_button"
            >
              <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                toast.info("Preparando PDF...");
                window.print();
              }}
              data-ocid="patrimonio.ficha.print_button"
            >
              <Printer className="w-3.5 h-3.5 mr-1" /> PDF
            </Button>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Informações gerais */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Informações do Bem
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {[
              ["Grupo", bem.group],
              ["Data Aquisição", bem.acquisition],
              ["Fornecedor", bem.fornecedor || "—"],
              ["Nota Fiscal", bem.numeroNF || "—"],
              ["Número de Série", bem.serie || "—"],
              ["Localização", bem.localizacao || "—"],
              ["Responsável", bem.responsavel || "—"],
              ["Cliente", bem.cliente || "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm text-white font-medium">{value}</p>
              </div>
            ))}
          </div>
          {bem.observacoes && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">Observações</p>
              <p className="text-sm text-white mt-0.5">{bem.observacoes}</p>
            </div>
          )}
        </div>

        {/* Resumo financeiro */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Resumo Financeiro
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/5 border border-border p-3">
              <p className="text-xs text-muted-foreground">Valor Original</p>
              <p className="text-base font-bold text-white mt-1">
                {fmt(bem.original)}
              </p>
            </div>
            <div className="rounded-lg bg-orange-500/5 border border-orange-500/20 p-3">
              <p className="text-xs text-muted-foreground">Dep. Acumulada</p>
              <p className="text-base font-bold text-orange-400 mt-1">
                {fmt(bem.accumulated)}
              </p>
              <p className="text-xs text-muted-foreground">
                {depPercent}% do original
              </p>
            </div>
            <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3">
              <p className="text-xs text-muted-foreground">
                Valor Líquido Contábil
              </p>
              <p className="text-base font-bold text-green-400 mt-1">
                {fmt(bem.current)}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 border border-border p-3">
              <p className="text-xs text-muted-foreground">
                Taxa / Mês Competência
              </p>
              <p className="text-base font-bold text-white mt-1">{bem.rate}</p>
              <p className="text-xs text-muted-foreground">Mar/2026</p>
            </div>
          </div>
        </div>

        {/* Timeline de depreciação */}
        {timeline.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Timeline de Depreciação
            </h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-white/5">
                    <th className="text-left px-3 py-2 text-muted-foreground">
                      Ano
                    </th>
                    <th className="text-right px-3 py-2 text-muted-foreground">
                      Valor Inicial
                    </th>
                    <th className="text-right px-3 py-2 text-muted-foreground">
                      Dep. Anual
                    </th>
                    <th className="text-right px-3 py-2 text-muted-foreground">
                      Valor Final
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.map((row) => (
                    <tr
                      key={row.year}
                      className="border-b border-border/50 hover:bg-white/3"
                    >
                      <td className="px-3 py-2 text-white">{row.year}º ano</td>
                      <td className="px-3 py-2 text-right text-white">
                        {fmt(row.start)}
                      </td>
                      <td className="px-3 py-2 text-right text-orange-400">
                        {fmt(row.dep)}
                      </td>
                      <td className="px-3 py-2 text-right text-green-400">
                        {fmt(row.end)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Suppress unused import warning
const _cell = Cell;
void _cell;
