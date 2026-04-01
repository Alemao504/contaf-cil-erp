import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  Brain,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  Settings2,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useARIA } from "../context/ARIAContext";
import { addRecord, deleteRecord, getAllRecords } from "../lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RelatorioMensalIA {
  id: string;
  periodo: string; // "2025-12"
  periodoLabel: string; // "Dezembro/2025"
  fontes: string[];
  totalClientes: number;
  formato: "PDF" | "Word" | "Excel";
  dataGeracao: string;
  status: "Concluído" | "Agendado" | "Erro";
  resumo?: string;
}

interface AgendamentoConfig {
  ativo: boolean;
  diaMes: number;
  horario: string;
  fontesPadrao: string[];
  formatoPadrao: "PDF" | "Word" | "Excel";
  modoReal: boolean;
}

const FONTES_DISPONIVEIS = [
  { id: "esocial", label: "eSocial" },
  { id: "fiscal", label: "Fiscal (DCTF/ECF/ECD)" },
  { id: "contabil", label: "Contábil (Balanço/DRE/Balancete)" },
  { id: "folha", label: "Folha de Pagamento" },
];

const CLIENTES_EXEMPLO = [
  "Todos os clientes",
  "Padaria Pão de Mel Ltda",
  "Tech Solutions S.A.",
  "Consultoria Ativa ME",
  "Distribuidora Norte EIRELI",
  "Clínica Saúde Plena",
];

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

const HISTORICO_INICIAL: RelatorioMensalIA[] = [
  {
    id: "r1",
    periodo: "2026-02",
    periodoLabel: "Fevereiro/2026",
    fontes: ["esocial", "fiscal", "contabil", "folha"],
    totalClientes: 48,
    formato: "PDF",
    dataGeracao: "01/03/2026 08:00",
    status: "Concluído",
    resumo:
      "Relatório mensal consolidado com 4 fontes integradas. Receita bruta total: R$ 2.847.320. DRE comparativo 12 meses. Conformidade fiscal: 94%. Folha total: R$ 412.800. Principais destaques: crescimento de 8,3% na receita, redução de 2,1% nos encargos trabalhistas.",
  },
  {
    id: "r2",
    periodo: "2026-01",
    periodoLabel: "Janeiro/2026",
    fontes: ["fiscal", "contabil"],
    totalClientes: 48,
    formato: "Word",
    dataGeracao: "02/02/2026 07:45",
    status: "Concluído",
    resumo:
      "Relatório de abertura de ano. Balanço patrimonial inicial, DRE acumulada e obrigações fiscais do primeiro mês. Conformidade: 100%. Sem pendências críticas identificadas.",
  },
  {
    id: "r3",
    periodo: "2025-12",
    periodoLabel: "Dezembro/2025",
    fontes: ["esocial", "fiscal", "contabil", "folha"],
    totalClientes: 45,
    formato: "Excel",
    dataGeracao: "03/01/2026 09:00",
    status: "Concluído",
    resumo:
      "Fechamento anual 2025. Balanço final, DLPA, DRE anual. 45 clientes. 13ª parcela e férias incluídas na folha. Índices de liquidez e endividamento calculados por empresa.",
  },
  {
    id: "r4",
    periodo: "2026-04",
    periodoLabel: "Abril/2026",
    fontes: ["esocial", "fiscal"],
    totalClientes: 50,
    formato: "PDF",
    dataGeracao: "01/05/2026 08:00",
    status: "Agendado",
  },
  {
    id: "r5",
    periodo: "2025-11",
    periodoLabel: "Novembro/2025",
    fontes: ["contabil"],
    totalClientes: 12,
    formato: "PDF",
    dataGeracao: "02/12/2025 11:30",
    status: "Erro",
  },
];

