import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Brain,
  Calendar,
  CheckCircle2,
  CheckSquare,
  FileText,
  Lightbulb,
  RefreshCw,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type TipoBadge = "NF-e" | "Lançamento" | "Folha" | "DAS" | "DARF";

interface AprovacaoItem {
  id: string;
  tipo: TipoBadge;
  descricao: string;
  cliente: string;
  valor: string;
  confianca: number;
  arquivo?: string;
}

interface SugestaoItem {
  id: string;
  icon: "calendar" | "search" | "alert" | "chart" | "bulb";
  texto: string;
  cliente: string;
  urgencia: "alta" | "media" | "baixa";
  confianca: number;
  acaoPrimaria: string;
  acaoSecundaria: string;
  historico?: boolean;
  acaoTomada?: string;
}

interface NFPreview {
  tomador: string;
  prestador: string;
  valor: string;
  deducoes: string;
  data: string;
  numero: string;
  descricao: string;
}

interface EditForm {
  descricao: string;
  categoria: string;
  valor: string;
}

const INITIAL_ITENS: AprovacaoItem[] = [
  {
    id: "a1",
    tipo: "NF-e",
    descricao: "NF_0091_EmpresaAlfa.pdf — R$ 12.450,00",
    cliente: "Empresa Alfa Ltda",
    valor: "R$ 12.450,00",
    confianca: 94,
    arquivo: "NF_0091_EmpresaAlfa.pdf",
  },
  {
    id: "a2",
    tipo: "Lançamento",
    descricao: "Posto Ipiranga R$ 340,00 → Combustível",
    cliente: "Tech Solutions SA",
    valor: "R$ 340,00",
    confianca: 97,
  },
  {
    id: "a3",
    tipo: "Folha",
    descricao: "Folha de Pagamento Março/2026",
    cliente: "Construtora Beta Ltda",
    valor: "R$ 48.200,00",
    confianca: 99,
  },
  {
    id: "a4",
    tipo: "DAS",
    descricao: "Guia DAS Simples Nacional",
    cliente: "Comercial Gama ME",
    valor: "R$ 2.840,00",
    confianca: 96,
  },
  {
    id: "a5",
    tipo: "NF-e",
    descricao: "NF_0034_Comercial.pdf — R$ 8.750,00",
    cliente: "Comercial Gama ME",
    valor: "R$ 8.750,00",
    confianca: 78,
    arquivo: "NF_0034_Comercial.pdf",
  },
];

const NF_PREVIEWS: Record<string, NFPreview> = {
  "NF_0091_EmpresaAlfa.pdf": {
    numero: "NF-e 0091",
    tomador: "Empresa Alfa Ltda — CNPJ 12.345.678/0001-99",
    prestador: "ContaFácil Serviços Ltda — CNPJ 98.765.432/0001-10",
    descricao: "Serviços de consultoria contábil — Março/2026",
    valor: "R$ 12.450,00",
    deducoes: "R$ 623,00 (ISS 5%)",
    data: "31/03/2026",
  },
  "NF_0034_Comercial.pdf": {
    numero: "NF-e 0034",
    tomador: "Comercial Gama ME — CNPJ 44.555.666/0001-77",
    prestador: "Fornecedor XYZ Ltda — CNPJ 33.444.555/0001-88",
    descricao: "Fornecimento de materiais de escritório",
    valor: "R$ 8.750,00",
    deducoes: "R$ 262,50 (PIS/COFINS 3%)",
    data: "28/03/2026",
  },
};

