import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Copy,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Star,
  StickyNote,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import { deleteRecord, getAllRecords, putRecord } from "../lib/db";

interface NotaLivre {
  id: string;
  titulo: string;
  conteudo: string;
  tags: string[];
  cor: "default" | "azul" | "verde" | "amarelo" | "vermelho" | "roxo";
  clienteId?: string;
  clienteNome?: string;
  favorita: boolean;
  criadaEm: string;
  atualizadaEm: string;
}

interface Cliente {
  id: string;
  name: string;
}

type SortOrder = "recentes" | "antigas" | "az" | "favoritas";

const NOTE_COLOR_MAP: Record<
  NotaLivre["cor"],
  { border: string; bg: string; dot: string; label: string }
> = {
  default: {
    border: "oklch(0.5 0.18 240)",
    bg: "oklch(0.97 0.006 240)",
    dot: "oklch(0.5 0.18 240)",
    label: "Padr\u00e3o",
  },
  azul: {
    border: "oklch(0.45 0.22 240)",
    bg: "oklch(0.96 0.01 240)",
    dot: "oklch(0.45 0.22 240)",
    label: "Azul",
  },
  verde: {
    border: "oklch(0.48 0.2 145)",
    bg: "oklch(0.96 0.01 145)",
    dot: "oklch(0.48 0.2 145)",
    label: "Verde",
  },
  amarelo: {
    border: "oklch(0.68 0.18 75)",
    bg: "oklch(0.98 0.02 75)",
    dot: "oklch(0.68 0.18 75)",
    label: "Amarelo",
  },
  vermelho: {
    border: "oklch(0.52 0.22 25)",
    bg: "oklch(0.97 0.01 25)",
    dot: "oklch(0.52 0.22 25)",
    label: "Vermelho",
  },
  roxo: {
    border: "oklch(0.5 0.2 290)",
    bg: "oklch(0.97 0.01 290)",
    dot: "oklch(0.5 0.2 290)",
    label: "Roxo",
  },
};

const TAG_PALETTE = [
  {
    bg: "oklch(0.93 0.08 240)",
    text: "oklch(0.32 0.14 240)",
    border: "oklch(0.82 0.1 240)",
  },
  {
    bg: "oklch(0.93 0.08 145)",
    text: "oklch(0.35 0.14 145)",
    border: "oklch(0.82 0.1 145)",
  },
  {
    bg: "oklch(0.96 0.1 75)",
    text: "oklch(0.4 0.16 75)",
    border: "oklch(0.88 0.12 75)",
  },
  {
    bg: "oklch(0.93 0.08 290)",
    text: "oklch(0.35 0.14 290)",
    border: "oklch(0.82 0.1 290)",
  },
  {
    bg: "oklch(0.93 0.1 20)",
    text: "oklch(0.38 0.16 20)",
    border: "oklch(0.82 0.12 20)",
  },
  {
    bg: "oklch(0.93 0.08 190)",
    text: "oklch(0.35 0.14 190)",
    border: "oklch(0.82 0.1 190)",
  },
];

function getTagColor(tag: string) {
  const idx =
    tag.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    TAG_PALETTE.length;
  return TAG_PALETTE[idx];
}

