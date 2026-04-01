import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot,
  Calendar,
  FileImage,
  FileText,
  Loader2,
  Plus,
  Search,
  SendToBack,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import { analyzeDocument } from "../lib/claudeService";
import { getAllRecords, putRecord } from "../lib/db";

interface Cliente {
  id: string;
  name: string;
  cnpj: string;
}

interface OcrResultRaw {
  id: string;
  clientId: string;
  fileName: string;
  status: string;
  createdAt: string;
  analysis: {
    tipo: string;
    cnpj: string;
    valor: number;
    data: string;
    descricao: string;
  };
  imageData?: string;
  extractedText?: string;
}

interface SearchResult extends OcrResultRaw {
  clienteName: string;
  matchCount: number;
  snippet: string;
}

const TIPO_OPTIONS = [
  { value: "todos", label: "Todos os tipos" },
  { value: "NF-e", label: "NF-e" },
  { value: "Recibo", label: "Recibo" },
  { value: "Contrato", label: "Contrato" },
  { value: "Extrato Bancário", label: "Extrato" },
  { value: "Folha de Pagamento", label: "Folha de Pagamento" },
  { value: "Outro", label: "Outros" },
];

const TIPO_COLORS: Record<string, string> = {
  "NF-e": "bg-blue-100 text-blue-800",
  Recibo: "bg-green-100 text-green-800",
  Contrato: "bg-purple-100 text-purple-800",
  "Extrato Bancário": "bg-orange-100 text-orange-800",
  "Folha de Pagamento": "bg-pink-100 text-pink-800",
  Outro: "bg-gray-100 text-gray-700",
};

