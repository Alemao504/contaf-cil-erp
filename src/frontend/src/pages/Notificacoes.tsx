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
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  History,
  Mail,
  Plus,
  Send,
  Settings,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import { getAllRecords, getRecord, putRecord } from "../lib/db";

// ---- Types ----
export interface NotifLembrete {
  id: string;
  clienteId: string;
  clienteNome: string;
  tipo: string;
  descricao: string;
  dataVencimento: string;
  recorrencia: "unica" | "mensal" | "anual";
  status: "pendente" | "enviado" | "vencido";
  criadoEm: string;
}

export interface NotifHistorico {
  id: string;
  lembreteId: string;
  clienteNome: string;
  tipo: string;
  canal: "E-mail" | "Sistema";
  status: "enviado" | "falha";
  enviadoEm: string;
  descricao: string;
}

// ---- Helpers ----
const today = new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatTs(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// ---- Sample data ----
const DEFAULT_LEMBRETES: NotifLembrete[] = [
  {
    id: "nl-1",
    clienteId: "client-1",
    clienteNome: "Empresa Alfa Ltda",
    tipo: "FGTS",
    descricao: "Recolhimento FGTS mensal — competência atual",
    dataVencimento: fmt(addDays(today, -3)),
    recorrencia: "mensal",
    status: "vencido",
    criadoEm: new Date().toISOString(),
  },
  {
    id: "nl-2",
    clienteId: "client-2",
    clienteNome: "Tech Solutions SA",
    tipo: "DARF",
    descricao: "DARF IRPJ trimestral — estimativa",
    dataVencimento: fmt(addDays(today, 2)),
    recorrencia: "mensal",
    status: "pendente",
    criadoEm: new Date().toISOString(),
  },
  {
    id: "nl-3",
    clienteId: "client-3",
    clienteNome: "Construtora Beta Ltda",
    tipo: "Folha de Pagamento",
    descricao: "Processamento e envio folha mensal",
    dataVencimento: fmt(addDays(today, 5)),
    recorrencia: "mensal",
    status: "pendente",
    criadoEm: new Date().toISOString(),
  },
  {
    id: "nl-4",
    clienteId: "client-4",
    clienteNome: "Comercial Gama ME",
    tipo: "SPED Fiscal",
    descricao: "Entrega SPED Fiscal semestral — 1º semestre",
    dataVencimento: fmt(addDays(today, 14)),
    recorrencia: "anual",
    status: "pendente",
    criadoEm: new Date().toISOString(),
  },
  {
    id: "nl-5",
    clienteId: "client-1",
    clienteNome: "Empresa Alfa Ltda",
    tipo: "ECF",
    descricao: "Entrega ECF — Escrituração Contábil Fiscal",
    dataVencimento: fmt(addDays(today, 30)),
    recorrencia: "anual",
    status: "pendente",
    criadoEm: new Date().toISOString(),
  },
  {
    id: "nl-6",
    clienteId: "client-2",
    clienteNome: "Tech Solutions SA",
    tipo: "DEFIS",
    descricao: "Declaração de Informações do Simples Nacional",
    dataVencimento: fmt(addDays(today, 45)),
    recorrencia: "anual",
    status: "pendente",
    criadoEm: new Date().toISOString(),
  },
  {
    id: "nl-7",
    clienteId: "client-3",
    clienteNome: "Construtora Beta Ltda",
    tipo: "DARF",
    descricao: "DARF PIS/COFINS competência anterior",
    dataVencimento: fmt(addDays(today, -10)),
    recorrencia: "mensal",
    status: "vencido",
    criadoEm: new Date().toISOString(),
  },
  {
    id: "nl-8",
    clienteId: "client-5",
    clienteNome: "Serviços Delta EPP",
    tipo: "FGTS",
    descricao: "FGTS rescisório — funcionário demitido",
    dataVencimento: fmt(addDays(today, 1)),
    recorrencia: "unica",
    status: "enviado",
    criadoEm: new Date().toISOString(),
  },
];

const DEFAULT_HISTORICO: NotifHistorico[] = [
  {
    id: "nh-1",
    lembreteId: "nl-8",
    clienteNome: "Serviços Delta EPP",
    tipo: "FGTS",
    canal: "E-mail",
    status: "enviado",
    enviadoEm: new Date(Date.now() - 1 * 3600000).toISOString(),
    descricao: "FGTS rescisório",
  },
  {
    id: "nh-2",
    lembreteId: "nl-1",
    clienteNome: "Empresa Alfa Ltda",
    tipo: "FGTS",
    canal: "Sistema",
    status: "enviado",
    enviadoEm: new Date(Date.now() - 2 * 3600000).toISOString(),
    descricao: "Recolhimento FGTS mensal",
  },
  {
    id: "nh-3",
    lembreteId: "nl-3",
    clienteNome: "Construtora Beta Ltda",
    tipo: "Folha de Pagamento",
    canal: "E-mail",
    status: "enviado",
    enviadoEm: new Date(Date.now() - 5 * 3600000).toISOString(),
    descricao: "Processamento folha mensal",
  },
  {
    id: "nh-4",
    lembreteId: "nl-2",
    clienteNome: "Tech Solutions SA",
    tipo: "DARF",
    canal: "E-mail",
    status: "falha",
    enviadoEm: new Date(Date.now() - 8 * 3600000).toISOString(),
    descricao: "DARF IRPJ trimestral",
  },
  {
    id: "nh-5",
    lembreteId: "nl-4",
    clienteNome: "Comercial Gama ME",
    tipo: "SPED Fiscal",
    canal: "Sistema",
    status: "enviado",
    enviadoEm: new Date(Date.now() - 24 * 3600000).toISOString(),
    descricao: "SPED Fiscal semestral",
  },
  {
    id: "nh-6",
    lembreteId: "nl-5",
    clienteNome: "Empresa Alfa Ltda",
    tipo: "ECF",
    canal: "E-mail",
    status: "enviado",
    enviadoEm: new Date(Date.now() - 48 * 3600000).toISOString(),
    descricao: "Entrega ECF anual",
  },
  {
    id: "nh-7",
    lembreteId: "nl-6",
    clienteNome: "Tech Solutions SA",
    tipo: "DEFIS",
    canal: "Sistema",
    status: "enviado",
    enviadoEm: new Date(Date.now() - 72 * 3600000).toISOString(),
    descricao: "Declaração DEFIS",
  },
  {
    id: "nh-8",
    lembreteId: "nl-7",
    clienteNome: "Construtora Beta Ltda",
    tipo: "DARF",
    canal: "E-mail",
    status: "falha",
    enviadoEm: new Date(Date.now() - 96 * 3600000).toISOString(),
    descricao: "DARF PIS/COFINS",
  },
  {
    id: "nh-9",
    lembreteId: "nl-1",
    clienteNome: "Empresa Alfa Ltda",
    tipo: "FGTS",
    canal: "E-mail",
    status: "enviado",
    enviadoEm: new Date(Date.now() - 120 * 3600000).toISOString(),
    descricao: "Lembrete automático FGTS",
  },
  {
    id: "nh-10",
    lembreteId: "nl-3",
    clienteNome: "Construtora Beta Ltda",
    tipo: "Folha de Pagamento",
    canal: "Sistema",
    status: "enviado",
    enviadoEm: new Date(Date.now() - 144 * 3600000).toISOString(),
    descricao: "Folha competência anterior",
  },
];

const TIPOS = [
  "DARF",
  "FGTS",
  "Folha de Pagamento",
  "SPED Fiscal",
  "ECF",
  "DEFIS",
  "eSocial",
  "DCTFWeb",
  "Outro",
];

const SAMPLE_CLIENTS = [
  { id: "client-1", name: "Empresa Alfa Ltda" },
  { id: "client-2", name: "Tech Solutions SA" },
  { id: "client-3", name: "Construtora Beta Ltda" },
  { id: "client-4", name: "Comercial Gama ME" },
  { id: "client-5", name: "Serviços Delta EPP" },
];

function statusBadge(status: NotifLembrete["status"]) {
  if (status === "pendente")
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        Pendente
      </Badge>
    );
  if (status === "enviado")
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        Enviado
      </Badge>
    );
  return (
    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
      Vencido
    </Badge>
  );
}

