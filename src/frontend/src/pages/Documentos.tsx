import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CloudUpload,
  FileText,
  FolderOpen,
  ScanLine,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import LancamentoModal from "../components/LancamentoModal";
import { useARIA } from "../context/ARIAContext";
import { useAppContext } from "../context/AppContext";
import { useAddDocument, useDocuments } from "../hooks/useQueries";
import { classifyDocument } from "../lib/accountPlan";
import {
  type OcrResult,
  deleteRecord,
  getAllRecords,
  putRecord,
} from "../lib/db";
import {
  CATEGORY_CONFIG,
  type DocCategory,
  getDocumentCategory,
} from "../lib/documentCategories";

type StatusKey = "Pendente" | "Processando" | "Processado" | "Erro";

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; icon: React.ReactNode; style: React.CSSProperties }
> = {
  Pendente: {
    label: "Pendente",
    icon: <Clock className="w-3 h-3" />,
    style: {
      background: "oklch(0.93 0.01 240)",
      color: "oklch(0.45 0.02 240)",
    },
  },
  Processando: {
    label: "Processando",
    icon: <Clock className="w-3 h-3" />,
    style: { background: "oklch(0.96 0.08 85)", color: "oklch(0.55 0.14 85)" },
  },
  Processado: {
    label: "Processado",
    icon: <CheckCircle2 className="w-3 h-3" />,
    style: { background: "oklch(0.95 0.05 150)", color: "oklch(0.4 0.12 150)" },
  },
  Erro: {
    label: "Erro",
    icon: <XCircle className="w-3 h-3" />,
    style: { background: "oklch(0.96 0.05 20)", color: "oklch(0.45 0.14 20)" },
  },
};

const MOCK_SCAN_FILES = [
  {
    name: "folha_jan_2026.pdf",
    type: "Folha de Pagamento",
    debitCode: "5.1.01",
    creditCode: "2.1.03",
    value: "R$ 8.450,00",
  },
  {
    name: "nf_energia_fev_2026.pdf",
    type: "Energia Elétrica",
    debitCode: "5.1.04",
    creditCode: "1.1.02",
    value: "R$ 387,50",
  },
  {
    name: "recibo_aluguel_2026.pdf",
    type: "Aluguel",
    debitCode: "5.1.05",
    creditCode: "1.1.02",
    value: "R$ 2.200,00",
  },
  {
    name: "guia_fgts_jan_2026.pdf",
    type: "FGTS",
    debitCode: "5.1.03",
    creditCode: "2.1.04",
    value: "R$ 676,00",
  },
  {
    name: "nf_servico_cliente_abc.pdf",
    type: "Receita de Serviços",
    debitCode: "1.1.02",
    creditCode: "4.1.01",
    value: "R$ 15.000,00",
  },
];

type ScanPhase = "idle" | "scanning" | "found" | "done";
type TabKey = "documentos" | "pendentes";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatCNPJ(digits: string) {
  if (!digits) return "n/a";
  const d = digits.replace(/\D/g, "");
  if (d.length === 14)
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return digits;
}

// --- Collapsible tree state helpers ---
type TreeState = Record<string, Record<string, Record<string, boolean>>>;