function highlightText(text: string, term: string): React.ReactNode {
  if (!term.trim()) return text;
  const escaped = term.replace(/[.*+?^${}()|\[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  const nodes: React.ReactNode[] = [];
  let matchIdx = 0;
  for (const part of parts) {
    if (regex.test(part)) {
      nodes.push(
        <mark
          key={`m${matchIdx++}`}
          className="bg-yellow-200 text-yellow-900 rounded px-0.5 font-semibold"
        >
          {part}
        </mark>,
      );
    } else {
      nodes.push(part);
    }
    regex.lastIndex = 0;
  }
  return nodes;
}

function buildSnippet(text: string, term: string, maxLen = 180): string {
  if (!text) return "";
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text.slice(0, maxLen);
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + term.length + 100);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = `\u2026${snippet}`;
  if (end < text.length) snippet = `${snippet}\u2026`;
  return snippet;
}

function countMatches(text: string, term: string): number {
  if (!text || !term) return 0;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  return (text.match(regex) ?? []).length;
}

export default function BuscaImagens() {
  const { addMessage, setIsChatOpen } = useARIA();

  const [query, setQuery] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [clienteFilter, setClienteFilter] = useState("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [totalDocs, setTotalDocs] = useState(0);
  const [totalWithOcr, setTotalWithOcr] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      getAllRecords<Cliente>("clients"),
      getAllRecords<OcrResultRaw>("ocr_results"),
    ])
      .then(([cls, ocrs]) => {
        setClientes(cls);
        setTotalDocs(ocrs.length);
        setTotalWithOcr(
          ocrs.filter((r) => r.extractedText?.trim() || r.analysis?.descricao)
            .length,
        );
      })
      .catch(() => {});
  }, []);

  const buildClienteMap = useCallback(
    () => Object.fromEntries(clientes.map((c) => [c.id, c.name])),
    [clientes],
  );

  const handleSearch = useCallback(async () => {
    const term = query.trim();
    if (!term) {
      toast.warning("Digite um termo para buscar");
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      const ocrDocs = await getAllRecords<OcrResultRaw>("ocr_results");
      const clienteMap = buildClienteMap();

      const filtered = ocrDocs.filter((doc) => {
        const searchFields = [
          doc.extractedText ?? "",
          doc.analysis?.descricao ?? "",
          doc.analysis?.cnpj ?? "",
          doc.analysis?.tipo ?? "",
          doc.fileName ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (!searchFields.includes(term.toLowerCase())) return false;
        if (clienteFilter !== "todos" && doc.clientId !== clienteFilter)
          return false;
        if (tipoFilter !== "todos" && doc.analysis?.tipo !== tipoFilter)
          return false;
        if (dateStart && doc.analysis?.data && doc.analysis.data < dateStart)
          return false;
        if (dateEnd && doc.analysis?.data && doc.analysis.data > dateEnd)
          return false;
        return true;
      });

      const mapped: SearchResult[] = filtered.map((doc) => {
        const searchText = [
          doc.extractedText ?? "",
          doc.analysis?.descricao ?? "",
          doc.fileName ?? "",
        ].join(" ");
        return {
          ...doc,
          clienteName: clienteMap[doc.clientId] ?? "Cliente não identificado",
          matchCount: countMatches(searchText, term),
          snippet: buildSnippet(searchText, term),
        };
      });

      mapped.sort((a, b) => {
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        return b.createdAt.localeCompare(a.createdAt);
      });

      setResults(mapped);

      setIsChatOpen(true);
      if (mapped.length === 0) {
        addMessage({
          type: "warning",
          text: `🔍 Nenhum documento encontrado com "${term}". Tente executar o OCR em mais documentos clicando em "Analisar com ARIA".`,
        });
      } else {
        const tipoCount: Record<string, number> = {};
        for (const r of mapped) {
          const t = r.analysis?.tipo ?? "Outro";
          tipoCount[t] = (tipoCount[t] ?? 0) + 1;
        }
        const tipoStr = Object.entries(tipoCount)
          .map(([t, n]) => `${n} ${t}`)
          .join(", ");
        addMessage({
          type: "success",
          text: `🔍 Encontrei ${mapped.length} documento${mapped.length > 1 ? "s" : ""} com "${term}" — ${tipoStr}.`,
        });
      }
    } catch (err) {
      toast.error("Erro ao buscar documentos");
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }, [
    query,
    clienteFilter,
    tipoFilter,
    dateStart,
    dateEnd,
    buildClienteMap,
    addMessage,
    setIsChatOpen,
  ]);

  const handleAnalyzeAll = useCallback(async () => {
    const apiKey = localStorage.getItem("claudeApiKey");
    const useReal = localStorage.getItem("useRealProcessing") === "true";

    setIsAnalyzing(true);
    setIsChatOpen(true);
    addMessage({
      type: "info",
      text: "🔍 ARIA iniciando análise OCR de todos os documentos pendentes...",
    });

    try {
      const ocrDocs = await getAllRecords<OcrResultRaw>("ocr_results");
      const unanalyzed = ocrDocs.filter((d) => !d.extractedText && d.imageData);

      if (unanalyzed.length === 0) {
        addMessage({
          type: "info",
          text: "✅ Todos os documentos já foram analisados ou não possuem imagem para OCR.",
        });
        toast.info("Nenhum documento novo para analisar");
        return;
      }

      if (!apiKey || !useReal) {
        for (const doc of unanalyzed) {
          const simText = `Documento: ${doc.fileName}\nTipo: ${doc.analysis?.tipo ?? "NF-e"}\nCNPJ: ${doc.analysis?.cnpj ?? "12.345.678/0001-99"}\nValor: R$ ${((doc.analysis?.valor ?? 0) / 100).toFixed(2)}\nData: ${doc.analysis?.data ?? new Date().toISOString().slice(0, 10)}\nDescrição: ${doc.analysis?.descricao ?? "Documento processado pelo OCR simulado"}`;
          await putRecord("ocr_results", { ...doc, extractedText: simText });
        }
        addMessage({
          type: "success",
          text: `✅ OCR simulado concluído: ${unanalyzed.length} documento(s) indexados. Para OCR real, configure a Claude API em Configurações → ARIA.`,
        });
        toast.success(
          `${unanalyzed.length} documentos indexados (modo simulado)`,
        );
      } else {
        let processed = 0;
        for (const doc of unanalyzed) {
          try {
            const analysis = await analyzeDocument(
              `[IMAGE_BASE64]${doc.imageData}`,
              doc.fileName,
              apiKey,
            );
            await putRecord("ocr_results", {
              ...doc,
              extractedText: analysis.descricao,
              analysis,
            });
            processed++;
          } catch {
            // skip individual failures
          }
        }
        addMessage({
          type: "success",
          text: `✅ OCR real concluído: ${processed} de ${unanalyzed.length} documentos analisados.`,
        });
        toast.success(`${processed} documentos analisados`);
      }

      const all = await getAllRecords<OcrResultRaw>("ocr_results");
      setTotalDocs(all.length);
      setTotalWithOcr(
        all.filter((r) => r.extractedText?.trim() || r.analysis?.descricao)
          .length,
      );
    } catch (err) {
      toast.error("Erro ao analisar documentos");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [addMessage, setIsChatOpen]);

  const handleEnviarWorkflow = useCallback(
    async (doc: SearchResult) => {
      const id = `wf_busca_${doc.id}_${Date.now()}`;
      await putRecord("workflow_items", {
        id,
        tipo: "lancamento",
        clientId: doc.clientId,
        clientName: doc.clienteName,
        valor: doc.analysis?.valor ?? 0,
        descricao: `Documento: ${doc.fileName}`,
        status_atual: "pendente",
        nivel_aprovacao: 1,
        id_responsavel: null,
        historico_notas: [],
        id_documento: doc.id,
        createdAt: new Date().toISOString(),
      });
      toast.success("Documento enviado para o Workflow de Aprovação");
      addMessage({
        type: "info",
        text: `📋 Documento "${doc.fileName}" enviado para aprovação no Workflow.`,
      });
    },
    [addMessage],
  );

  const clearFilters = () => {
    setDateStart("");
    setDateEnd("");
    setClienteFilter("todos");
    setTipoFilter("todos");
  };

  const hasFilters =
    dateStart || dateEnd || clienteFilter !== "todos" || tipoFilter !== "todos";

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Busca em Imagens
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Pesquise texto dentro de documentos digitalizados e OCR
            </p>
          </div>
          <Button
            data-ocid="busca.open_modal_button"
            variant="outline"
            onClick={handleAnalyzeAll}
            disabled={isAnalyzing}
            className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
            Analisar com ARIA
          </Button>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              ref={inputRef}
              data-ocid="busca.search_input"
              placeholder="Buscar por texto, CNPJ, valor, tipo de documento..."
              className="pl-9 h-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button
            data-ocid="busca.primary_button"
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-5"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span className="ml-2 hidden sm:inline">Buscar</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 mt-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-500">Data início</Label>
            <Input
              data-ocid="busca.input"
              type="date"
              className="h-8 text-xs w-36"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-500">Data fim</Label>
            <Input
              data-ocid="busca.input"
              type="date"
              className="h-8 text-xs w-36"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-500">Cliente</Label>
            <Select value={clienteFilter} onValueChange={setClienteFilter}>
              <SelectTrigger
                data-ocid="busca.select"
                className="h-8 text-xs w-44"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os clientes</SelectItem>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-500">Tipo</Label>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger
                data-ocid="busca.select"
                className="h-8 text-xs w-40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPO_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-gray-500 gap-1"
            >
              <X className="w-3 h-3" /> Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <strong className="text-gray-800">{totalDocs}</strong> documentos
          indexados
        </span>
        <span className="flex items-center gap-1.5">
          <FileImage className="w-3.5 h-3.5" />
          <strong className="text-gray-800">{totalWithOcr}</strong> com texto
          OCR
        </span>
        {hasSearched && (
          <span className="flex items-center gap-1.5 text-blue-600">
            <Search className="w-3.5 h-3.5" />
            <strong>{results.length}</strong> resultado
            {results.length !== 1 ? "s" : ""} encontrado
            {results.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-auto p-6">
        {isSearching && (
          <div
            data-ocid="busca.loading_state"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex gap-3">
                  <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <div
            data-ocid="busca.empty_state"
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Nenhum resultado encontrado
            </h3>
            <p className="text-sm text-gray-400 max-w-sm mb-4">
              Não encontramos documentos com &quot;{query}&quot;. Experimente
              outros termos ou clique em &quot;Analisar com ARIA&quot; para
              indexar mais documentos.
            </p>
            <Button
              variant="outline"
              onClick={handleAnalyzeAll}
              disabled={isAnalyzing}
              className="gap-2 text-blue-600 border-blue-200"
            >
              <Bot className="w-4 h-4" />
              Analisar com ARIA
            </Button>
          </div>
        )}

        {!isSearching && !hasSearched && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "oklch(0.95 0.04 240)" }}
            >
              <Search
                className="w-10 h-10"
                style={{ color: "oklch(0.45 0.18 240)" }}
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Busca por texto em documentos
            </h3>
            <p className="text-sm text-gray-400 max-w-md">
              Digite um termo acima para pesquisar dentro de documentos
              digitalizados, PDFs, notas fiscais, extratos e qualquer documento
              com texto OCR.
            </p>
            {totalDocs === 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 max-w-sm">
                <Bot className="w-4 h-4 inline mr-1" />
                Nenhum documento encontrado. Digitalize documentos em{" "}
                <span className="font-semibold">Digitalização</span> e clique em{" "}
                <span className="font-semibold">Analisar com ARIA</span> para
                indexá-los.
              </div>
            )}
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {results.map((doc, idx) => (
              <ResultCard
                key={doc.id}
                doc={doc}
                query={query}
                index={idx + 1}
                onEnviarWorkflow={handleEnviarWorkflow}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ResultCardProps {
  doc: SearchResult;
  query: string;
  index: number;
  onEnviarWorkflow: (doc: SearchResult) => Promise<void>;
}

function ResultCard({ doc, query, index, onEnviarWorkflow }: ResultCardProps) {
  const [sending, setSending] = useState(false);
  const tipo = doc.analysis?.tipo ?? "Outro";
  const tipoClass = TIPO_COLORS[tipo] ?? TIPO_COLORS.Outro;
  const valorFormatted = doc.analysis?.valor
    ? (doc.analysis.valor / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : null;

  const handleWorkflow = async () => {
    setSending(true);
    try {
      await onEnviarWorkflow(doc);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card
      data-ocid={`busca.item.${index}`}
      className="hover:shadow-md transition-shadow border-gray-200"
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
            {doc.imageData ? (
              <img
                src={doc.imageData}
                alt={doc.fileName}
                className="w-full h-full object-cover"
              />
            ) : (
              <FileText className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {doc.fileName}
            </p>
            <p className="text-xs text-gray-500 truncate">{doc.clienteName}</p>
          </div>
          <Badge
            className={`text-[10px] px-1.5 py-0.5 flex-shrink-0 border-0 ${tipoClass}`}
          >
            {tipo}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        <div className="text-xs text-gray-600 bg-gray-50 rounded-md p-2.5 border border-gray-100 min-h-[48px] leading-relaxed">
          {doc.snippet ? (
            highlightText(doc.snippet, query)
          ) : (
            <span className="text-gray-400 italic">
              Sem texto OCR disponível
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {doc.analysis?.data && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(`${doc.analysis.data}T00:00:00`).toLocaleDateString(
                "pt-BR",
              )}
            </span>
          )}
          {valorFormatted && (
            <span className="font-medium text-green-700">{valorFormatted}</span>
          )}
          {doc.matchCount > 1 && (
            <span className="ml-auto text-blue-500 font-medium">
              {doc.matchCount} ocorrências
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            data-ocid={`busca.secondary_button.${index}`}
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs gap-1"
            onClick={() => toast.info(`Abrindo documento: ${doc.fileName}`)}
          >
            <FileText className="w-3 h-3" />
            Ver Doc
          </Button>
          <Button
            data-ocid={`busca.button.${index}`}
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
            onClick={handleWorkflow}
            disabled={sending}
          >
            {sending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <SendToBack className="w-3 h-3" />
            )}
            Workflow
          </Button>
          <Button
            data-ocid={`busca.edit_button.${index}`}
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 text-purple-600 border-purple-200 hover:bg-purple-50"
            title="Adicionar Nota"
            onClick={() => toast.info("Abra Notas para vincular ao documento")}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