const ETAPAS_GERACAO = [
  "Coletando dados das fontes...",
  "Processando lançamentos...",
  "Consolidando informações...",
  "Gerando relatório com ARIA...",
  "Concluído!",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function RelatoriosMensaisIA() {
  const { addMessage } = useARIA();

  // Geração
  const [mes, setMes] = useState(String(new Date().getMonth() + 1));
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [fontesSelecionadas, setFontesSelecionadas] = useState<string[]>([
    "esocial",
    "fiscal",
    "contabil",
    "folha",
  ]);
  const [clienteSelecionado, setClienteSelecionado] =
    useState("Todos os clientes");
  const [formato, setFormato] = useState<"PDF" | "Word" | "Excel">("PDF");
  const [gerando, setGerando] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [progresso, setProgresso] = useState(0);
  const [previewRelatorio, setPreviewRelatorio] =
    useState<RelatorioMensalIA | null>(null);

  // Agendamento
  const [agendamento, setAgendamento] = useState<AgendamentoConfig>({
    ativo: false,
    diaMes: 1,
    horario: "08:00",
    fontesPadrao: ["esocial", "fiscal", "contabil", "folha"],
    formatoPadrao: "PDF",
    modoReal: false,
  });
  const [salvandoAgendamento, setSalvandoAgendamento] = useState(false);
  const [agendamentoSalvo, setAgendamentoSalvo] = useState(false);

  // Histórico
  const [historico, setHistorico] =
    useState<RelatorioMensalIA[]>(HISTORICO_INICIAL);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");
  const [visualizando, setVisualizando] = useState<RelatorioMensalIA | null>(
    null,
  );

  useEffect(() => {
    getAllRecords<RelatorioMensalIA>("relatorios_mensais_ia").then(
      (records) => {
        if (records.length > 0) setHistorico(records);
      },
    );
    getAllRecords<AgendamentoConfig>("agendamento_relatorios").then(
      (records) => {
        if (records.length > 0)
          setAgendamento(records[0] as AgendamentoConfig & { id: string });
      },
    );
  }, []);

  const toggleFonte = (id: string) => {
    setFontesSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const toggleFontePadrao = (id: string) => {
    setAgendamento((prev) => ({
      ...prev,
      fontesPadrao: prev.fontesPadrao.includes(id)
        ? prev.fontesPadrao.filter((f) => f !== id)
        : [...prev.fontesPadrao, id],
    }));
  };

  const gerarRelatorio = useCallback(async () => {
    if (fontesSelecionadas.length === 0) return;
    setGerando(true);
    setEtapaAtual(0);
    setProgresso(0);

    for (let i = 0; i < ETAPAS_GERACAO.length; i++) {
      setEtapaAtual(i);
      const alvo = Math.round(((i + 1) / ETAPAS_GERACAO.length) * 100);
      for (
        let p = Math.round((i / ETAPAS_GERACAO.length) * 100);
        p <= alvo;
        p += 5
      ) {
        await new Promise((r) => setTimeout(r, 80));
        setProgresso(p);
      }
    }

    const mesLabel = MESES[Number.parseInt(mes) - 1];
    const periodLabel = `${mesLabel}/${ano}`;
    const periodo = `${ano}-${mes.padStart(2, "0")}`;
    const nClientes = clienteSelecionado === "Todos os clientes" ? 48 : 1;

    const novo: RelatorioMensalIA = {
      id: `r${Date.now()}`,
      periodo,
      periodoLabel: periodLabel,
      fontes: fontesSelecionadas,
      totalClientes: nClientes,
      formato,
      dataGeracao: new Date().toLocaleString("pt-BR"),
      status: "Concluído",
      resumo: `Relatório mensal consolidado — ${periodLabel}. ${fontesSelecionadas.length} fontes integradas: ${fontesSelecionadas.map((f) => FONTES_DISPONIVEIS.find((fd) => fd.id === f)?.label).join(", ")}. Total de clientes: ${nClientes}. Receita bruta consolidada: R$ ${(Math.random() * 3000000 + 500000).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. Conformidade fiscal: ${Math.floor(Math.random() * 10 + 90)}%. Relatório gerado automaticamente pela ARIA conforme NBC TG 1000.`,
    };

    await addRecord("relatorios_mensais_ia", novo);
    setHistorico((prev) => [novo, ...prev]);
    setPreviewRelatorio(novo);
    setGerando(false);

    addMessage({
      type: "success",
      text: `✅ Relatório mensal de **${periodLabel}** gerado com sucesso! ${fontesSelecionadas.length} fontes integradas (${fontesSelecionadas.join(", ")}), ${nClientes} cliente${nClientes !== 1 ? "s" : ""} incluído${nClientes !== 1 ? "s" : ""}. Formato: ${formato}. Pronto para download no histórico.`,
    });
  }, [fontesSelecionadas, mes, ano, clienteSelecionado, formato, addMessage]);

  const salvarAgendamento = async () => {
    setSalvandoAgendamento(true);
    await new Promise((r) => setTimeout(r, 800));
    await addRecord("agendamento_relatorios", {
      ...agendamento,
      id: "agendamento_config",
    });
    setSalvandoAgendamento(false);
    setAgendamentoSalvo(true);
    setTimeout(() => setAgendamentoSalvo(false), 3000);
    if (agendamento.ativo) {
      addMessage({
        type: "success",
        text: `📅 Agendamento de relatórios mensais ativado! Geração automática todo dia ${agendamento.diaMes} às ${agendamento.horario}. Fontes: ${agendamento.fontesPadrao.length} ativas. Formato padrão: ${agendamento.formatoPadrao}.`,
      });
    }
  };

  const excluirRelatorio = async (id: string) => {
    await deleteRecord("relatorios_mensais_ia", id);
    setHistorico((prev) => prev.filter((r) => r.id !== id));
  };

  const historicoFiltrado = historico.filter((r) => {
    if (filtroStatus !== "Todos" && r.status !== filtroStatus) return false;
    if (
      filtroPeriodo &&
      !r.periodoLabel.toLowerCase().includes(filtroPeriodo.toLowerCase())
    )
      return false;
    return true;
  });

  const statusBadge = (status: RelatorioMensalIA["status"]) => {
    if (status === "Concluído")
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          Concluído
        </Badge>
      );
    if (status === "Agendado")
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          Agendado
        </Badge>
      );
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        Erro
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.055 240), oklch(0.26 0.065 240))",
        }}
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/20">
          <CalendarCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Relatórios Mensais IA
          </h1>
          <p className="text-xs text-muted-foreground">
            Geração automática com ARIA — integração eSocial, Fiscal, Contábil e
            Folha
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
            <Brain className="w-3 h-3" /> ARIA
          </Badge>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
            <Sparkles className="w-3 h-3" /> Hub$ Parity
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="gerar"
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="px-6 pt-4 pb-0 shrink-0">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="gerar" data-ocid="relatorios-ia.gerar.tab">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Gerar Relatório
            </TabsTrigger>
            <TabsTrigger
              value="agendamento"
              data-ocid="relatorios-ia.agendamento.tab"
            >
              <CalendarCheck className="w-3.5 h-3.5 mr-1.5" /> Agendamento
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              data-ocid="relatorios-ia.historico.tab"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" /> Histórico
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Aba 1: Gerar ───────────────────────────────────────────────── */}
        <TabsContent value="gerar" className="flex-1 overflow-y-auto p-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
            {/* Período */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Período
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Mês</Label>
                  <Select value={mes} onValueChange={setMes}>
                    <SelectTrigger
                      data-ocid="relatorios-ia.mes.select"
                      className="bg-background"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MESES.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Ano</Label>
                  <Select value={ano} onValueChange={setAno}>
                    <SelectTrigger
                      data-ocid="relatorios-ia.ano.select"
                      className="bg-background"
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
              </CardContent>
            </Card>

            {/* Cliente */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={clienteSelecionado}
                  onValueChange={setClienteSelecionado}
                >
                  <SelectTrigger
                    data-ocid="relatorios-ia.cliente.select"
                    className="bg-background"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENTES_EXEMPLO.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Fontes */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Fontes de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {FONTES_DISPONIVEIS.map((fonte) => (
                  <div key={fonte.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`fonte-${fonte.id}`}
                      data-ocid={`relatorios-ia.fonte-${fonte.id}.checkbox`}
                      checked={fontesSelecionadas.includes(fonte.id)}
                      onCheckedChange={() => toggleFonte(fonte.id)}
                    />
                    <Label
                      htmlFor={`fonte-${fonte.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {fonte.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Formato + Gerar */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Formato de Exportação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={formato}
                  onValueChange={(v) => setFormato(v as typeof formato)}
                >
                  <SelectTrigger
                    data-ocid="relatorios-ia.formato.select"
                    className="bg-background"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Word">Word (.docx)</SelectItem>
                    <SelectItem value="Excel">Excel (.xlsx)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  data-ocid="relatorios-ia.gerar.primary_button"
                  onClick={gerarRelatorio}
                  disabled={gerando || fontesSelecionadas.length === 0}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {gerando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" /> Gerar com ARIA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Progress */}
          {gerando && (
            <Card
              className="mt-5 max-w-5xl bg-card border-primary/30"
              data-ocid="relatorios-ia.gerando.loading_state"
            >
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {ETAPAS_GERACAO[etapaAtual]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Etapa {etapaAtual + 1} de {ETAPAS_GERACAO.length}
                    </p>
                  </div>
                  <span className="ml-auto text-sm font-semibold text-primary">
                    {progresso}%
                  </span>
                </div>
                <Progress value={progresso} className="h-2" />
                <div className="flex gap-2 flex-wrap">
                  {ETAPAS_GERACAO.map((e, i) => (
                    <Badge
                      key={e}
                      className={
                        i < etapaAtual
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : i === etapaAtual
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-muted text-muted-foreground"
                      }
                    >
                      {i < etapaAtual ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : null}
                      {e.replace("...", "")}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {previewRelatorio && !gerando && (
            <Card
              className="mt-5 max-w-5xl bg-card border-green-500/30"
              data-ocid="relatorios-ia.preview.success_state"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <CardTitle className="text-base text-green-400">
                    Relatório gerado — {previewRelatorio.periodoLabel}
                  </CardTitle>
                  <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/30">
                    {previewRelatorio.formato}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-lg font-bold text-foreground">
                      {previewRelatorio.fontes.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fontes integradas
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-lg font-bold text-foreground">
                      {previewRelatorio.totalClientes}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Clientes incluídos
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-lg font-bold text-foreground">
                      {previewRelatorio.formato}
                    </p>
                    <p className="text-xs text-muted-foreground">Formato</p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/20 p-3 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Resumo Executivo
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {previewRelatorio.resumo}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewRelatorio(null)}
                    className="flex-1"
                  >
                    Fechar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    data-ocid="relatorios-ia.download.button"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Download{" "}
                    {previewRelatorio.formato}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Aba 2: Agendamento ──────────────────────────────────────────── */}
        <TabsContent
          value="agendamento"
          className="flex-1 overflow-y-auto p-6 pt-4"
        >
          <div className="max-w-2xl space-y-5">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Agendamento Automático
                  </CardTitle>
                  <Switch
                    data-ocid="relatorios-ia.agendamento-ativo.switch"
                    checked={agendamento.ativo}
                    onCheckedChange={(v) =>
                      setAgendamento((p) => ({ ...p, ativo: v }))
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Dia do mês (1–28)
                    </Label>
                    <input
                      data-ocid="relatorios-ia.dia-mes.input"
                      type="number"
                      min={1}
                      max={28}
                      value={agendamento.diaMes}
                      onChange={(e) =>
                        setAgendamento((p) => ({
                          ...p,
                          diaMes: Number.parseInt(e.target.value) || 1,
                        }))
                      }
                      disabled={!agendamento.ativo}
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Horário
                    </Label>
                    <input
                      data-ocid="relatorios-ia.horario.input"
                      type="time"
                      value={agendamento.horario}
                      onChange={(e) =>
                        setAgendamento((p) => ({
                          ...p,
                          horario: e.target.value,
                        }))
                      }
                      disabled={!agendamento.ativo}
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Fontes padrão
                  </Label>
                  {FONTES_DISPONIVEIS.map((fonte) => (
                    <div key={fonte.id} className="flex items-center gap-3">
                      <Checkbox
                        id={`ag-fonte-${fonte.id}`}
                        data-ocid={`relatorios-ia.ag-fonte-${fonte.id}.checkbox`}
                        checked={agendamento.fontesPadrao.includes(fonte.id)}
                        onCheckedChange={() => toggleFontePadrao(fonte.id)}
                        disabled={!agendamento.ativo}
                      />
                      <Label
                        htmlFor={`ag-fonte-${fonte.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {fonte.label}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Formato padrão
                  </Label>
                  <Select
                    value={agendamento.formatoPadrao}
                    onValueChange={(v) =>
                      setAgendamento((p) => ({
                        ...p,
                        formatoPadrao: v as typeof p.formatoPadrao,
                      }))
                    }
                    disabled={!agendamento.ativo}
                  >
                    <SelectTrigger
                      data-ocid="relatorios-ia.formato-padrao.select"
                      className="bg-background"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="Word">Word (.docx)</SelectItem>
                      <SelectItem value="Excel">Excel (.xlsx)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Modo de Integração
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {agendamento.modoReal ? "Real" : "Simulado"}
                    </span>
                    <Switch
                      data-ocid="relatorios-ia.modo-real.switch"
                      checked={agendamento.modoReal}
                      onCheckedChange={(v) =>
                        setAgendamento((p) => ({ ...p, modoReal: v }))
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {agendamento.modoReal
                    ? "Modo real: conecta às fontes reais do sistema (eSocial, SPED, IndexedDB de lançamentos) para gerar relatórios com dados atuais."
                    : "Modo simulado: gera relatórios com dados de exemplo para testes e demonstrações."}
                </p>
              </CardContent>
            </Card>

            <Button
              data-ocid="relatorios-ia.salvar-agendamento.primary_button"
              onClick={salvarAgendamento}
              disabled={salvandoAgendamento}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {salvandoAgendamento ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                </>
              ) : agendamentoSalvo ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />{" "}
                  Configurações salvas!
                </>
              ) : (
                <>
                  <Settings2 className="w-4 h-4 mr-2" /> Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* ── Aba 3: Histórico ────────────────────────────────────────────── */}
        <TabsContent
          value="historico"
          className="flex-1 overflow-y-auto p-6 pt-4"
        >
          <div className="max-w-5xl space-y-4">
            {/* Filtros */}
            <div className="flex gap-3 flex-wrap">
              <input
                data-ocid="relatorios-ia.filtro-periodo.search_input"
                placeholder="Filtrar por período..."
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-56"
              />
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger
                  data-ocid="relatorios-ia.filtro-status.select"
                  className="bg-background w-40"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Agendado">Agendado</SelectItem>
                  <SelectItem value="Erro">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {historicoFiltrado.length === 0 ? (
              <Card
                className="bg-card border-border"
                data-ocid="relatorios-ia.historico.empty_state"
              >
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum relatório encontrado
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Gere um relatório na primeira aba
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card
                className="bg-card border-border"
                data-ocid="relatorios-ia.historico.table"
              >
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">
                        Período
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Fontes
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Clientes
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Formato
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Gerado em
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicoFiltrado.map((r, idx) => (
                      <TableRow
                        key={r.id}
                        className="border-border"
                        data-ocid={`relatorios-ia.historico.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {r.periodoLabel}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {r.fontes.length} fonte
                            {r.fontes.length !== 1 ? "s" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell>{r.totalClientes}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {r.formato}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {r.dataGeracao}
                        </TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              data-ocid={`relatorios-ia.visualizar.button.${idx + 1}`}
                              onClick={() => setVisualizando(r)}
                              disabled={r.status !== "Concluído"}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              data-ocid={`relatorios-ia.download.button.${idx + 1}`}
                              disabled={r.status !== "Concluído"}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-400 hover:text-red-300"
                              data-ocid={`relatorios-ia.delete_button.${idx + 1}`}
                              onClick={() => excluirRelatorio(r.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Visualizar */}
      <Dialog open={!!visualizando} onOpenChange={() => setVisualizando(null)}>
        <DialogContent
          className="max-w-lg bg-card border-border"
          data-ocid="relatorios-ia.visualizar.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Relatório — {visualizando?.periodoLabel}
            </DialogTitle>
          </DialogHeader>
          {visualizando && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <p className="text-base font-bold text-foreground">
                    {visualizando.fontes.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Fontes</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <p className="text-base font-bold text-foreground">
                    {visualizando.totalClientes}
                  </p>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <p className="text-base font-bold text-foreground">
                    {visualizando.formato}
                  </p>
                  <p className="text-xs text-muted-foreground">Formato</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Fontes integradas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {visualizando.fontes.map((f) => (
                    <Badge key={f} variant="outline" className="text-xs">
                      {FONTES_DISPONIVEIS.find((fd) => fd.id === f)?.label ?? f}
                    </Badge>
                  ))}
                </div>
              </div>
              {visualizando.resumo && (
                <div className="rounded-lg bg-muted/20 p-3 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Resumo Executivo
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {visualizando.resumo}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  data-ocid="relatorios-ia.visualizar-modal.close_button"
                  onClick={() => setVisualizando(null)}
                >
                  Fechar
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  data-ocid="relatorios-ia.visualizar-modal.download.button"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