const INITIAL_SUGESTOES: SugestaoItem[] = [
  {
    id: "s1",
    icon: "calendar",
    texto:
      "Folha de Pagamento — TechCorp vence em 3 dias (dia 5). Deseja que eu processe automaticamente?",
    cliente: "TechCorp SA",
    urgencia: "alta",
    confianca: 98,
    acaoPrimaria: "Sim",
    acaoSecundaria: "Agora Não",
  },
  {
    id: "s2",
    icon: "search",
    texto:
      "5 notas fiscais aguardam classificação para EmpresaAlfa. Processar agora?",
    cliente: "Empresa Alfa Ltda",
    urgencia: "media",
    confianca: 91,
    acaoPrimaria: "Processar",
    acaoSecundaria: "Ignorar",
  },
  {
    id: "s3",
    icon: "alert",
    texto:
      "DARF Cleber Ltda vence em 5 dias — R$ 1.240,00. Gerar guia automaticamente?",
    cliente: "Cleber Ltda",
    urgencia: "alta",
    confianca: 99,
    acaoPrimaria: "Gerar",
    acaoSecundaria: "Lembrar depois",
  },
  {
    id: "s4",
    icon: "chart",
    texto:
      "Fechamento contábil de Março/2026 ainda não realizado para 3 clientes.",
    cliente: "Múltiplos clientes",
    urgencia: "media",
    confianca: 100,
    acaoPrimaria: "Iniciar",
    acaoSecundaria: "Ignorar",
  },
  {
    id: "s5",
    icon: "bulb",
    texto:
      "Padrão detectado: EmpresaAlfa paga COFINS sempre entre dias 10–12. Criar automação?",
    cliente: "Empresa Alfa Ltda",
    urgencia: "baixa",
    confianca: 87,
    acaoPrimaria: "Criar",
    acaoSecundaria: "Não",
  },
];

