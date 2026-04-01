import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Plus,
  RefreshCw,
  RotateCcw,
  User,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import { useAppContext } from "../context/AppContext";
import {
  type HistoricoNota,
  type WorkflowItem,
  type WorkflowStatus,
  type WorkflowTipo,
  approveItem,
  createWorkflowItem,
  getAllWorkflowItems,
  rejectItem,
  resubmitItem,
  seedWorkflowIfEmpty,
} from "../lib/workflowService";

// ── Role helpers ────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<number, string> = {
  1: "Auxiliar",
  2: "Contador",
  3: "Sócio",
};

function getUserRole(): number {
  const stored = localStorage.getItem("workflowRole");
  return stored ? Number(stored) : 2;
}

function setUserRole(r: number) {
  localStorage.setItem("workflowRole", String(r));
}

// ── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<WorkflowStatus, string> = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  em_revisao: "bg-blue-100 text-blue-800 border-blue-200",
  aprovado: "bg-green-100 text-green-800 border-green-200",
  rejeitado: "bg-red-100 text-red-800 border-red-200",
  pendente_correcao: "bg-orange-100 text-orange-800 border-orange-200",
};

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  pendente: "Pendente",
  em_revisao: "Em Revisão",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  pendente_correcao: "Pendente de Correção",
};

// ── Tipo badge ────────────────────────────────────────────────────────────────
const TIPO_STYLES: Record<WorkflowTipo, string> = {
  lancamento: "bg-purple-100 text-purple-800 border-purple-200",
  nota_fiscal: "bg-sky-100 text-sky-800 border-sky-200",
  folha_pagamento: "bg-teal-100 text-teal-800 border-teal-200",
  guia_imposto: "bg-amber-100 text-amber-800 border-amber-200",
};

const TIPO_LABELS: Record<WorkflowTipo, string> = {
  lancamento: "Lançamento",
  nota_fiscal: "Nota Fiscal",
  folha_pagamento: "Folha",
  guia_imposto: "Guia de Imposto",
};