const SAMPLE_NOTES: NotaLivre[] = [
  {
    id: "nota-sample-1",
    titulo: "Reuni\u00e3o com Empresa Alfa - Planejamento Q2",
    conteudo:
      "Pontos discutidos na reuni\u00e3o de planejamento do 2\u00ba trimestre:\n\n\u2022 Revis\u00e3o do regime tribut\u00e1rio \u2014 avaliar migra\u00e7\u00e3o para Lucro Presumido em 2027\n\u2022 Antecipa\u00e7\u00e3o de cr\u00e9ditos fiscais ICMS acumulados (R$ 45.000)\n\u2022 Entrega das obriga\u00e7\u00f5es acess\u00f3rias: ECD at\u00e9 31/07, ECF at\u00e9 31/07\n\u2022 Folha de pagamento: 3 novas contrata\u00e7\u00f5es previstas para maio\n\u2022 SPED EFD Contribui\u00e7\u00f5es \u2014 verificar apura\u00e7\u00e3o de PIS/COFINS regime cumulativo\n\u2022 Pr\u00f3xima reuni\u00e3o agendada: 15/04/2026 \u00e0s 14h\n\nRespons\u00e1vel: Paulo Mendes | Pr\u00f3xima a\u00e7\u00e3o: Enviar memorial descritivo at\u00e9 07/04.",
    tags: ["reuni\u00e3o", "fiscal", "prioridade"],
    cor: "azul",
    clienteId: "client-1",
    clienteNome: "Empresa Alfa Ltda",
    favorita: false,
    criadaEm: new Date(Date.now() - 2 * 86400000).toISOString(),
    atualizadaEm: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "nota-sample-2",
    titulo: "Checklist Fechamento Mar\u00e7o/2026",
    conteudo:
      "Checklist de fechamento cont\u00e1bil \u2014 Mar\u00e7o 2026\n\n\u2705 Lan\u00e7amentos banc\u00e1rios reconciliados\n\u2705 Notas fiscais de entrada registradas (47 NF-e)\n\u2705 Notas fiscais de sa\u00edda emitidas (32 NF-e)\n\u2b1c Concilia\u00e7\u00e3o de contas a pagar/receber\n\u2b1c Deprecia\u00e7\u00e3o do ativo imobilizado\n\u2b1c Provis\u00e3o de 13\u00ba sal\u00e1rio (1/12)\n\u2b1c Provis\u00e3o de f\u00e9rias (1/12)\n\u2b1c Apura\u00e7\u00e3o de impostos (DAS, DARF, GPS)\n\u2b1c Emiss\u00e3o do balancete mensal\n\u2b1c Envio ao cliente para aprova\u00e7\u00e3o\n\nPrazo limite: 10/04/2026",
    tags: ["checklist", "fechamento", "urgente"],
    cor: "verde",
    favorita: false,
    criadaEm: new Date(Date.now() - 5 * 86400000).toISOString(),
    atualizadaEm: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "nota-sample-3",
    titulo: "Observa\u00e7\u00f5es SPED - Tech Solutions",
    conteudo:
      "An\u00e1lise do SPED ECD \u2014 Tech Solutions SA \u2014 Exerc\u00edcio 2025\n\nInconsist\u00eancias identificadas na valida\u00e7\u00e3o:\n- Registro I053: c\u00f3digo de plano de contas diferente do padr\u00e3o CFC\n- Registro J150: valores do Balan\u00e7o Patrimonial n\u00e3o conferem com raz\u00e3o\n- Registro J210: DRE com diferen\u00e7a de R$ 1.250,00 (poss\u00edvel PIS sobre receita financeira)\n\nA\u00e7\u00e3o necess\u00e1ria: Solicitar ao cliente a mem\u00f3ria de c\u00e1lculo do PIS/COFINS do 4\u00ba trimestre.\nContato: contabilidade@techsolutions.com.br | (11) 3456-7890",
    tags: ["sped", "fiscal"],
    cor: "default",
    clienteId: "client-2",
    clienteNome: "Tech Solutions SA",
    favorita: false,
    criadaEm: new Date(Date.now() - 10 * 86400000).toISOString(),
    atualizadaEm: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "nota-sample-4",
    titulo: "Ideias para automa\u00e7\u00e3o de folha",
    conteudo:
      "Brainstorming \u2014 Automa\u00e7\u00e3o do processo de folha de pagamento\n\nDores atuais:\n- C\u00e1lculo manual de horas extras (8 clientes com eSocial)\n- Inconsist\u00eancia na integra\u00e7\u00e3o de ponto eletr\u00f4nico\n- Retrabalho na confer\u00eancia de benef\u00edcios (VT, VA, plano de sa\u00fade)\n\nSolu\u00e7\u00f5es propostas:\n1. Integrar API de ponto com importa\u00e7\u00e3o autom\u00e1tica no 5\u00b0 dia \u00fatil\n2. Mapeamento de centro de custo por departamento no eSocial\n3. Template padronizado para clientes sem sistema de ponto\n4. Workflow: RH cliente \u2192 Confer\u00eancia escrit\u00f3rio \u2192 Processamento\n\nInvestimento estimado: 40h | ROI: redu\u00e7\u00e3o de 60% no tempo de fechamento da folha.",
    tags: ["ideia", "automa\u00e7\u00e3o"],
    cor: "roxo",
    favorita: true,
    criadaEm: new Date(Date.now() - 15 * 86400000).toISOString(),
    atualizadaEm: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "nota-sample-5",
    titulo: "Alertas de vencimento - Junho 2026",
    conteudo:
      "\u26a0\ufe0f Obriga\u00e7\u00f5es com vencimento cr\u00edtico \u2014 Junho 2026\n\n05/06 \u2014 DAS Simples Nacional (todos os clientes MEI/ME/EPP)\n10/06 \u2014 DARF IRRF s/ Servi\u00e7os (Empresa Alfa, Tech Solutions)\n15/06 \u2014 GPS (Construtora Beta \u2014 4 empregados)\n20/06 \u2014 EFD ICMS/IPI (Tech Solutions \u2014 regime mensal)\n20/06 \u2014 GIA-SP (Tech Solutions)\n25/06 \u2014 EFD Contribui\u00e7\u00f5es (Empresa Alfa, Construtora Beta)\n30/06 \u2014 DIRF retificadora se houver diverg\u00eancia na malha\n\nTotal: 18 guias em 6 datas diferentes.\nConfigurar alertas com 5 dias de anteced\u00eancia.",
    tags: ["prazos", "urgente"],
    cor: "vermelho",
    favorita: false,
    criadaEm: new Date(Date.now() - 20 * 86400000).toISOString(),
    atualizadaEm: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "recentes", label: "Mais recentes" },
  { value: "antigas", label: "Mais antigas" },
  { value: "az", label: "A \u2192 Z" },
  { value: "favoritas", label: "Favoritas primeiro" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "Agora";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atr\u00e1s`;
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d atr\u00e1s`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function resizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.max(300, el.scrollHeight)}px`;
}

export default function NotasLivres() {
  const { addMessage, setIsChatOpen } = useARIA();

  const [notas, setNotas] = useState<NotaLivre[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [editState, setEditState] = useState<NotaLivre | null>(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterCliente, setFilterCliente] = useState<string | null>(null);
  const [showFavoritasOnly, setShowFavoritasOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("recentes");
  const [newTagInput, setNewTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editStateRef = useRef<NotaLivre | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Always keep ref in sync with latest editState
  editStateRef.current = editState;

  // Load data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [notasDB, clientesDB] = await Promise.all([
          getAllRecords<NotaLivre>("notas_livres"),
          getAllRecords<Cliente>("clients"),
        ]);
        setClientes(clientesDB);
        if (
          notasDB.length === 0 &&
          !localStorage.getItem("notas_exemplo_carregadas")
        ) {
          await Promise.all(
            SAMPLE_NOTES.map((n) => putRecord("notas_livres", n)),
          );
          localStorage.setItem("notas_exemplo_carregadas", "1");
          setNotas(SAMPLE_NOTES);
        } else {
          setNotas(notasDB);
        }
      } catch {
        setNotas(SAMPLE_NOTES);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Schedule debounced auto-save — reads from ref at fire time
  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const toSave = editStateRef.current;
      if (!toSave) return;
      setIsSaving(true);
      try {
        await putRecord("notas_livres", toSave);
        setNotas((prev) => prev.map((n) => (n.id === toSave.id ? toSave : n)));
        toast.success("Nota salva", { duration: 1500 });
      } catch {
        toast.error("Erro ao salvar nota");
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  }, []);

  function handleEditChange(updates: Partial<NotaLivre>) {
    setEditState((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates, atualizadaEm: new Date().toISOString() };
    });
    scheduleAutoSave();
    // Resize textarea after state update settles
    if ("conteudo" in updates) {
      requestAnimationFrame(() => resizeTextarea(textareaRef.current));
    }
  }

  function handleSelectNota(nota: NotaLivre) {
    // Flush pending save for previous note
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      const prev = editStateRef.current;
      if (prev && prev.id !== nota.id) {
        putRecord("notas_livres", prev).catch(() => {});
      }
    }
    setEditState({ ...nota });
    // Resize textarea for newly selected note
    requestAnimationFrame(() => resizeTextarea(textareaRef.current));
  }

  async function handleNewNota() {
    const nova: NotaLivre = {
      id: `nota-${Date.now()}`,
      titulo: "Nova Nota",
      conteudo: "",
      tags: [],
      cor: "default",
      favorita: false,
      criadaEm: new Date().toISOString(),
      atualizadaEm: new Date().toISOString(),
    };
    try {
      await putRecord("notas_livres", nova);
      setNotas((prev) => [nova, ...prev]);
      setEditState({ ...nova });
      addMessage({
        type: "info",
        text: "\ud83d\udcdd Nova nota criada: Nova Nota",
      });
    } catch {
      toast.error("Erro ao criar nota");
    }
  }

  async function handleDelete() {
    if (!editState) return;
    try {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      await deleteRecord("notas_livres", editState.id);
      setNotas((prev) => prev.filter((n) => n.id !== editState.id));
      setEditState(null);
      toast.success("Nota exclu\u00edda");
    } catch {
      toast.error("Erro ao excluir nota");
    }
  }

  async function handleDuplicate() {
    if (!editState) return;
    const copia: NotaLivre = {
      ...editState,
      id: `nota-${Date.now()}`,
      titulo: `${editState.titulo} (c\u00f3pia)`,
      criadaEm: new Date().toISOString(),
      atualizadaEm: new Date().toISOString(),
    };
    try {
      await putRecord("notas_livres", copia);
      setNotas((prev) => [copia, ...prev]);
      setEditState({ ...copia });
      toast.success("Nota duplicada");
    } catch {
      toast.error("Erro ao duplicar nota");
    }
  }

  async function handleToggleFavorita(nota: NotaLivre, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = {
      ...nota,
      favorita: !nota.favorita,
      atualizadaEm: new Date().toISOString(),
    };
    try {
      await putRecord("notas_livres", updated);
      setNotas((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      if (editState?.id === updated.id) setEditState(updated);
    } catch {
      toast.error("Erro ao atualizar favorita");
    }
  }

  function handleAddTag(tag: string) {
    if (!editState || !tag.trim()) return;
    const norm = tag.trim().toLowerCase().replace(/\s+/g, "-");
    if (editState.tags.includes(norm)) {
      setNewTagInput("");
      return;
    }
    handleEditChange({ tags: [...editState.tags, norm] });
    setNewTagInput("");
  }

  function handleRemoveTag(tag: string) {
    if (!editState) return;
    handleEditChange({ tags: editState.tags.filter((t) => t !== tag) });
  }

  function handleSuggestTags() {
    if (!editState) return;
    const content = `${editState.titulo} ${editState.conteudo}`.toLowerCase();
    const candidates: { kw: string; tag: string }[] = [
      { kw: "fiscal|imposto|sped|nfe|nf-e|tribut\u00e1rio", tag: "fiscal" },
      { kw: "folha|sal\u00e1rio|esocial|e-social|trabalhista", tag: "folha" },
      { kw: "prazo|vencimento|deadline|entrega", tag: "prazos" },
      { kw: "reuni\u00e3o|meeting|cliente|visita", tag: "reuni\u00e3o" },
      { kw: "checklist|lista|\u2705|\u2b1c", tag: "checklist" },
      {
        kw: "urgente|cr\u00edtico|\u26a0\ufe0f|aten\u00e7\u00e3o",
        tag: "urgente",
      },
      { kw: "ideia|proposta|brainstorm|sugest\u00e3o", tag: "ideia" },
      {
        kw: "automa\u00e7\u00e3o|integra\u00e7\u00e3o|api|sistema",
        tag: "automa\u00e7\u00e3o",
      },
      {
        kw: "balan\u00e7o|balancete|dre|relat\u00f3rio",
        tag: "relat\u00f3rio",
      },
      { kw: "cnpj|receita|federal|rfb", tag: "receita-federal" },
    ];
    const newTags = candidates
      .filter(
        ({ kw, tag }) =>
          !editState.tags.includes(tag) &&
          kw.split("|").some((k) => content.includes(k)),
      )
      .map(({ tag }) => tag)
      .slice(0, 3);

    if (newTags.length > 0) {
      handleEditChange({ tags: [...editState.tags, ...newTags] });
      addMessage({
        type: "success",
        text: `\ud83c\udff7\ufe0f ARIA analisou "${editState.titulo}" e sugeriu ${newTags.length} tag(s): ${newTags.map((t) => `"${t}"`).join(", ")}. Tags adicionadas automaticamente.`,
      });
    } else {
      addMessage({
        type: "info",
        text: `\ud83c\udff7\ufe0f ARIA analisou "${editState.titulo}" \u2014 as tags existentes j\u00e1 cobrem os principais temas desta nota.`,
      });
    }
    setIsChatOpen(true);
    toast.success("ARIA sugeriu tags");
  }

  function handleSummarize() {
    if (!editState) return;
    const linhas = editState.conteudo
      .split("\n")
      .map((l) => l.trim())
      .filter(
        (l) =>
          l.length > 15 &&
          !l.startsWith("\u2022") &&
          !l.startsWith("-") &&
          !l.startsWith("\u2705") &&
          !l.startsWith("\u2b1c") &&
          !l.startsWith("*"),
      );
    const clienteInfo = editState.clienteNome
      ? ` vinculada ao cliente ${editState.clienteNome}`
      : "";
    const tagsInfo =
      editState.tags.length > 0 ? ` Tags: ${editState.tags.join(", ")}.` : "";
    const allText = linhas.join(" ");
    const resumo =
      linhas.length > 0
        ? `\ud83d\udccb Resumo de "${editState.titulo}"${clienteInfo}: ${allText.slice(0, 220)}${allText.length > 220 ? "..." : ""}${tagsInfo}`
        : `\ud83d\udccb "${editState.titulo}"${clienteInfo} \u2014 nota com ${editState.conteudo.length} caracteres.${tagsInfo} Conte\u00fado muito breve para resumo detalhado.`;
    addMessage({ type: "info", text: resumo });
    setIsChatOpen(true);
    toast.info("Resumo gerado pela ARIA");
  }

  // Derived: all unique tags
  const allTags = Array.from(new Set(notas.flatMap((n) => n.tags))).sort();

  // Filter + sort
  const filteredNotas = notas
    .filter((n) => {
      const q = search.toLowerCase();
      if (
        q &&
        !n.titulo.toLowerCase().includes(q) &&
        !n.conteudo.toLowerCase().includes(q) &&
        !n.tags.some((t) => t.includes(q))
      )
        return false;
      if (filterTag && !n.tags.includes(filterTag)) return false;
      if (filterCliente && n.clienteId !== filterCliente) return false;
      if (showFavoritasOnly && !n.favorita) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case "recentes":
          return (
            new Date(b.atualizadaEm).getTime() -
            new Date(a.atualizadaEm).getTime()
          );
        case "antigas":
          return (
            new Date(a.atualizadaEm).getTime() -
            new Date(b.atualizadaEm).getTime()
          );
        case "az":
          return a.titulo.localeCompare(b.titulo, "pt-BR");
        case "favoritas":
          return (b.favorita ? 1 : 0) - (a.favorita ? 1 : 0);
        default:
          return 0;
      }
    });

  const hasActiveFilters =
    !!search || !!filterTag || !!filterCliente || showFavoritasOnly;

  return (
    <TooltipProvider>
      <div className="flex h-full overflow-hidden">
        {/* Left panel: Note list */}
        <div
          className="w-80 flex-shrink-0 flex flex-col border-r border-border"
          style={{ background: "oklch(0.96 0.01 240)" }}
        >
          {/* Header */}
          <div className="p-4 border-b border-border bg-background">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <StickyNote
                  className="w-4 h-4"
                  style={{ color: "oklch(0.45 0.22 240)" }}
                />
                <h2 className="font-semibold text-foreground text-sm">Notas</h2>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{
                    background: "oklch(0.92 0.012 240)",
                    color: "oklch(0.45 0.1 240)",
                  }}
                >
                  {notas.length}
                </span>
              </div>
              <Button
                size="sm"
                data-ocid="notas.add_button"
                onClick={handleNewNota}
                className="h-7 gap-1 text-xs"
                style={{
                  background: "oklch(0.27 0.072 240)",
                  color: "white",
                }}
              >
                <Plus className="w-3 h-3" />
                Nova
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                data-ocid="notas.search_input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar notas..."
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* Filters bar */}
          <div className="px-3 py-2 border-b border-border space-y-2 bg-background">
            <div className="flex gap-1.5">
              {/* Client filter */}
              <Select
                value={filterCliente ?? "all"}
                onValueChange={(v) => setFilterCliente(v === "all" ? null : v)}
              >
                <SelectTrigger
                  data-ocid="notas.select"
                  className="h-7 text-xs flex-1 min-w-0"
                >
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    data-ocid="notas.sort.button"
                    className="h-7 px-2 text-xs flex-shrink-0"
                  >
                    \u2195
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {SORT_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => setSortOrder(opt.value)}
                      className={sortOrder === opt.value ? "font-semibold" : ""}
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Favorites toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showFavoritasOnly ? "default" : "outline"}
                    size="sm"
                    data-ocid="notas.favoritas.toggle"
                    onClick={() => setShowFavoritasOnly(!showFavoritasOnly)}
                    className="h-7 px-2 flex-shrink-0"
                    style={
                      showFavoritasOnly
                        ? {
                            background: "oklch(0.68 0.18 75)",
                            color: "white",
                            border: "none",
                          }
                        : {}
                    }
                  >
                    <Star className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>S\u00f3 favoritas</TooltipContent>
              </Tooltip>
            </div>

            {/* Tag chips */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {allTags.map((tag) => {
                  const tc = getTagColor(tag);
                  const active = filterTag === tag;
                  return (
                    <button
                      type="button"
                      key={tag}
                      data-ocid="notas.tag.toggle"
                      onClick={() => setFilterTag(active ? null : tag)}
                      className="text-[10px] px-2 py-0.5 rounded-full transition-all font-medium"
                      style={{
                        background: active ? tc.bg : "oklch(0.94 0.006 240)",
                        color: active ? tc.text : "oklch(0.45 0.03 240)",
                        border: active
                          ? `1px solid ${tc.border}`
                          : "1px solid oklch(0.88 0.01 240)",
                        transform: active ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                type="button"
                data-ocid="notas.clear_filters.button"
                onClick={() => {
                  setSearch("");
                  setFilterTag(null);
                  setFilterCliente(null);
                  setShowFavoritasOnly(false);
                }}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
                Limpar filtros
              </button>
            )}
          </div>

          {/* Note list */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div
                data-ocid="notas.loading_state"
                className="flex items-center justify-center py-12"
              >
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredNotas.length === 0 ? (
              <div
                data-ocid="notas.empty_state"
                className="flex flex-col items-center justify-center py-12 px-4 text-center"
              >
                <StickyNote className="w-7 h-7 text-muted-foreground mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground font-medium">
                  Nenhuma nota encontrada
                </p>
                {hasActiveFilters && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tente limpar os filtros
                  </p>
                )}
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                <AnimatePresence initial={false}>
                  {filteredNotas.map((nota, idx) => {
                    const color = NOTE_COLOR_MAP[nota.cor];
                    const isActive = editState?.id === nota.id;
                    return (
                      <motion.button
                        type="button"
                        key={nota.id}
                        data-ocid={`notas.item.${idx + 1}`}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => handleSelectNota(nota)}
                        className="w-full text-left rounded-lg p-3 transition-all relative group"
                        style={{
                          borderLeft: `3px solid ${color.border}`,
                          background: isActive ? color.bg : "oklch(1 0 0)",
                          boxShadow: isActive
                            ? `0 0 0 1.5px ${color.border}`
                            : "0 1px 2px oklch(0 0 0 / 0.05)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-xs font-semibold leading-snug text-foreground line-clamp-1 flex-1">
                            {nota.titulo}
                          </h3>
                          {/* Star button — visible on hover or when favorited */}
                          <button
                            type="button"
                            data-ocid={`notas.favorita.toggle.${idx + 1}`}
                            onClick={(e) => handleToggleFavorita(nota, e)}
                            className={`flex-shrink-0 transition-opacity ${
                              nota.favorita
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            <Star
                              className="w-3.5 h-3.5"
                              style={{
                                color: nota.favorita
                                  ? "oklch(0.68 0.18 75)"
                                  : "oklch(0.55 0.05 240)",
                                fill: nota.favorita
                                  ? "oklch(0.68 0.18 75)"
                                  : "none",
                              }}
                            />
                          </button>
                        </div>

                        {nota.conteudo && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mb-1.5 leading-relaxed">
                            {nota.conteudo}
                          </p>
                        )}

                        <div className="flex items-end justify-between gap-1">
                          <div className="flex flex-wrap gap-1">
                            {nota.tags.slice(0, 3).map((tag) => {
                              const tc = getTagColor(tag);
                              return (
                                <span
                                  key={tag}
                                  className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                  style={{
                                    background: tc.bg,
                                    color: tc.text,
                                    border: `1px solid ${tc.border}`,
                                  }}
                                >
                                  {tag}
                                </span>
                              );
                            })}
                            {nota.tags.length > 3 && (
                              <span className="text-[9px] text-muted-foreground">
                                +{nota.tags.length - 3}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {formatDate(nota.atualizadaEm)}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right panel: Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {!editState ? (
            /* Empty state */
            <div
              data-ocid="notas.editor.empty_state"
              className="flex-1 flex flex-col items-center justify-center gap-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-4"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "oklch(0.93 0.015 240)" }}
                >
                  <StickyNote
                    className="w-8 h-8"
                    style={{ color: "oklch(0.45 0.18 240)" }}
                  />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">
                    Selecione uma nota
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ou crie uma nova para come\u00e7ar
                  </p>
                </div>
                <Button
                  onClick={handleNewNota}
                  className="gap-2"
                  style={{
                    background: "oklch(0.27 0.072 240)",
                    color: "white",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Nova Nota
                </Button>
              </motion.div>
            </div>
          ) : (
            /* Editor */
            <motion.div
              key={editState.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Editor header */}
              <div
                className="px-8 pt-7 pb-5 border-b border-border"
                style={{
                  borderLeft: `4px solid ${NOTE_COLOR_MAP[editState.cor].border}`,
                }}
              >
                {/* Title */}
                <input
                  data-ocid="notas.title.input"
                  type="text"
                  value={editState.titulo}
                  onChange={(e) => handleEditChange({ titulo: e.target.value })}
                  placeholder="T\u00edtulo da nota..."
                  className="w-full bg-transparent border-none outline-none text-2xl font-bold text-foreground placeholder-muted-foreground mb-5"
                />

                {/* Color + Client row */}
                <div className="flex items-center gap-6 flex-wrap mb-4">
                  {/* Color selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      Cor
                    </span>
                    <div className="flex gap-2">
                      {(
                        Object.entries(NOTE_COLOR_MAP) as [
                          NotaLivre["cor"],
                          (typeof NOTE_COLOR_MAP)[keyof typeof NOTE_COLOR_MAP],
                        ][]
                      ).map(([key, val]) => (
                        <Tooltip key={key}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              data-ocid={`notas.color.${key}`}
                              onClick={() => handleEditChange({ cor: key })}
                              className="w-5 h-5 rounded-full transition-all"
                              style={{
                                background: val.dot,
                                outline:
                                  editState.cor === key
                                    ? `2.5px solid ${val.border}`
                                    : "2.5px solid transparent",
                                outlineOffset: "2px",
                                transform:
                                  editState.cor === key
                                    ? "scale(1.25)"
                                    : "scale(1)",
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>{val.label}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>

                  {/* Client */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      Cliente
                    </span>
                    <Select
                      value={editState.clienteId ?? "none"}
                      onValueChange={(v) => {
                        const c = clientes.find((cl) => cl.id === v);
                        handleEditChange({
                          clienteId: v === "none" ? undefined : v,
                          clienteNome: c?.name,
                        });
                      }}
                    >
                      <SelectTrigger
                        data-ocid="notas.editor.client.select"
                        className="h-7 text-xs w-48"
                      >
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum cliente</SelectItem>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tags row */}
                <div className="flex items-start gap-2 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {editState.tags.map((tag) => {
                      const tc = getTagColor(tag);
                      return (
                        <span
                          key={tag}
                          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: tc.bg,
                            color: tc.text,
                            border: `1px solid ${tc.border}`,
                          }}
                        >
                          {tag}
                          <button
                            type="button"
                            data-ocid="notas.tag.remove.button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:opacity-60 transition-opacity"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      );
                    })}
                    <input
                      data-ocid="notas.tag.input"
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag(newTagInput);
                        }
                      }}
                      placeholder="+ tag..."
                      className="text-xs bg-transparent border-none outline-none text-muted-foreground placeholder-muted-foreground h-6 min-w-16"
                    />
                  </div>
                </div>
              </div>

              {/* Content area */}
              <ScrollArea className="flex-1">
                <div className="px-8 py-6">
                  <textarea
                    ref={textareaRef}
                    data-ocid="notas.content.textarea"
                    value={editState.conteudo}
                    onChange={(e) =>
                      handleEditChange({ conteudo: e.target.value })
                    }
                    placeholder="Escreva suas anota\u00e7\u00f5es aqui..."
                    className="w-full min-h-[300px] bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder-muted-foreground leading-relaxed"
                  />
                </div>
              </ScrollArea>

              {/* Bottom toolbar */}
              <div
                className="flex items-center justify-between px-8 py-3 border-t border-border"
                style={{ background: "oklch(0.98 0.006 240)" }}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span>Criada {formatDate(editState.criadaEm)}</span>
                  <span>\u00b7</span>
                  <span>Modificada {formatDate(editState.atualizadaEm)}</span>
                  {isSaving && (
                    <>
                      <span>\u00b7</span>
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Salvando...
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        data-ocid="notas.suggest_tags.button"
                        onClick={handleSuggestTags}
                        className="h-7 gap-1.5 text-xs"
                      >
                        <Sparkles
                          className="w-3 h-3"
                          style={{ color: "oklch(0.68 0.18 75)" }}
                        />
                        Sugerir Tags
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>ARIA analisa e sugere tags</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        data-ocid="notas.summarize.button"
                        onClick={handleSummarize}
                        className="h-7 gap-1.5 text-xs"
                      >
                        <MessageSquare
                          className="w-3 h-3"
                          style={{ color: "oklch(0.45 0.22 240)" }}
                        />
                        Resumir
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>ARIA resume a nota</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        data-ocid="notas.duplicate.button"
                        onClick={handleDuplicate}
                        className="h-7 px-2"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Duplicar nota</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        data-ocid="notas.delete.button"
                        onClick={handleDelete}
                        className="h-7 px-2 hover:border-destructive hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Excluir nota</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