function tipoBadge(tipo: TipoBadge) {
  const map: Record<TipoBadge, { label: string; cls: string }> = {
    "NF-e": {
      label: "NF-e",
      cls: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    Lançamento: {
      label: "Lançamento",
      cls: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    },
    Folha: {
      label: "Folha",
      cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    DAS: {
      label: "DAS",
      cls: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    },
    DARF: {
      label: "DARF",
      cls: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
  };
  const { label, cls } = map[tipo];
  return (
    <Badge variant="outline" className={`text-xs font-semibold ${cls}`}>
      {label}
    </Badge>
  );
}

function confiancaBadge(pct: number) {
  const cls =
    pct >= 90
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      : pct >= 70
        ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
        : "bg-red-500/20 text-red-300 border-red-500/30";
  return (
    <Badge variant="outline" className={`text-xs font-mono ${cls}`}>
      {pct}%
    </Badge>
  );
}

function urgencyColor(urgencia: SugestaoItem["urgencia"]) {
  return urgencia === "alta"
    ? "border-l-red-400"
    : urgencia === "media"
      ? "border-l-yellow-400"
      : "border-l-blue-400";
}

function SugestaoIcon({ icon }: { icon: SugestaoItem["icon"] }) {
  const map = {
    calendar: <Calendar className="w-5 h-5 text-red-400" />,
    search: <FileText className="w-5 h-5 text-yellow-400" />,
    alert: <AlertTriangle className="w-5 h-5 text-red-400" />,
    chart: <TrendingUp className="w-5 h-5 text-blue-400" />,
    bulb: <Lightbulb className="w-5 h-5 text-blue-400" />,
  };
  return map[icon];
}

export default function AriaAprovacao() {
  const [autoMode, setAutoMode] = useState(false);
  const [itens, setItens] = useState<AprovacaoItem[]>(INITIAL_ITENS);
  const [sugestoes, setSugestoes] = useState<SugestaoItem[]>(INITIAL_SUGESTOES);
  const [historico, setHistorico] = useState<SugestaoItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    descricao: "",
    categoria: "",
    valor: "",
  });
  const [previewItem, setPreviewItem] = useState<NFPreview | null>(null);
  const [previewArquivo, setPreviewArquivo] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleAprovar = (id: string) => {
    const item = itens.find((i) => i.id === id);
    if (item) toast.success(`✅ ARIA aprovou: ${item.descricao}`);
    setItens((prev) => prev.filter((i) => i.id !== id));
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
  };

  const handleRejeitar = (id: string) => {
    const item = itens.find((i) => i.id === id);
    if (item) toast.error(`❌ Rejeitado: ${item.descricao}`);
    setItens((prev) => prev.filter((i) => i.id !== id));
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
  };

  const handleEditar = (item: AprovacaoItem) => {
    setEditingId(item.id);
    setEditForm({
      descricao: item.descricao,
      categoria: item.tipo,
      valor: item.valor,
    });
  };

  const handleSalvarEdit = (id: string) => {
    setItens((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, descricao: editForm.descricao, valor: editForm.valor }
          : i,
      ),
    );
    toast.success("✅ Item editado com sucesso");
    setEditingId(null);
  };

  const handleAprovarTodos = () => {
    toast.success(`✅ ARIA aprovou ${itens.length} itens em lote`);
    setItens([]);
    setSelectedIds(new Set());
  };

  const handleRejeitarSelecionados = () => {
    if (selectedIds.size === 0) {
      toast.error("Selecione ao menos um item para rejeitar");
      return;
    }
    toast.error(`❌ ${selectedIds.size} itens rejeitados`);
    setItens((prev) => prev.filter((i) => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const handlePreview = (item: AprovacaoItem) => {
    if (item.arquivo && NF_PREVIEWS[item.arquivo]) {
      setPreviewItem(NF_PREVIEWS[item.arquivo]);
      setPreviewArquivo(item.arquivo);
    } else {
      toast.info("Pré-visualização não disponível para este item");
    }
  };

  const handleSugestaoAcao = (id: string, acao: string) => {
    const sug = sugestoes.find((s) => s.id === id);
    if (!sug) return;
    toast.success(`ARIA executou: ${acao} — ${sug.cliente}`);
    setSugestoes((prev) => prev.filter((s) => s.id !== id));
    setHistorico((prev) => [
      ...prev,
      { ...sug, historico: true, acaoTomada: acao },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-3 shrink-0">
        <div
          className="p-2 rounded-lg"
          style={{ background: "oklch(0.35 0.12 240)" }}
        >
          <CheckCircle2 className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Aprovação ARIA</h1>
          <p className="text-xs text-muted-foreground">
            Fila de aprovação inteligente e sugestões preditivas da ARIA
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Brain className="w-4 h-4 text-accent" />
          <span className="text-xs text-accent font-semibold">ARIA Ativa</span>
        </div>
      </div>

      {/* Body */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          <Tabs defaultValue="fila">
            <TabsList className="mb-6 bg-card border border-border">
              <TabsTrigger
                value="fila"
                className="data-[state=active]:bg-accent data-[state=active]:text-white"
                data-ocid="aprovacao.fila.tab"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Fila de Aprovação
                {itens.length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white text-xs">
                    {itens.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="sugestoes"
                className="data-[state=active]:bg-accent data-[state=active]:text-white"
                data-ocid="aprovacao.sugestoes.tab"
              >
                <Zap className="w-4 h-4 mr-2" />
                Sugestões Preditivas
                {sugestoes.length > 0 && (
                  <Badge className="ml-2 bg-yellow-500 text-white text-xs">
                    {sugestoes.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: FILA */}
            <TabsContent value="fila" className="space-y-4">
              {/* Auto Mode toggle */}
              <Card className="border-border bg-card">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Zap className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">
                      Modo Automático
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ARIA aprova todos os itens automaticamente sem intervenção
                    </p>
                  </div>
                  <Switch
                    checked={autoMode}
                    onCheckedChange={setAutoMode}
                    data-ocid="aprovacao.auto_mode.switch"
                  />
                </CardContent>
              </Card>

              <AnimatePresence>
                {autoMode && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
                    data-ocid="aprovacao.auto_mode.success_state"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <p className="text-sm text-emerald-300 font-medium">
                      ARIA está aprovando automaticamente todos os itens.
                      Nenhuma intervenção necessária.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!autoMode && (
                <>
                  {/* Table */}
                  {itens.length === 0 ? (
                    <Card
                      className="border-border bg-card"
                      data-ocid="aprovacao.fila.empty_state"
                    >
                      <CardContent className="py-12 text-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Fila vazia — todos os itens foram processados.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card
                      className="border-border bg-card"
                      data-ocid="aprovacao.fila.table"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-accent" />
                          {itens.length} item{itens.length !== 1 ? "s" : ""}{" "}
                          aguardando revisão
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium w-8">
                                  <input
                                    type="checkbox"
                                    className="accent-accent"
                                    onChange={(e) => {
                                      if (e.target.checked)
                                        setSelectedIds(
                                          new Set(itens.map((i) => i.id)),
                                        );
                                      else setSelectedIds(new Set());
                                    }}
                                  />
                                </th>
                                <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">
                                  Tipo
                                </th>
                                <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">
                                  Descrição
                                </th>
                                <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">
                                  Cliente
                                </th>
                                <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">
                                  Valor
                                </th>
                                <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">
                                  Confiança
                                </th>
                                <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">
                                  Ações
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {itens.map((item, idx) => (
                                <>
                                  <tr
                                    key={item.id}
                                    data-ocid={`aprovacao.fila.item.${idx + 1}`}
                                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                                  >
                                    <td className="px-4 py-3">
                                      <input
                                        type="checkbox"
                                        className="accent-accent"
                                        checked={selectedIds.has(item.id)}
                                        onChange={() => toggleSelect(item.id)}
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      {tipoBadge(item.tipo)}
                                    </td>
                                    <td className="px-4 py-3 max-w-[220px]">
                                      {item.arquivo ? (
                                        <button
                                          type="button"
                                          className="text-accent hover:underline text-left font-medium text-xs"
                                          onClick={() => handlePreview(item)}
                                          data-ocid={`aprovacao.fila.open_modal_button.${idx + 1}`}
                                        >
                                          {item.descricao}
                                        </button>
                                      ) : (
                                        <span className="text-foreground text-xs">
                                          {item.descricao}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                      {item.cliente}
                                    </td>
                                    <td className="px-4 py-3 text-xs font-mono text-foreground">
                                      {item.valor}
                                    </td>
                                    <td className="px-4 py-3">
                                      {confiancaBadge(item.confianca)}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                          onClick={() => handleAprovar(item.id)}
                                          data-ocid={`aprovacao.fila.confirm_button.${idx + 1}`}
                                        >
                                          ✓ Aprovar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                          onClick={() =>
                                            handleRejeitar(item.id)
                                          }
                                          data-ocid={`aprovacao.fila.delete_button.${idx + 1}`}
                                        >
                                          ✗ Rejeitar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                          onClick={() =>
                                            editingId === item.id
                                              ? setEditingId(null)
                                              : handleEditar(item)
                                          }
                                          data-ocid={`aprovacao.fila.edit_button.${idx + 1}`}
                                        >
                                          ✎ Editar
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                  {/* Inline edit row */}
                                  <AnimatePresence>
                                    {editingId === item.id && (
                                      <motion.tr
                                        key={`edit-${item.id}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="bg-muted/10"
                                        data-ocid={`aprovacao.fila.panel.${idx + 1}`}
                                      >
                                        <td colSpan={7} className="px-6 py-4">
                                          <div className="grid grid-cols-3 gap-3 max-w-2xl">
                                            <div className="space-y-1">
                                              <Label className="text-xs text-muted-foreground">
                                                Descrição
                                              </Label>
                                              <Textarea
                                                className="text-xs h-16 bg-background border-border"
                                                value={editForm.descricao}
                                                onChange={(e) =>
                                                  setEditForm((f) => ({
                                                    ...f,
                                                    descricao: e.target.value,
                                                  }))
                                                }
                                                data-ocid={`aprovacao.fila.textarea.${idx + 1}`}
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs text-muted-foreground">
                                                Categoria
                                              </Label>
                                              <Input
                                                className="text-xs bg-background border-border"
                                                value={editForm.categoria}
                                                onChange={(e) =>
                                                  setEditForm((f) => ({
                                                    ...f,
                                                    categoria: e.target.value,
                                                  }))
                                                }
                                                data-ocid={`aprovacao.fila.input.${idx + 1}`}
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs text-muted-foreground">
                                                Valor
                                              </Label>
                                              <Input
                                                className="text-xs bg-background border-border"
                                                value={editForm.valor}
                                                onChange={(e) =>
                                                  setEditForm((f) => ({
                                                    ...f,
                                                    valor: e.target.value,
                                                  }))
                                                }
                                              />
                                            </div>
                                          </div>
                                          <div className="flex gap-2 mt-3">
                                            <Button
                                              size="sm"
                                              className="h-7 text-xs bg-accent hover:bg-accent/90"
                                              onClick={() =>
                                                handleSalvarEdit(item.id)
                                              }
                                              data-ocid={`aprovacao.fila.save_button.${idx + 1}`}
                                            >
                                              Salvar Alterações
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 text-xs"
                                              onClick={() => setEditingId(null)}
                                              data-ocid={`aprovacao.fila.cancel_button.${idx + 1}`}
                                            >
                                              Cancelar
                                            </Button>
                                          </div>
                                        </td>
                                      </motion.tr>
                                    )}
                                  </AnimatePresence>
                                </>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Batch actions */}
                  {itens.length > 0 && (
                    <div className="flex gap-3">
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleAprovarTodos}
                        data-ocid="aprovacao.fila.primary_button"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Aprovar Todos ({itens.length})
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        onClick={handleRejeitarSelecionados}
                        data-ocid="aprovacao.fila.delete_button"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rejeitar Selecionados
                        {selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* TAB 2: SUGESTÕES */}
            <TabsContent value="sugestoes" className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-foreground">
                  Sugestões Proativas da ARIA
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  — baseadas em padrões e histórico dos clientes
                </span>
              </div>

              {sugestoes.length === 0 && (
                <Card
                  className="border-border bg-card"
                  data-ocid="aprovacao.sugestoes.empty_state"
                >
                  <CardContent className="py-12 text-center">
                    <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma sugestão ativa no momento.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3" data-ocid="aprovacao.sugestoes.list">
                {sugestoes.map((sug, idx) => (
                  <motion.div
                    key={sug.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: idx * 0.06 }}
                    data-ocid={`aprovacao.sugestoes.item.${idx + 1}`}
                  >
                    <Card
                      className={`border-l-4 border-border bg-card hover:bg-card/80 transition-colors ${urgencyColor(
                        sug.urgencia,
                      )}`}
                    >
                      <CardContent className="py-4 flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-muted/30 shrink-0 mt-0.5">
                          <SugestaoIcon icon={sug.icon} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-snug">
                            {sug.texto}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-muted-foreground">
                              {sug.cliente}
                            </span>
                            <span className="text-muted-foreground/40 text-xs">
                              ·
                            </span>
                            {confiancaBadge(sug.confianca)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-accent hover:bg-accent/90 text-white"
                            onClick={() =>
                              handleSugestaoAcao(sug.id, sug.acaoPrimaria)
                            }
                            data-ocid={`aprovacao.sugestoes.confirm_button.${idx + 1}`}
                          >
                            {sug.acaoPrimaria}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              handleSugestaoAcao(sug.id, sug.acaoSecundaria)
                            }
                            data-ocid={`aprovacao.sugestoes.cancel_button.${idx + 1}`}
                          >
                            {sug.acaoSecundaria}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Histórico */}
              {historico.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Histórico de Sugestões
                  </p>
                  {historico.map((h, idx) => (
                    <div
                      key={`h-${h.id}-${idx}`}
                      data-ocid={`aprovacao.sugestoes.panel.${idx + 1}`}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/10 border border-border/50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs text-muted-foreground flex-1 truncate">
                        {h.texto}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      >
                        {h.acaoTomada}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* NF-e Preview Modal */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent
          className="max-w-lg bg-card border-border"
          data-ocid="aprovacao.nfe.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileText className="w-5 h-5 text-accent" />
              {previewItem?.numero || "Nota Fiscal"}
            </DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div className="rounded-lg bg-background border border-border p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Tomador</span>
                  <span className="text-foreground text-xs font-medium text-right max-w-[65%]">
                    {previewItem.tomador}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">
                    Prestador
                  </span>
                  <span className="text-foreground text-xs font-medium text-right max-w-[65%]">
                    {previewItem.prestador}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">
                    Descrição
                  </span>
                  <span className="text-foreground text-xs font-medium text-right max-w-[65%]">
                    {previewItem.descricao}
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Valor</span>
                  <span className="text-emerald-400 text-sm font-bold">
                    {previewItem.valor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">
                    Deduções
                  </span>
                  <span className="text-red-400 text-xs font-medium">
                    {previewItem.deducoes}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Data</span>
                  <span className="text-foreground text-xs font-medium">
                    {previewItem.data}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-accent hover:bg-accent/90 text-white text-sm"
                  onClick={() => {
                    toast.success("✅ NF-e salva com sucesso");
                    setPreviewItem(null);
                  }}
                  data-ocid="aprovacao.nfe.save_button"
                >
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-border text-sm"
                  onClick={() => {
                    toast.success("📤 NF-e enviada");
                    setPreviewItem(null);
                  }}
                  data-ocid="aprovacao.nfe.confirm_button"
                >
                  Enviar
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 text-sm text-blue-400 hover:text-blue-300"
                  onClick={() => {
                    toast.info("✎ Editando NF-e inline");
                    setPreviewItem(null);
                    const item = itens.find(
                      (i) => i.arquivo === previewArquivo,
                    );
                    if (item) handleEditar(item);
                  }}
                  data-ocid="aprovacao.nfe.edit_button"
                >
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