// ── Nivel badge ───────────────────────────────────────────────────────────────
const NIVEL_STYLES: Record<number, string> = {
  1: "bg-gray-100 text-gray-700 border-gray-200",
  2: "bg-blue-100 text-blue-700 border-blue-200",
  3: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

// ── Format BRL ────────────────────────────────────────────────────────────────
function formatBRL(v?: number) {
  if (v === undefined || v === null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Ação label ────────────────────────────────────────────────────────────────
const ACAO_LABELS: Record<HistoricoNota["acao"], string> = {
  criado: "Criado",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  reenviado: "Reenviado para revisão",
};

const ACAO_COLORS: Record<HistoricoNota["acao"], string> = {
  criado: "bg-gray-400",
  aprovado: "bg-green-500",
  rejeitado: "bg-red-500",
  reenviado: "bg-orange-400",
};

// ── Stats data ──────────────────────────────────────────────────────────────
interface StatCard {
  label: string;
  value: number;
  color: string;
  bg: string;
  key: string;
}

// ── WorkflowCard ─────────────────────────────────────────────────────────────
interface WorkflowCardProps {
  item: WorkflowItem;
  index: number;
  currentRole: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onResubmit: (id: string) => void;
  showActions?: boolean;
}

function WorkflowCard({
  item,
  index,
  currentRole,
  onApprove,
  onReject,
  onResubmit,
  showActions = true,
}: WorkflowCardProps) {
  const [expanded, setExpanded] = useState(false);
  const userName = localStorage.getItem("userName") ?? "Usuário";
  const isMyItem =
    item.status_atual === "pendente_correcao" &&
    item.historico_notas[0]?.usuario === userName;

  return (
    <motion.div
      data-ocid={`workflow.item.${index}`}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      TIPO_STYLES[item.tipo]
                    }`}
                  >
                    {TIPO_LABELS[item.tipo]}
                  </span>
                  <span
                    className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      NIVEL_STYLES[item.nivel_aprovacao] ?? NIVEL_STYLES[1]
                    }`}
                  >
                    {ROLE_LABELS[item.nivel_aprovacao] ?? "—"}
                  </span>
                  <span
                    className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      STATUS_STYLES[item.status_atual]
                    }`}
                  >
                    {STATUS_LABELS[item.status_atual]}
                  </span>
                </div>
                <p className="font-semibold text-sm text-foreground leading-snug">
                  {item.titulo}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {item.clientNome ?? item.clientId}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(item.createdAt)}
                  </span>
                  {item.valor !== undefined && (
                    <span className="font-medium text-foreground">
                      {formatBRL(item.valor)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              data-ocid={`workflow.item.${index}.toggle`}
              onClick={() => setExpanded((p) => !p)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <CardContent className="px-5 pb-4 pt-0">
                {item.descricao && (
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    {item.descricao}
                  </p>
                )}

                {/* Timeline */}
                <div className="space-y-2 mb-3">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Histórico
                  </p>
                  {item.historico_notas.map((nota, i) => (
                    <div key={nota.id} className="flex gap-2.5">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 ${
                            ACAO_COLORS[nota.acao]
                          }`}
                        />
                        {i < item.historico_notas.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      <div className="pb-2">
                        <p className="text-xs text-foreground font-medium">
                          {ACAO_LABELS[nota.acao]}{" "}
                          <span className="text-muted-foreground font-normal">
                            por {nota.usuario}
                          </span>
                        </p>
                        {nota.justificativa && (
                          <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mt-0.5 border border-red-100">
                            💬 {nota.justificativa}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDate(nota.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        {showActions && (
          <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
            {(item.status_atual === "pendente" ||
              item.status_atual === "em_revisao") &&
              item.nivel_aprovacao === currentRole && (
                <>
                  <Button
                    size="sm"
                    data-ocid={`workflow.item.${index}.primary_button`}
                    className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs gap-1"
                    onClick={() => onApprove(item.id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    data-ocid={`workflow.item.${index}.delete_button`}
                    className="border-red-200 text-red-600 hover:bg-red-50 h-7 px-3 text-xs gap-1"
                    onClick={() => onReject(item.id)}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rejeitar
                  </Button>
                </>
              )}
            {item.status_atual === "pendente_correcao" && isMyItem && (
              <Button
                size="sm"
                variant="outline"
                data-ocid={`workflow.item.${index}.secondary_button`}
                className="border-orange-200 text-orange-600 hover:bg-orange-50 h-7 px-3 text-xs gap-1"
                onClick={() => onResubmit(item.id)}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reenviar
              </Button>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Workflow() {
  const { clients } = useAppContext();
  const { addMessage, setIsChatOpen } = useARIA();

  const [items, setItems] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<number>(getUserRole);

  // New item dialog
  const [newOpen, setNewOpen] = useState(false);
  const [newTipo, setNewTipo] = useState<WorkflowTipo>("nota_fiscal");
  const [newTitulo, setNewTitulo] = useState("");
  const [newDescricao, setNewDescricao] = useState("");
  const [newValor, setNewValor] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [creating, setCreating] = useState(false);

  // Reject dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectItemId, setRejectItemId] = useState("");
  const [rejectJustificativa, setRejectJustificativa] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const userName = localStorage.getItem("userName") ?? ROLE_LABELS[currentRole];

  const loadItems = useCallback(async () => {
    try {
      await seedWorkflowIfEmpty();
      const all = await getAllWorkflowItems();
      setItems(all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Stats
  const today = new Date().toDateString();
  const pendentes = items.filter(
    (i) => i.status_atual === "pendente" || i.status_atual === "em_revisao",
  ).length;
  const emRevisao = items.filter((i) => i.status_atual === "em_revisao").length;
  const aprovadosHoje = items.filter(
    (i) =>
      i.status_atual === "aprovado" &&
      new Date(i.updatedAt).toDateString() === today,
  ).length;
  const rejeitados = items.filter(
    (i) =>
      i.status_atual === "rejeitado" || i.status_atual === "pendente_correcao",
  ).length;

  const statCards: StatCard[] = [
    {
      key: "pendentes",
      label: "Pendentes",
      value: pendentes,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      key: "em_revisao",
      label: "Em Revisão",
      value: emRevisao,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      key: "aprovados_hoje",
      label: "Aprovados Hoje",
      value: aprovadosHoje,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      key: "rejeitados",
      label: "Rejeitados",
      value: rejeitados,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  // Queues
  const myQueue = items.filter(
    (i) =>
      (i.status_atual === "pendente" || i.status_atual === "em_revisao") &&
      i.nivel_aprovacao === currentRole,
  );
  const pendentesCorrecao = items.filter(
    (i) => i.status_atual === "pendente_correcao",
  );
  const meuItemsQueue = [...myQueue, ...pendentesCorrecao];
  const historico = items.filter(
    (i) => i.status_atual === "aprovado" || i.status_atual === "rejeitado",
  );

  function handleRoleChange(r: number) {
    setCurrentRole(r);
    setUserRole(r);
  }

  async function handleApprove(id: string) {
    const updated = await approveItem(id, userName);
    if (!updated) return;
    await loadItems();
    const label =
      updated.status_atual === "aprovado"
        ? "✅ Item aprovado definitivamente!"
        : `✅ Aprovado — enviado para ${ROLE_LABELS[updated.nivel_aprovacao]}`;
    toast.success(label);
    addMessage({
      type: "success",
      text: `🔖 Workflow: ${label} — ${updated.titulo}`,
    });
    setIsChatOpen(true);
  }

  function openReject(id: string) {
    setRejectItemId(id);
    setRejectJustificativa("");
    setRejectOpen(true);
  }

  async function handleReject() {
    if (!rejectJustificativa.trim()) {
      toast.error("Justificativa obrigatória para rejeição.");
      return;
    }
    setRejecting(true);
    try {
      const updated = await rejectItem(
        rejectItemId,
        userName,
        rejectJustificativa.trim(),
      );
      if (!updated) return;
      await loadItems();
      const msg = `❌ Item rejeitado — ${updated.titulo}. Justificativa: ${rejectJustificativa.trim()}`;
      toast.error("Item rejeitado com justificativa registrada.");
      addMessage({ type: "warning", text: `🔖 Workflow: ${msg}` });
      setIsChatOpen(true);
      setRejectOpen(false);
    } finally {
      setRejecting(false);
    }
  }

  async function handleResubmit(id: string) {
    const updated = await resubmitItem(id, userName);
    if (!updated) return;
    await loadItems();
    toast.success("Item reenviado para revisão.");
    addMessage({
      type: "info",
      text: `🔖 Workflow: Item reenviado — ${updated.titulo}`,
    });
  }

  async function handleCreate() {
    if (!newTitulo.trim() || !newClientId) {
      toast.error("Preencha título e cliente.");
      return;
    }
    setCreating(true);
    try {
      const client = clients.find((c) => c.id === newClientId);
      await createWorkflowItem(
        {
          tipo: newTipo,
          titulo: newTitulo.trim(),
          descricao: newDescricao.trim() || undefined,
          valor: newValor ? Number(newValor.replace(",", ".")) : undefined,
          clientId: newClientId,
          clientNome: client?.name,
        },
        userName,
      );
      await loadItems();
      toast.success("Item criado e enviado para aprovação.");
      addMessage({
        type: "info",
        text: `🔖 Workflow: Novo item criado — ${newTitulo.trim()}`,
      });
      setNewOpen(false);
      setNewTitulo("");
      setNewDescricao("");
      setNewValor("");
      setNewClientId("");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div
        data-ocid="workflow.loading_state"
        className="flex items-center justify-center h-64 text-muted-foreground"
      >
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Carregando workflow...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Workflow de Aprovação
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fluxo Auxiliar → Contador → Sócio
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Role switcher for demo */}
          <div className="flex items-center gap-1.5 bg-muted rounded-lg p-1">
            {[1, 2, 3].map((r) => (
              <button
                key={r}
                type="button"
                data-ocid="workflow.role.toggle"
                onClick={() => handleRoleChange(r)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  currentRole === r
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>

          {/* New item */}
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                data-ocid="workflow.open_modal_button"
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent data-ocid="workflow.dialog" className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Item para Aprovação</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <Select
                    value={newTipo}
                    onValueChange={(v) => setNewTipo(v as WorkflowTipo)}
                  >
                    <SelectTrigger data-ocid="workflow.select" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nota_fiscal">Nota Fiscal</SelectItem>
                      <SelectItem value="lancamento">
                        Lançamento Contábil
                      </SelectItem>
                      <SelectItem value="folha_pagamento">
                        Folha de Pagamento
                      </SelectItem>
                      <SelectItem value="guia_imposto">
                        Guia de Imposto
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Título *</Label>
                  <Input
                    data-ocid="workflow.input"
                    placeholder="Ex: NF-e 005678 — Consultoria"
                    value={newTitulo}
                    onChange={(e) => setNewTitulo(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descrição</Label>
                  <Textarea
                    data-ocid="workflow.textarea"
                    placeholder="Detalhes adicionais..."
                    value={newDescricao}
                    onChange={(e) => setNewDescricao(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Valor (R$)</Label>
                    <Input
                      data-ocid="workflow.valor.input"
                      type="text"
                      placeholder="0,00"
                      value={newValor}
                      onChange={(e) => setNewValor(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cliente *</Label>
                    <Select value={newClientId} onValueChange={setNewClientId}>
                      <SelectTrigger
                        data-ocid="workflow.client.select"
                        className="h-9"
                      >
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  data-ocid="workflow.cancel_button"
                  onClick={() => setNewOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  data-ocid="workflow.submit_button"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? "Criando..." : "Criar Item"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.key} className={`${s.bg} border-0 shadow-none`}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="minha-fila">
        <TabsList className="h-9">
          <TabsTrigger
            value="minha-fila"
            data-ocid="workflow.queue.tab"
            className="text-xs"
          >
            Minha Fila
            {meuItemsQueue.length > 0 && (
              <Badge className="ml-1.5 h-4 min-w-4 text-[10px] px-1 bg-primary">
                {meuItemsQueue.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="todos"
            data-ocid="workflow.all.tab"
            className="text-xs"
          >
            Todos os Itens
          </TabsTrigger>
          <TabsTrigger
            value="historico"
            data-ocid="workflow.history.tab"
            className="text-xs"
          >
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* My Queue */}
        <TabsContent value="minha-fila" className="mt-4">
          {meuItemsQueue.length === 0 ? (
            <div
              data-ocid="workflow.queue.empty_state"
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <CheckCircle2 className="w-10 h-10 mb-3 text-green-400" />
              <p className="font-medium">Nenhum item pendente para você</p>
              <p className="text-sm mt-1">
                Como {ROLE_LABELS[currentRole]}, sua fila está limpa.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {meuItemsQueue.map((item, i) => (
                  <WorkflowCard
                    key={item.id}
                    item={item}
                    index={i + 1}
                    currentRole={currentRole}
                    onApprove={handleApprove}
                    onReject={openReject}
                    onResubmit={handleResubmit}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* All items */}
        <TabsContent value="todos" className="mt-4">
          {items.length === 0 ? (
            <div
              data-ocid="workflow.all.empty_state"
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <FileText className="w-10 h-10 mb-3 opacity-30" />
              <p className="font-medium">Nenhum item no workflow</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {items.map((item, i) => (
                  <WorkflowCard
                    key={item.id}
                    item={item}
                    index={i + 1}
                    currentRole={currentRole}
                    onApprove={handleApprove}
                    onReject={openReject}
                    onResubmit={handleResubmit}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="historico" className="mt-4">
          {historico.length === 0 ? (
            <div
              data-ocid="workflow.history.empty_state"
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <Clock className="w-10 h-10 mb-3 opacity-30" />
              <p className="font-medium">Nenhum item no histórico</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {historico.map((item, i) => (
                  <WorkflowCard
                    key={item.id}
                    item={item}
                    index={i + 1}
                    currentRole={currentRole}
                    onApprove={handleApprove}
                    onReject={openReject}
                    onResubmit={handleResubmit}
                    showActions={false}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject AlertDialog */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent data-ocid="workflow.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Item</AlertDialogTitle>
            <AlertDialogDescription>
              Informe a justificativa para rejeição. O item será devolvido ao
              nível anterior com o histórico do motivo visível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label className="text-xs font-semibold mb-1.5 block">
              Justificativa *
            </Label>
            <Textarea
              data-ocid="workflow.reject.textarea"
              placeholder="Descreva o motivo da rejeição..."
              value={rejectJustificativa}
              onChange={(e) => setRejectJustificativa(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="workflow.cancel_button">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="workflow.confirm_button"
              onClick={handleReject}
              disabled={rejecting || !rejectJustificativa.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {rejecting ? "Rejeitando..." : "Confirmar Rejeição"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