interface NotifConfig {
  key: string;
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  ariaAutoNotif: boolean;
  alertDays: number;
}

const DEFAULT_CONFIG: NotifConfig = {
  key: "notif_config",
  emailEnabled: false,
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPass: "",
  ariaAutoNotif: true,
  alertDays: 3,
};

export default function Notificacoes() {
  const { addMessage, setIsChatOpen } = useARIA();

  const [lembretes, setLembretes] = useState<NotifLembrete[]>([]);
  const [historico, setHistorico] = useState<NotifHistorico[]>([]);
  const [config, setConfig] = useState<NotifConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  const [filterCliente, setFilterCliente] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [hFilterCliente, setHFilterCliente] = useState("");
  const [hFilterCanal, setHFilterCanal] = useState("all");
  const [hFilterStatus, setHFilterStatus] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    clienteId: "",
    tipo: "",
    descricao: "",
    dataVencimento: fmt(addDays(today, 7)),
    recorrencia: "unica" as NotifLembrete["recorrencia"],
  });

  const ariaFiredRef = useRef(false);

  useEffect(() => {
    async function load() {
      try {
        const [stored, hist, cfg] = await Promise.all([
          getAllRecords<NotifLembrete>("notificacoes_lembretes"),
          getAllRecords<NotifHistorico>("notificacoes_historico"),
          getRecord<NotifConfig>("configuracoes", "notif_config"),
        ]);

        if (stored.length === 0) {
          for (const l of DEFAULT_LEMBRETES)
            await putRecord("notificacoes_lembretes", l);
          setLembretes(DEFAULT_LEMBRETES);
        } else {
          setLembretes(stored);
        }

        if (hist.length === 0) {
          for (const h of DEFAULT_HISTORICO)
            await putRecord("notificacoes_historico", h);
          setHistorico(DEFAULT_HISTORICO);
        } else {
          setHistorico(hist);
        }

        if (cfg) setConfig(cfg as NotifConfig);
      } catch {
        setLembretes(DEFAULT_LEMBRETES);
        setHistorico(DEFAULT_HISTORICO);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (loading || ariaFiredRef.current || lembretes.length === 0) return;
    if (!config.ariaAutoNotif) return;
    ariaFiredRef.current = true;

    const cfgDays = config.alertDays ?? 3;
    const vencidos = lembretes.filter(
      (l) => l.status !== "enviado" && daysUntil(l.dataVencimento) < 0,
    );
    const proximos = lembretes.filter(
      (l) =>
        l.status === "pendente" &&
        daysUntil(l.dataVencimento) >= 0 &&
        daysUntil(l.dataVencimento) <= cfgDays,
    );

    if (vencidos.length === 0 && proximos.length === 0) return;

    setIsChatOpen(true);
    let delay = 300;

    for (const l of proximos) {
      const d = daysUntil(l.dataVencimento);
      const dLabel = d === 0 ? "hoje" : `${d} dia${d > 1 ? "s" : ""}`;
      const captured = l;
      setTimeout(() => {
        addMessage({
          type: "warning",
          text: `⚠️ ${captured.clienteNome} tem ${captured.tipo} vencendo em ${dLabel} (${formatDate(captured.dataVencimento)})`,
        });
      }, delay);
      delay += 400;
    }

    for (const l of vencidos) {
      const captured = l;
      setTimeout(() => {
        addMessage({
          type: "error",
          text: `❌ Lembrete vencido: ${captured.tipo} de ${captured.clienteNome} estava previsto para ${formatDate(captured.dataVencimento)}`,
        });
      }, delay);
      delay += 400;
    }
  }, [
    loading,
    lembretes,
    config.ariaAutoNotif,
    config.alertDays,
    addMessage,
    setIsChatOpen,
  ]);

  const saveConfig = useCallback(async (next: NotifConfig) => {
    setConfig(next);
    try {
      await putRecord("configuracoes", next);
    } catch {}
  }, []);

  const handleSend = useCallback(
    async (lembrete: NotifLembrete) => {
      const updated: NotifLembrete = { ...lembrete, status: "enviado" };
      await putRecord("notificacoes_lembretes", updated);
      setLembretes((prev) =>
        prev.map((l) => (l.id === lembrete.id ? updated : l)),
      );

      const hist: NotifHistorico = {
        id: `nh-${Date.now()}`,
        lembreteId: lembrete.id,
        clienteNome: lembrete.clienteNome,
        tipo: lembrete.tipo,
        canal: config.emailEnabled ? "E-mail" : "Sistema",
        status: "enviado",
        enviadoEm: new Date().toISOString(),
        descricao: lembrete.descricao,
      };
      await putRecord("notificacoes_historico", hist);
      setHistorico((prev) => [hist, ...prev]);
      toast.success(`Notificação enviada para ${lembrete.clienteNome}`);
    },
    [config.emailEnabled],
  );

  const handleNewLembrete = useCallback(async () => {
    if (!form.clienteId || !form.tipo || !form.dataVencimento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const client = SAMPLE_CLIENTS.find((c) => c.id === form.clienteId);
    const novo: NotifLembrete = {
      id: `nl-${Date.now()}`,
      clienteId: form.clienteId,
      clienteNome: client?.name ?? form.clienteId,
      tipo: form.tipo,
      descricao: form.descricao || `${form.tipo} — ${client?.name}`,
      dataVencimento: form.dataVencimento,
      recorrencia: form.recorrencia,
      status: "pendente",
      criadoEm: new Date().toISOString(),
    };
    await putRecord("notificacoes_lembretes", novo);
    setLembretes((prev) => [...prev, novo]);
    setModalOpen(false);
    setForm({
      clienteId: "",
      tipo: "",
      descricao: "",
      dataVencimento: fmt(addDays(today, 7)),
      recorrencia: "unica",
    });
    toast.success("Lembrete criado com sucesso");
  }, [form]);

  const filteredLembretes = lembretes.filter((l) => {
    if (
      filterCliente &&
      !l.clienteNome.toLowerCase().includes(filterCliente.toLowerCase())
    )
      return false;
    if (filterTipo !== "all" && l.tipo !== filterTipo) return false;
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    return true;
  });

  const filteredHistorico = historico.filter((h) => {
    if (
      hFilterCliente &&
      !h.clienteNome.toLowerCase().includes(hFilterCliente.toLowerCase())
    )
      return false;
    if (hFilterCanal !== "all" && h.canal !== hFilterCanal) return false;
    if (hFilterStatus !== "all" && h.status !== hFilterStatus) return false;
    return true;
  });

  const urgentCount = lembretes.filter(
    (l) => l.status !== "enviado" && daysUntil(l.dataVencimento) <= 7,
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-ocid="notificacoes.page">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center gap-3 flex-shrink-0">
        <Bell className="w-5 h-5 text-accent" />
        <h1 className="text-xl font-bold text-white">
          Central de Notificações
        </h1>
        {urgentCount > 0 && (
          <Badge className="bg-red-500 text-white">
            {urgentCount} urgente{urgentCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <Tabs
        defaultValue="lembretes"
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-6 pt-4 border-b border-border flex-shrink-0">
          <TabsList className="bg-white/8">
            <TabsTrigger
              value="lembretes"
              data-ocid="notificacoes.lembretes.tab"
              className="gap-2"
            >
              <CalendarDays className="w-4 h-4" /> Lembretes
              {urgentCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 ml-1">
                  {urgentCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              data-ocid="notificacoes.historico.tab"
              className="gap-2"
            >
              <History className="w-4 h-4" /> Histórico
            </TabsTrigger>
            <TabsTrigger
              value="configuracoes"
              data-ocid="notificacoes.configuracoes.tab"
              className="gap-2"
            >
              <Settings className="w-4 h-4" /> Configurações
            </TabsTrigger>
          </TabsList>
        </div>

        {/* LEMBRETES */}
        <TabsContent
          value="lembretes"
          className="flex-1 overflow-auto m-0 p-6 space-y-4"
        >
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Buscar cliente..."
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
                className="w-44 h-8 text-sm"
                data-ocid="notificacoes.search_input"
              />
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger
                  className="w-44 h-8 text-sm"
                  data-ocid="notificacoes.tipo.select"
                >
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger
                  className="w-36 h-8 text-sm"
                  data-ocid="notificacoes.status.select"
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              data-ocid="notificacoes.add_button"
              size="sm"
              className="gap-2"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="w-4 h-4" /> Novo Lembrete
            </Button>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b border-border"
                  style={{ background: "oklch(0.2 0.04 240)" }}
                >
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Cliente
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Tipo
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">
                    Descrição
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Vencimento
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLembretes.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-muted-foreground py-12"
                      data-ocid="notificacoes.empty_state"
                    >
                      Nenhum lembrete encontrado
                    </td>
                  </tr>
                )}
                {filteredLembretes.map((l, i) => {
                  const days = daysUntil(l.dataVencimento);
                  const isUrgent = l.status !== "enviado" && days <= 3;
                  return (
                    <tr
                      key={l.id}
                      data-ocid={`notificacoes.item.${i + 1}`}
                      className={`border-b border-border/50 transition-colors hover:bg-white/3 ${isUrgent ? "bg-red-500/5" : ""}`}
                    >
                      <td className="px-4 py-3 text-white font-medium">
                        {l.clienteNome}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-white/8 text-white px-2 py-1 rounded-full">
                          {l.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs max-w-xs truncate">
                        {l.descricao}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-medium ${days < 0 ? "text-red-400" : days <= 3 ? "text-orange-400" : "text-white"}`}
                          >
                            {formatDate(l.dataVencimento)}
                          </span>
                          {l.status !== "enviado" && (
                            <span className="text-xs text-muted-foreground">
                              {days < 0
                                ? `${Math.abs(days)}d atrás`
                                : days === 0
                                  ? "Hoje!"
                                  : `em ${days}d`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{statusBadge(l.status)}</td>
                      <td className="px-4 py-3">
                        {l.status !== "enviado" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 h-7 text-xs"
                            data-ocid={`notificacoes.send.button.${i + 1}`}
                            onClick={() => handleSend(l)}
                          >
                            <Send className="w-3 h-3" /> Enviar
                          </Button>
                        ) : (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Enviado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* HISTÓRICO */}
        <TabsContent
          value="historico"
          className="flex-1 overflow-auto m-0 p-6 space-y-4"
        >
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Buscar cliente..."
              value={hFilterCliente}
              onChange={(e) => setHFilterCliente(e.target.value)}
              className="w-44 h-8 text-sm"
              data-ocid="notificacoes.historico.search_input"
            />
            <Select value={hFilterCanal} onValueChange={setHFilterCanal}>
              <SelectTrigger
                className="w-36 h-8 text-sm"
                data-ocid="notificacoes.historico.canal.select"
              >
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="E-mail">E-mail</SelectItem>
                <SelectItem value="Sistema">Sistema</SelectItem>
              </SelectContent>
            </Select>
            <Select value={hFilterStatus} onValueChange={setHFilterStatus}>
              <SelectTrigger
                className="w-36 h-8 text-sm"
                data-ocid="notificacoes.historico.status.select"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="falha">Falha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b border-border"
                  style={{ background: "oklch(0.2 0.04 240)" }}
                >
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Data Envio
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Cliente
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Tipo
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">
                    Descrição
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Canal
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHistorico.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-muted-foreground py-12"
                      data-ocid="notificacoes.historico.empty_state"
                    >
                      Nenhum registro encontrado
                    </td>
                  </tr>
                )}
                {filteredHistorico.map((h, i) => (
                  <tr
                    key={h.id}
                    data-ocid={`notificacoes.historico.item.${i + 1}`}
                    className="border-b border-border/50 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatTs(h.enviadoEm)}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {h.clienteNome}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-white/8 text-white px-2 py-1 rounded-full">
                        {h.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell max-w-xs truncate">
                      {h.descricao}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        {h.canal}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {h.status === "enviado" ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enviado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <XCircle className="w-3.5 h-3.5" /> Falha
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* CONFIGURAÇÕES */}
        <TabsContent
          value="configuracoes"
          className="flex-1 overflow-auto m-0 p-6"
        >
          <div className="max-w-2xl space-y-6">
            <Card data-ocid="notificacoes.email.card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-4 h-4 text-accent" /> Notificações por
                  E-mail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Ativar notificações por e-mail
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Envia alertas automáticos de vencimento por e-mail
                    </p>
                  </div>
                  <Switch
                    data-ocid="notificacoes.email.switch"
                    checked={config.emailEnabled}
                    onCheckedChange={(v) =>
                      saveConfig({ ...config, emailEnabled: v })
                    }
                  />
                </div>

                {config.emailEnabled && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Servidor SMTP</Label>
                        <Input
                          placeholder="smtp.gmail.com"
                          value={config.smtpHost}
                          onChange={(e) =>
                            saveConfig({ ...config, smtpHost: e.target.value })
                          }
                          className="h-8 text-sm"
                          data-ocid="notificacoes.smtp_host.input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Porta</Label>
                        <Input
                          placeholder="587"
                          value={config.smtpPort}
                          onChange={(e) =>
                            saveConfig({ ...config, smtpPort: e.target.value })
                          }
                          className="h-8 text-sm"
                          data-ocid="notificacoes.smtp_port.input"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Usuário (e-mail remetente)
                      </Label>
                      <Input
                        placeholder="contabilidade@empresa.com.br"
                        value={config.smtpUser}
                        onChange={(e) =>
                          saveConfig({ ...config, smtpUser: e.target.value })
                        }
                        className="h-8 text-sm"
                        data-ocid="notificacoes.smtp_user.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Senha SMTP</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={config.smtpPass}
                        onChange={(e) =>
                          saveConfig({ ...config, smtpPass: e.target.value })
                        }
                        className="h-8 text-sm"
                        data-ocid="notificacoes.smtp_pass.input"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        toast.success(
                          "Configurações SMTP salvas (modo simulado)",
                        )
                      }
                    >
                      Salvar configurações SMTP
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-ocid="notificacoes.aria.card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-4 h-4 text-accent" /> ARIA e Automação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Notificações automáticas da ARIA
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ARIA avisa no chat quando lembretes estão próximos de
                      vencer
                    </p>
                  </div>
                  <Switch
                    data-ocid="notificacoes.aria_auto.switch"
                    checked={config.ariaAutoNotif}
                    onCheckedChange={(v) =>
                      saveConfig({ ...config, ariaAutoNotif: v })
                    }
                  />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Alertas de vencimento próximo
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Alertar com quantos dias de antecedência
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={config.alertDays}
                      onChange={(e) =>
                        saveConfig({
                          ...config,
                          alertDays: Number(e.target.value) || 3,
                        })
                      }
                      className="w-16 h-8 text-sm text-center"
                      data-ocid="notificacoes.alert_days.input"
                    />
                    <span className="text-sm text-muted-foreground">dias</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" /> Resumo Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 text-center">
                    <p className="text-2xl font-bold text-red-400">
                      {
                        lembretes.filter(
                          (l) =>
                            l.status !== "enviado" &&
                            daysUntil(l.dataVencimento) < 0,
                        ).length
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vencidos
                    </p>
                  </div>
                  <div className="rounded-lg p-3 bg-yellow-500/10 border border-yellow-500/20 text-center">
                    <p className="text-2xl font-bold text-yellow-400">
                      {
                        lembretes.filter(
                          (l) =>
                            l.status === "pendente" &&
                            daysUntil(l.dataVencimento) >= 0 &&
                            daysUntil(l.dataVencimento) <= 7,
                        ).length
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vencem em 7d
                    </p>
                  </div>
                  <div className="rounded-lg p-3 bg-green-500/10 border border-green-500/20 text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {lembretes.filter((l) => l.status === "enviado").length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enviados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent data-ocid="notificacoes.modal">
          <DialogHeader>
            <DialogTitle>Novo Lembrete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select
                value={form.clienteId}
                onValueChange={(v) => setForm((f) => ({ ...f, clienteId: v }))}
              >
                <SelectTrigger data-ocid="notificacoes.modal.cliente.select">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_CLIENTS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}
              >
                <SelectTrigger data-ocid="notificacoes.modal.tipo.select">
                  <SelectValue placeholder="Tipo de obrigação" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                placeholder="Descrição do lembrete..."
                value={form.descricao}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descricao: e.target.value }))
                }
                data-ocid="notificacoes.modal.descricao.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data de Vencimento *</Label>
                <Input
                  type="date"
                  value={form.dataVencimento}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dataVencimento: e.target.value }))
                  }
                  data-ocid="notificacoes.modal.data.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Recorrência</Label>
                <Select
                  value={form.recorrencia}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      recorrencia: v as NotifLembrete["recorrencia"],
                    }))
                  }
                >
                  <SelectTrigger data-ocid="notificacoes.modal.recorrencia.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unica">Única</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="notificacoes.modal.cancel_button"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              data-ocid="notificacoes.modal.submit_button"
              onClick={handleNewLembrete}
            >
              <Plus className="w-4 h-4 mr-1" /> Criar Lembrete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