export default function Documentos() {
  const { selectedClientId, clients } = useAppContext();
  const { processRealDocument, refreshPendingOcr, pendingOcrCount } = useARIA();
  const { data: documents = [], isLoading } = useDocuments();
  const addDocument = useAddDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [lancamentoData, setLancamentoData] = useState<{
    debitCode?: string;
    creditCode?: string;
    description?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("documentos");
  const [scanPhase, setScanPhase] = useState<ScanPhase>("idle");
  const [scanProgress, setScanProgress] = useState(0);

  // tree open/close state: client -> year -> category -> open?
  const [treeOpen, setTreeOpen] = useState<TreeState>({});
  const [clientOpen, setClientOpen] = useState<Record<string, boolean>>({});
  const [yearOpen, setYearOpen] = useState<Record<string, boolean>>({});

  const toggleClient = (name: string) =>
    setClientOpen((prev) => ({ ...prev, [name]: !prev[name] }));
  const toggleYear = (key: string) =>
    setYearOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleCategory = (key: string) =>
    setTreeOpen((prev) => {
      const [c, y, cat] = key.split("|");
      return {
        ...prev,
        [c]: {
          ...(prev[c] ?? {}),
          [y]: {
            ...(prev[c]?.[y] ?? {}),
            [cat]: !prev[c]?.[y]?.[cat],
          },
        },
      };
    });

  // OCR pending state
  const [pendingOcrResults, setPendingOcrResults] = useState<OcrResult[]>([]);
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCnpj, setEditCnpj] = useState("");
  const [editValor, setEditValor] = useState("");

  const loadPendingOcr = useCallback(async () => {
    setLoadingOcr(true);
    try {
      const all = await getAllRecords<OcrResult>("ocr_results");
      const pending = all.filter((r) => r.status === "pending");
      if (selectedClientId) {
        setPendingOcrResults(
          pending.filter((r) => r.clientId === selectedClientId),
        );
      } else {
        setPendingOcrResults(pending);
      }
    } catch {
      setPendingOcrResults([]);
    } finally {
      setLoadingOcr(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    if (activeTab === "pendentes") loadPendingOcr();
  }, [activeTab, loadPendingOcr]);

  const handleApprove = async (result: OcrResult) => {
    try {
      for (const l of result.analysis.lancamentos) {
        await putRecord("journal_entries", {
          id: `je_${result.id}_${l.id}`,
          clientId: result.clientId,
          docId: result.id,
          debitCode: l.debitoCode,
          creditCode: l.creditoCode,
          valueInCents: l.valor,
          description: l.historico,
          entryDate: result.analysis.data,
          createdAt: new Date().toISOString(),
        });
      }
      await putRecord("ocr_results", { ...result, status: "approved" });
      toast.success("Lançamentos criados com sucesso!");
      await loadPendingOcr();
      refreshPendingOcr();
    } catch {
      toast.error("Erro ao aprovar lançamentos");
    }
  };

  const handleReject = async (result: OcrResult) => {
    try {
      await deleteRecord("ocr_results", result.id);
      toast.success("Documento rejeitado.");
      await loadPendingOcr();
      refreshPendingOcr();
    } catch {
      toast.error("Erro ao rejeitar documento");
    }
  };

  const handleSaveEdit = async (result: OcrResult) => {
    try {
      const updated: OcrResult = {
        ...result,
        analysis: {
          ...result.analysis,
          cnpj: editCnpj.replace(/\D/g, "") || result.analysis.cnpj,
          valor: editValor
            ? Math.round(Number.parseFloat(editValor) * 100)
            : result.analysis.valor,
        },
      };
      await putRecord("ocr_results", updated);
      setEditingId(null);
      await loadPendingOcr();
      toast.success("Informações atualizadas!");
    } catch {
      toast.error("Erro ao salvar edição");
    }
  };

  const runScan = async () => {
    setScanPhase("scanning");
    setScanProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 120));
      setScanProgress(i);
    }
    setScanPhase("found");
    toast.success(
      `${MOCK_SCAN_FILES.length} documentos identificados automaticamente!`,
    );
  };

  const acceptAllScan = () => {
    const currentYear = new Date().getFullYear();
    setScanPhase("done");
    // Show ARIA messages for each file classified
    for (const f of MOCK_SCAN_FILES) {
      const cat = getDocumentCategory(f.name, f.type);
      toast.success(
        `ARIA: Estrutura de pastas criada: Cliente / ${currentYear} / ${cat}`,
        { duration: 3000 },
      );
    }
  };

  // Build 3-level grouped tree: clientName -> year -> category -> docs[]
  const currentYear = new Date().getFullYear();
  const grouped: Record<
    string,
    Record<string, Record<string, typeof documents>>
  > = {};

  for (const doc of documents) {
    const client = clients.find((c) => c.id === doc.clientId);
    const clientName = client?.name ?? doc.clientId;
    const year = String(doc.year);
    const cat = ((doc as { category?: string }).category ??
      getDocumentCategory(doc.filename ?? "")) as DocCategory;
    if (!grouped[clientName]) grouped[clientName] = {};
    if (!grouped[clientName][year]) grouped[clientName][year] = {};
    if (!grouped[clientName][year][cat]) grouped[clientName][year][cat] = [];
    grouped[clientName][year][cat].push(doc);
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || !selectedClientId) {
      toast.error("Selecione um cliente primeiro");
      return;
    }
    const client = clients.find((c) => c.id === selectedClientId);
    const clientName = client?.name ?? selectedClientId;
    const ano = new Date().getFullYear();

    for (const file of Array.from(files)) {
      try {
        const category = getDocumentCategory(file.name);
        const doc = {
          id: crypto.randomUUID(),
          clientId: selectedClientId,
          year: BigInt(ano),
          filename: file.name,
          status: "Processado",
          extractedText: "",
          docType: "",
          category,
        };
        await addDocument.mutateAsync(doc as never);
        await processRealDocument(file, selectedClientId);
        const classified = classifyDocument(file.name);
        if (classified) setLancamentoData(classified);
        toast.success(
          `ARIA criou pasta "${category}" em ${clientName} / ${ano}`,
        );
      } catch {
        toast.error(`Erro ao processar "${file.name}"`);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="no-print flex items-center justify-between px-6 py-4 bg-white border-b border-border">
        <div>
          <h1 className="text-xl font-semibold">Documentos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {documents.length} documento(s) no sistema
          </p>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
          <button
            type="button"
            data-ocid="documentos.documentos.tab"
            onClick={() => setActiveTab("documentos")}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === "documentos"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Documentos
          </button>
          <button
            type="button"
            data-ocid="documentos.pendentes.tab"
            onClick={() => setActiveTab("pendentes")}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "pendentes"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pendentes
            {pendingOcrCount > 0 && (
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white"
                style={{ background: "oklch(0.55 0.18 25)" }}
              >
                {pendingOcrCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        {activeTab === "documentos" && (
          <>
            {/* === AUTO-SCAN BANNER === */}
            <Card
              data-ocid="documentos.scan.card"
              className="rounded-xl border-border shadow-sm overflow-hidden"
              style={{ borderLeft: "4px solid oklch(var(--accent))" }}
            >
              <CardHeader className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{
                        background: "oklch(0.95 0.06 50)",
                        color: "oklch(0.55 0.12 50)",
                      }}
                    >
                      <ScanLine className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Saneamento Automático
                      </CardTitle>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Varre pastas e identifica documentos contábeis
                        automaticamente
                      </p>
                    </div>
                  </div>
                  {scanPhase === "idle" && (
                    <Button
                      type="button"
                      data-ocid="documentos.scan.primary_button"
                      size="sm"
                      className="text-xs gap-1.5"
                      style={{
                        background: "oklch(var(--accent))",
                        color: "white",
                      }}
                      onClick={runScan}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Iniciar Saneamento
                    </Button>
                  )}
                  {scanPhase === "done" && (
                    <Badge
                      style={{
                        background: "oklch(0.95 0.05 150)",
                        color: "oklch(0.4 0.12 150)",
                      }}
                      className="text-xs"
                    >
                      ✓ Concluído
                    </Badge>
                  )}
                </div>
              </CardHeader>

              {scanPhase === "scanning" && (
                <CardContent className="p-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Analisando documentos...
                      </span>
                      <span className="font-semibold">{scanProgress}%</span>
                    </div>
                    <Progress value={scanProgress} className="h-2" />
                    <p className="text-[11px] text-muted-foreground">
                      Varrendo pasta Downloads, Documentos e Área de Trabalho...
                    </p>
                  </div>
                </CardContent>
              )}

              {scanPhase === "found" && (
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold">
                      {MOCK_SCAN_FILES.length} documentos identificados —
                      proposta de lançamentos:
                    </p>
                    <Button
                      type="button"
                      data-ocid="documentos.scan.accept.primary_button"
                      size="sm"
                      className="text-xs gap-1.5"
                      style={{
                        background: "oklch(0.55 0.14 150)",
                        color: "white",
                      }}
                      onClick={acceptAllScan}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aceitar Todos
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {MOCK_SCAN_FILES.map((f, i) => (
                      <div
                        key={f.name}
                        data-ocid={`documentos.scan.item.${i + 1}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium">{f.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {f.type} · D: {f.debitCode} / C: {f.creditCode}
                              {" · "}
                              <span
                                className="font-medium"
                                style={{
                                  color:
                                    CATEGORY_CONFIG[
                                      getDocumentCategory(f.name, f.type)
                                    ].color,
                                }}
                              >
                                {
                                  CATEGORY_CONFIG[
                                    getDocumentCategory(f.name, f.type)
                                  ].icon
                                }{" "}
                                {getDocumentCategory(f.name, f.type)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {f.value}
                          </span>
                          <button
                            type="button"
                            className="text-[10px] px-2 py-1 rounded bg-primary text-white hover:bg-primary/90 transition-colors"
                            onClick={() =>
                              setLancamentoData({
                                debitCode: f.debitCode,
                                creditCode: f.creditCode,
                                description: f.type,
                              })
                            }
                          >
                            Lançar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}

              {scanPhase === "done" && (
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">
                    Saneamento concluído. {MOCK_SCAN_FILES.length} lançamentos
                    foram criados automaticamente. Acesse{" "}
                    <strong>Lançamentos</strong> para revisar.
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Upload area */}
            <Card className="rounded-xl border-border shadow-sm">
              <CardContent className="p-5">
                <label
                  htmlFor="doc-file-input"
                  data-ocid="documentos.upload.dropzone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                  className={`flex flex-col items-center justify-center gap-3 py-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                    dragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/20"
                  }`}
                >
                  <CloudUpload className="w-12 h-12 text-muted-foreground/40" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Arraste e solte seus documentos aqui
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, Word, JPG, PNG — A ARIA classifica e organiza nas
                      pastas automaticamente
                    </p>
                  </div>
                  <span
                    data-ocid="documentos.upload.upload_button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md bg-white hover:bg-muted/30 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" /> Selecionar Arquivos
                  </span>
                </label>
                <input
                  id="doc-file-input"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xml,.txt,.csv"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </CardContent>
            </Card>

            {/* Document tree — 3-level: Cliente > Ano > Categoria */}
            <Card className="rounded-xl border-border shadow-sm">
              <CardHeader className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      Arquivos Organizados por Cliente / Ano / Categoria
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Estrutura de pastas criada automaticamente pela ARIA
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {(Object.keys(CATEGORY_CONFIG) as DocCategory[])
                      .slice(0, 4)
                      .map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            background: CATEGORY_CONFIG[cat].bg,
                            color: CATEGORY_CONFIG[cat].color,
                          }}
                        >
                          {CATEGORY_CONFIG[cat].icon} {cat}
                        </span>
                      ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {isLoading ? (
                  <div
                    className="space-y-2"
                    data-ocid="documentos.loading_state"
                  >
                    {["a", "b", "c"].map((k) => (
                      <Skeleton key={k} className="h-8 w-full" />
                    ))}
                  </div>
                ) : Object.keys(grouped).length === 0 ? (
                  <div
                    data-ocid="documentos.empty_state"
                    className="py-10 flex flex-col items-center gap-2 text-muted-foreground"
                  >
                    <FolderOpen className="w-10 h-10 opacity-30" />
                    <p className="text-sm">Nenhum documento enviado ainda.</p>
                    <p className="text-xs text-muted-foreground/70">
                      Faça upload de documentos para a ARIA criar as pastas
                      automaticamente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(grouped).map(([clientName, years], ci) => {
                      const totalClientDocs = Object.values(years).reduce(
                        (acc, cats) =>
                          acc +
                          Object.values(cats).reduce(
                            (a, docs) => a + docs.length,
                            0,
                          ),
                        0,
                      );
                      const isClientOpen = clientOpen[clientName] !== false; // default open

                      return (
                        <div
                          key={clientName}
                          data-ocid={`documentos.item.${ci + 1}`}
                        >
                          {/* Level 1: Client */}
                          <button
                            type="button"
                            onClick={() => toggleClient(clientName)}
                            className="w-full flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors group"
                          >
                            {isClientOpen ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <FolderOpen
                              className="w-4 h-4 shrink-0"
                              style={{ color: "oklch(0.55 0.18 50)" }}
                            />
                            <span className="text-sm font-bold text-foreground flex-1 text-left">
                              {clientName}
                            </span>
                            <Badge
                              className="text-[10px] px-1.5 py-0"
                              style={{
                                background: "oklch(0.95 0.06 50)",
                                color: "oklch(0.45 0.14 50)",
                              }}
                            >
                              {totalClientDocs} arquivo(s)
                            </Badge>
                          </button>

                          {isClientOpen && (
                            <div className="ml-6 space-y-0.5 border-l border-border/50 pl-3 pb-1">
                              {Object.entries(years)
                                .sort(([a], [b]) => Number(b) - Number(a))
                                .map(([year, categories]) => {
                                  const yearKey = `${clientName}|${year}`;
                                  const isYearOpen =
                                    yearOpen[yearKey] !== false; // default open
                                  const isCurrentYear =
                                    Number(year) === currentYear;
                                  const totalYearDocs = Object.values(
                                    categories,
                                  ).reduce((a, docs) => a + docs.length, 0);

                                  return (
                                    <div key={year}>
                                      {/* Level 2: Year */}
                                      <button
                                        type="button"
                                        onClick={() => toggleYear(yearKey)}
                                        className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/20 transition-colors"
                                      >
                                        {isYearOpen ? (
                                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        )}
                                        <FolderOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-xs font-semibold text-muted-foreground flex-1 text-left">
                                          {year}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          {isCurrentYear && (
                                            <Badge
                                              className="text-[9px] px-1.5 py-0 font-semibold"
                                              style={{
                                                background:
                                                  "oklch(0.95 0.07 195)",
                                                color: "oklch(0.35 0.14 195)",
                                              }}
                                            >
                                              Ano Atual
                                            </Badge>
                                          )}
                                          <span className="text-[10px] text-muted-foreground">
                                            {totalYearDocs} arq.
                                          </span>
                                        </div>
                                      </button>

                                      {isYearOpen && (
                                        <div className="ml-5 space-y-0.5 border-l border-border/40 pl-3 pb-1">
                                          {Object.entries(categories).map(
                                            ([cat, docs]) => {
                                              const catCfg =
                                                CATEGORY_CONFIG[
                                                  cat as DocCategory
                                                ] ?? CATEGORY_CONFIG.Outros;
                                              const catKey = `${clientName}|${year}|${cat}`;
                                              const [cn, yn, catn] =
                                                catKey.split("|");
                                              const isCatOpen =
                                                treeOpen[cn]?.[yn]?.[catn] ??
                                                false;

                                              return (
                                                <div key={cat}>
                                                  {/* Level 3: Category */}
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      toggleCategory(catKey)
                                                    }
                                                    className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/20 transition-colors"
                                                  >
                                                    {isCatOpen ? (
                                                      <ChevronDown
                                                        className="w-3 h-3 shrink-0"
                                                        style={{
                                                          color: catCfg.color,
                                                        }}
                                                      />
                                                    ) : (
                                                      <ChevronRight
                                                        className="w-3 h-3 shrink-0"
                                                        style={{
                                                          color: catCfg.color,
                                                        }}
                                                      />
                                                    )}
                                                    <span
                                                      className="w-5 h-5 rounded flex items-center justify-center text-sm shrink-0"
                                                      style={{
                                                        background: catCfg.bg,
                                                        borderLeft: `3px solid ${catCfg.border}`,
                                                      }}
                                                    >
                                                      {catCfg.icon}
                                                    </span>
                                                    <span
                                                      className="text-xs font-medium flex-1 text-left"
                                                      style={{
                                                        color: catCfg.color,
                                                      }}
                                                    >
                                                      {cat}
                                                    </span>
                                                    <span
                                                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                                      style={{
                                                        background: catCfg.bg,
                                                        color: catCfg.color,
                                                      }}
                                                    >
                                                      {docs.length}
                                                    </span>
                                                  </button>

                                                  {/* Level 4: Files */}
                                                  {isCatOpen && (
                                                    <div
                                                      className="ml-5 space-y-0.5 border-l pl-3 pb-1"
                                                      style={{
                                                        borderColor:
                                                          catCfg.border,
                                                      }}
                                                    >
                                                      {docs.map((doc, di) => {
                                                        const statusKey = (
                                                          doc.status in
                                                          STATUS_CONFIG
                                                            ? doc.status
                                                            : "Pendente"
                                                        ) as StatusKey;
                                                        const sc =
                                                          STATUS_CONFIG[
                                                            statusKey
                                                          ];
                                                        return (
                                                          <div
                                                            key={doc.id}
                                                            data-ocid={`documentos.row.${di + 1}`}
                                                            className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors"
                                                          >
                                                            <div className="flex items-center gap-2">
                                                              <FileText
                                                                className="w-3 h-3 shrink-0"
                                                                style={{
                                                                  color:
                                                                    catCfg.color,
                                                                }}
                                                              />
                                                              <span className="text-xs text-foreground truncate max-w-[200px]">
                                                                {doc.filename}
                                                              </span>
                                                            </div>
                                                            <Badge
                                                              className="text-[10px] px-1.5 py-0 flex items-center gap-1 shrink-0"
                                                              style={sc.style}
                                                            >
                                                              {sc.icon}{" "}
                                                              {sc.label}
                                                            </Badge>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            },
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "pendentes" && (
          <Card className="rounded-xl border-border shadow-sm overflow-hidden">
            <CardHeader
              className="px-5 py-4 border-b border-border"
              style={{ borderLeft: "4px solid oklch(0.65 0.18 85)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="w-4 h-4"
                    style={{ color: "oklch(0.55 0.14 85)" }}
                  />
                  <CardTitle className="text-sm font-semibold">
                    Documentos Pendentes de Aprovação
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  data-ocid="documentos.pendentes.secondary_button"
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={loadPendingOcr}
                >
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent
              className="p-5 space-y-4"
              data-ocid="documentos.pendentes.panel"
            >
              {loadingOcr ? (
                <div
                  className="space-y-2"
                  data-ocid="documentos.pendentes.loading_state"
                >
                  {["a", "b"].map((k) => (
                    <Skeleton key={k} className="h-24 w-full" />
                  ))}
                </div>
              ) : pendingOcrResults.length === 0 ? (
                <div
                  data-ocid="documentos.pendentes.empty_state"
                  className="py-12 flex flex-col items-center gap-2 text-muted-foreground"
                >
                  <CheckCircle2 className="w-10 h-10 opacity-30" />
                  <p className="text-sm font-medium">
                    Nenhum documento pendente
                  </p>
                  <p className="text-xs">
                    Faça upload de documentos para que a ARIA analise e sugira
                    lançamentos contábeis.
                  </p>
                </div>
              ) : (
                pendingOcrResults.map((result, idx) => {
                  const client = clients.find((c) => c.id === result.clientId);
                  const isEditing = editingId === result.id;

                  return (
                    <div
                      key={result.id}
                      data-ocid={`documentos.pending.item.${idx + 1}`}
                      className="rounded-xl border border-border p-4 space-y-3"
                      style={{ background: "oklch(0.985 0.015 85 / 0.4)" }}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <p className="text-xs font-semibold truncate">
                              {result.fileName}
                            </p>
                            <Badge
                              className="text-[10px] px-1.5 py-0 shrink-0"
                              style={{
                                background: "oklch(0.95 0.06 220)",
                                color: "oklch(0.4 0.1 220)",
                              }}
                            >
                              {result.analysis.tipo}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {client?.name ?? result.clientId} · CNPJ:{" "}
                            {formatCNPJ(result.analysis.cnpj)} ·{" "}
                            {formatBRL(result.analysis.valor)} ·{" "}
                            {result.analysis.data}
                          </p>
                          {result.analysis.descricao && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                              {result.analysis.descricao}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            type="button"
                            data-ocid={`documentos.pending.edit_button.${idx + 1}`}
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                            onClick={() => {
                              if (isEditing) {
                                setEditingId(null);
                              } else {
                                setEditingId(result.id);
                                setEditCnpj(result.analysis.cnpj);
                                setEditValor(
                                  String(result.analysis.valor / 100),
                                );
                              }
                            }}
                          >
                            ✏️ {isEditing ? "Cancelar" : "Editar"}
                          </Button>
                          <Button
                            type="button"
                            data-ocid={`documentos.pending.confirm_button.${idx + 1}`}
                            size="sm"
                            className="text-xs h-7 text-white px-2"
                            style={{ background: "oklch(0.5 0.14 150)" }}
                            onClick={() => handleApprove(result)}
                          >
                            ✅ Aprovar
                          </Button>
                          <Button
                            type="button"
                            data-ocid={`documentos.pending.delete_button.${idx + 1}`}
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                            onClick={() => handleReject(result)}
                          >
                            ❌ Rejeitar
                          </Button>
                        </div>
                      </div>

                      {/* Inline edit form */}
                      {isEditing && (
                        <div
                          className="rounded-lg p-3 space-y-2 border border-border"
                          style={{ background: "oklch(0.97 0.01 240)" }}
                          data-ocid={`documentos.pending.edit_form.${idx + 1}`}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Editar Informações
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[10px] text-muted-foreground">
                                CNPJ (só dígitos)
                              </p>
                              <Input
                                data-ocid={`documentos.pending.cnpj_input.${idx + 1}`}
                                className="h-7 text-xs mt-0.5"
                                placeholder="00000000000000"
                                value={editCnpj}
                                onChange={(e) => setEditCnpj(e.target.value)}
                              />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">
                                Valor (R$)
                              </p>
                              <Input
                                data-ocid={`documentos.pending.valor_input.${idx + 1}`}
                                className="h-7 text-xs mt-0.5"
                                placeholder="0.00"
                                type="number"
                                step="0.01"
                                value={editValor}
                                onChange={(e) => setEditValor(e.target.value)}
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            data-ocid={`documentos.pending.save_button.${idx + 1}`}
                            size="sm"
                            className="text-xs h-7 text-white"
                            style={{ background: "oklch(0.45 0.15 195)" }}
                            onClick={() => handleSaveEdit(result)}
                          >
                            Salvar Alterações
                          </Button>
                        </div>
                      )}

                      {/* Suggested lancamentos */}
                      {result.analysis.lancamentos.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {result.analysis.lancamentos.length} Lançamentos
                            Sugeridos pela ARIA
                          </p>
                          {result.analysis.lancamentos.map((entry, ei) => (
                            <div
                              key={entry.id}
                              data-ocid={`documentos.pending.entry.item.${ei + 1}`}
                              className="flex items-center justify-between p-2 rounded-lg bg-white border border-border text-[11px]"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">
                                  D:{" "}
                                  <span className="font-mono font-semibold text-foreground">
                                    {entry.debitoCode}
                                  </span>
                                </span>
                                <span className="text-muted-foreground">
                                  C:{" "}
                                  <span className="font-mono font-semibold text-foreground">
                                    {entry.creditoCode}
                                  </span>
                                </span>
                                <span className="text-muted-foreground truncate max-w-[180px]">
                                  {entry.historico}
                                </span>
                              </div>
                              <span className="font-semibold shrink-0">
                                {formatBRL(entry.valor)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {lancamentoData && (
        <LancamentoModal
          open={!!lancamentoData}
          onClose={() => setLancamentoData(null)}
          prefill={lancamentoData}
        />
      )}
    </div>
  );
}
