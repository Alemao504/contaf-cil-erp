import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  ExternalLink,
  Globe,
  Loader2,
  Scissors,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import { deleteRecord, getAllRecords, putRecord } from "../lib/db";

interface WebClip {
  id: string;
  url: string;
  titulo: string;
  excerpt: string;
  tags: string[];
  clienteId?: string;
  clienteNome?: string;
  criadoEm: string;
  modo: "simulado" | "real";
}

interface Cliente {
  id: string;
  name: string;
}

interface CapturedPreview {
  titulo: string;
  url: string;
  excerpt: string;
  tags: string[];
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function generateSimulatedData(url: string): CapturedPreview {
  const lower = url.toLowerCase();
  if (lower.includes("receita")) {
    return {
      titulo: "Receita Federal - Simples Nacional",
      url,
      excerpt:
        "O Simples Nacional é um regime compartilhado de arrecadação, cobrança e fiscalização de tributos aplicável às Microempresas e Empresas de Pequeno Porte. Abrange a participação de todos os entes federados (União, Estados, Distrito Federal e Municípios). As alíquotas variam de acordo com o anexo e a faixa de faturamento da empresa.",
      tags: [
        "Simples Nacional",
        "Tributos",
        "Receita Federal",
        "Regime Tributário",
      ],
    };
  }
  if (lower.includes("sped")) {
    return {
      titulo: "SPED - Sistema Público de Escrituração Digital",
      url,
      excerpt:
        "O Sistema Público de Escrituração Digital (SPED) modernizou a sistemática atual do cumprimento das obrigações acessórias. São subprojetos do SPED: Escrituração Contábil Digital (ECD), Escrituração Fiscal Digital (EFD), NF-e Nacional, NFS-e, CT-e, e-Social, EFD-Reinf.",
      tags: ["SPED", "ECD", "EFD", "Obrigações Acessórias"],
    };
  }
  if (lower.includes("contabilidade") || lower.includes("contabil")) {
    return {
      titulo: "Guia de Contabilidade 2024 - NBC TG",
      url,
      excerpt:
        "As Normas Brasileiras de Contabilidade (NBC TG) são emitidas pelo Conselho Federal de Contabilidade e visam convergir as práticas contábeis brasileiras aos padrões internacionais IFRS. A NBC TG 1000 é especialmente voltada para entidades de pequeno e médio porte.",
      tags: ["NBC TG", "IFRS", "Normas Contábeis", "CFC"],
    };
  }
  if (lower.includes("esocial") || lower.includes("e-social")) {
    return {
      titulo: "eSocial - Eventos e Obrigações Trabalhistas",
      url,
      excerpt:
        "O eSocial é um projeto do governo federal que unifica o envio de informações pelo empregador em relação aos seus empregados. Substitui o preenchimento e entrega de formulários e declarações separadas como RAIS, CAGED, DIRF, GFIP e outros.",
      tags: ["eSocial", "Trabalhista", "Folha de Pagamento", "GFIP"],
    };
  }
  if (lower.includes("cnpj") || lower.includes("empresa")) {
    return {
      titulo: "Consulta e Gestão de CNPJ - Receita Federal",
      url,
      excerpt:
        "O Cadastro Nacional da Pessoa Jurídica (CNPJ) é o número de identificação das empresas e outras entidades registradas na Receita Federal do Brasil. Todas as atividades econômicas, filantrópicas, políticas e associativas devem ter CNPJ.",
      tags: ["CNPJ", "Cadastro", "Receita Federal", "Empresas"],
    };
  }
  const domain = getDomain(url);
  return {
    titulo: `Artigo Capturado - ${domain}`,
    url,
    excerpt:
      "Conteúdo relacionado à contabilidade e gestão fiscal capturado para análise. Os dados extraídos podem ser vinculados a um cliente e utilizados como referência em processos contábeis, fiscais ou tributários. A ARIA pode analisar e sugerir lançamentos automaticamente.",
    tags: ["Referência", "Contabilidade", "Análise"],
  };
}

async function fetchRealContent(url: string): Promise<CapturedPreview> {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const resp = await fetch(proxyUrl);
  if (!resp.ok) throw new Error("Falha ao buscar conteúdo");
  const data = await resp.json();
  const html: string = data.contents || "";

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    ) ||
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    );

  const titulo = titleMatch ? titleMatch[1].trim() : getDomain(url);
  const bodyText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
  const excerpt = descMatch ? descMatch[1].trim() : bodyText;

  const words = `${titulo} ${excerpt}`.toLowerCase();
  const tags: string[] = [];
  if (words.includes("contabil") || words.includes("contab"))
    tags.push("Contabilidade");
  if (words.includes("fiscal") || words.includes("tribut")) tags.push("Fiscal");
  if (
    words.includes("imposto") ||
    words.includes("irpj") ||
    words.includes("csll")
  )
    tags.push("Impostos");
  if (words.includes("sped") || words.includes("escritur")) tags.push("SPED");
  if (words.includes("cnpj") || words.includes("empresa"))
    tags.push("Empresas");
  if (tags.length === 0) tags.push("Referência Web");

  return { titulo, url, excerpt: excerpt.slice(0, 280), tags };
}

export default function WebClipper() {
  const { addMessage } = useARIA();
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<CapturedPreview | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [clips, setClips] = useState<WebClip[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCliente, setFilterCliente] = useState("todos");
  const [modoReal, setModoReal] = useState(false);

  const loadData = useCallback(async () => {
    const [allClips, allClientes] = await Promise.all([
      getAllRecords<WebClip>("web_clips"),
      getAllRecords<Cliente>("clients"),
    ]);
    setClips(allClips.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)));
    setClientes(allClientes);
  }, []);

  useEffect(() => {
    const savedMode = localStorage.getItem("webClipperReal");
    setModoReal(savedMode === "true");
    loadData();
  }, [loadData]);

  const handleCapturar = async () => {
    if (!urlInput.trim()) {
      toast.error("Digite uma URL para capturar");
      return;
    }
    let url = urlInput.trim();
    if (!/^https?:\/\//.test(url)) url = `https://${url}`;
    setLoading(true);
    setPreview(null);
    try {
      let data: CapturedPreview;
      if (modoReal) {
        data = await fetchRealContent(url);
      } else {
        await new Promise((r) => setTimeout(r, 900));
        data = generateSimulatedData(url);
      }
      setPreview(data);
      setUrlInput(url);
    } catch {
      toast.error(
        "Não foi possível capturar o conteúdo da página. Verifique a URL e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (!preview) return;
    const cliente = clientes.find((c) => c.id === selectedClienteId);
    const clip: WebClip = {
      id: Date.now().toString(),
      url: preview.url,
      titulo: preview.titulo,
      excerpt: preview.excerpt,
      tags: preview.tags,
      clienteId: cliente?.id,
      clienteNome: cliente?.name,
      criadoEm: new Date().toISOString(),
      modo: modoReal ? "real" : "simulado",
    };
    await putRecord("web_clips", clip);
    await loadData();
    addMessage({
      type: "info",
      text: `📎 Web Clip salvo: "${clip.titulo}" — ${clip.excerpt.slice(0, 100)}... ${cliente ? `Vinculado ao cliente: ${cliente.name}.` : ""} Tags: ${clip.tags.join(", ")}.`,
    });
    toast.success("Clip salvo com sucesso!");
    setPreview(null);
    setUrlInput("");
    setSelectedClienteId("");
  };

  const handleSalvarNota = () => {
    if (!preview) return;
    toast.info("Abra o módulo Notas para visualizar o conteúdo capturado");
    addMessage({
      type: "info",
      text: `📝 Conteúdo de "${preview.titulo}" preparado para o módulo Notas. Acesse Notas no menu lateral para criar a nota com este conteúdo.`,
    });
  };

  const handleAnalisarAria = (clip?: WebClip) => {
    const item = clip ? clip : preview;
    if (!item) return;
    const titulo = "titulo" in item ? item.titulo : "";
    const domain = "url" in item ? getDomain(item.url) : "";
    const excerpt = "excerpt" in item ? item.excerpt : "";
    const tags = "tags" in item ? item.tags.join(", ") : "";
    const clienteInfo =
      "clienteNome" in item && item.clienteNome
        ? `o cliente ${item.clienteNome}.`
        : "análise fiscal ou contábil.";
    addMessage({
      type: "info",
      text: `🔍 Analisando Web Clip: "${titulo}"

📄 Fonte: ${domain}
📝 Conteúdo: ${excerpt}

🏷️ Tags identificadas: ${tags}

💡 Recomendação: Este conteúdo pode ser relevante para ${clienteInfo} Verifique se há algum lançamento contábil ou obrigação fiscal que precise ser criada com base nestas informações.`,
    });
    toast.success("ARIA analisou o clip");
  };

  const handleExcluir = async (id: string) => {
    await deleteRecord("web_clips", id);
    await loadData();
    toast.success("Clip excluído");
  };

  const filteredClips = clips.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      c.titulo.toLowerCase().includes(q) ||
      c.excerpt.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q));
    const matchCliente =
      filterCliente === "todos" || c.clienteId === filterCliente;
    return matchSearch && matchCliente;
  });

  return (
    <div
      className="flex flex-col h-full min-h-screen"
      style={{ background: "oklch(0.10 0.03 240)" }}
    >
      {/* Header */}
      <div
        className="flex-none px-6 py-5 border-b"
        style={{ borderColor: "oklch(0.25 0.06 240)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{ background: "oklch(0.22 0.1 230 / 0.4)" }}
            >
              <Scissors
                className="w-5 h-5"
                style={{ color: "oklch(0.65 0.18 230)" }}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Web Clipper</h1>
              <p className="text-xs" style={{ color: "oklch(0.6 0.1 240)" }}>
                Capture conteúdo de páginas web para análise e vinculação
              </p>
            </div>
          </div>
          <Badge
            className="text-[10px] border-0 font-semibold"
            style={{
              background: modoReal
                ? "oklch(0.22 0.1 150 / 0.5)"
                : "oklch(0.25 0.08 60 / 0.5)",
              color: modoReal ? "oklch(0.7 0.18 150)" : "oklch(0.75 0.15 60)",
            }}
          >
            {modoReal ? "🟢 Modo Real" : "🔴 Simulado"}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Capture Panel */}
          <Card
            data-ocid="webclipper.capture.card"
            style={{
              background: "oklch(0.14 0.04 240)",
              border: "1px solid oklch(0.25 0.06 240)",
            }}
          >
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Globe
                  className="w-4 h-4"
                  style={{ color: "oklch(0.65 0.18 230)" }}
                />
                Capturar Página Web
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <div className="flex gap-2">
                <Input
                  data-ocid="webclipper.url.input"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 text-sm h-9"
                  style={{
                    background: "oklch(0.18 0.04 240)",
                    border: "1px solid oklch(0.28 0.06 240)",
                    color: "white",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleCapturar()}
                />
                <Button
                  data-ocid="webclipper.capture.button"
                  onClick={handleCapturar}
                  disabled={loading}
                  size="sm"
                  className="shrink-0"
                  style={{
                    background: "oklch(0.5 0.18 230)",
                    color: "white",
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Scissors className="w-4 h-4 mr-1" />
                  )}
                  {loading ? "Capturando..." : "Capturar Página"}
                </Button>
              </div>

              {/* Preview */}
              <AnimatePresence>
                {preview && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div
                      className="rounded-xl p-4 space-y-3"
                      style={{
                        background: "oklch(0.18 0.05 240)",
                        border: "1px solid oklch(0.3 0.08 230)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-white truncate">
                            {preview.titulo}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <ExternalLink
                              className="w-3 h-3"
                              style={{ color: "oklch(0.6 0.1 240)" }}
                            />
                            <span
                              className="text-[11px] truncate"
                              style={{ color: "oklch(0.6 0.1 240)" }}
                            >
                              {getDomain(preview.url)}
                            </span>
                            <span
                              className="text-[10px]"
                              style={{ color: "oklch(0.5 0.08 240)" }}
                            >
                              · {new Date().toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreview(null)}
                          className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5 text-white/50" />
                        </button>
                      </div>

                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "oklch(0.7 0.08 240)" }}
                      >
                        {preview.excerpt}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {preview.tags.map((tag) => (
                          <Badge
                            key={tag}
                            className="text-[10px] border-0"
                            style={{
                              background: "oklch(0.22 0.1 230 / 0.4)",
                              color: "oklch(0.7 0.15 230)",
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Client selector */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-white/60">
                          Vincular a Cliente (opcional)
                        </Label>
                        <Select
                          value={selectedClienteId}
                          onValueChange={setSelectedClienteId}
                        >
                          <SelectTrigger
                            data-ocid="webclipper.cliente.select"
                            className="h-8 text-xs"
                            style={{
                              background: "oklch(0.18 0.04 240)",
                              border: "1px solid oklch(0.28 0.06 240)",
                              color: "white",
                            }}
                          >
                            <SelectValue placeholder="Selecionar cliente..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhum</SelectItem>
                            {clientes.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          data-ocid="webclipper.save.button"
                          size="sm"
                          onClick={handleSalvar}
                          className="text-xs h-8"
                          style={{
                            background: "oklch(0.45 0.2 150)",
                            color: "white",
                          }}
                        >
                          Salvar Clip
                        </Button>
                        <Button
                          data-ocid="webclipper.save_nota.button"
                          size="sm"
                          variant="outline"
                          onClick={handleSalvarNota}
                          className="text-xs h-8 border-white/20 text-white/70 hover:bg-white/10"
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          Salvar como Nota
                        </Button>
                        <Button
                          data-ocid="webclipper.aria.button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleAnalisarAria()}
                          className="text-xs h-8 border-white/20 text-white/70 hover:bg-white/10"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Analisar com ARIA
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Clips List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Clips Salvos</h2>
              <Badge
                className="text-[10px] border-0"
                style={{
                  background: "oklch(0.22 0.06 240)",
                  color: "oklch(0.7 0.1 240)",
                }}
              >
                {filteredClips.length} clip
                {filteredClips.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: "oklch(0.5 0.08 240)" }}
                />
                <Input
                  data-ocid="webclipper.search.input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar clips..."
                  className="pl-8 h-8 text-xs"
                  style={{
                    background: "oklch(0.16 0.04 240)",
                    border: "1px solid oklch(0.25 0.06 240)",
                    color: "white",
                  }}
                />
              </div>
              <Select value={filterCliente} onValueChange={setFilterCliente}>
                <SelectTrigger
                  data-ocid="webclipper.filter.select"
                  className="h-8 text-xs w-44"
                  style={{
                    background: "oklch(0.16 0.04 240)",
                    border: "1px solid oklch(0.25 0.06 240)",
                    color: "white",
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Clientes</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grid */}
            <AnimatePresence mode="popLayout">
              {filteredClips.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  data-ocid="webclipper.empty_state"
                >
                  <Card
                    style={{
                      background: "oklch(0.14 0.04 240)",
                      border: "1px solid oklch(0.22 0.06 240)",
                    }}
                  >
                    <CardContent className="py-12 flex flex-col items-center gap-3">
                      <Scissors
                        className="w-8 h-8"
                        style={{ color: "oklch(0.4 0.1 240)" }}
                      />
                      <p className="text-sm text-white/50">
                        {clips.length === 0
                          ? "Nenhum clip salvo ainda. Capture uma página acima!"
                          : "Nenhum clip encontrado para os filtros selecionados."}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredClips.map((clip, idx) => (
                    <motion.div
                      key={clip.id}
                      data-ocid={`webclipper.item.${idx + 1}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <Card
                        style={{
                          background: "oklch(0.14 0.04 240)",
                          border: "1px solid oklch(0.25 0.06 240)",
                        }}
                      >
                        <CardContent className="p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-white truncate">
                                {clip.titulo}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <ExternalLink
                                  className="w-3 h-3 shrink-0"
                                  style={{ color: "oklch(0.55 0.1 240)" }}
                                />
                                <span
                                  className="text-[11px] truncate"
                                  style={{ color: "oklch(0.55 0.1 240)" }}
                                >
                                  {getDomain(clip.url)}
                                </span>
                              </div>
                            </div>
                            <Badge
                              className="text-[9px] border-0 shrink-0"
                              style={{
                                background:
                                  clip.modo === "real"
                                    ? "oklch(0.22 0.1 150 / 0.4)"
                                    : "oklch(0.22 0.08 60 / 0.4)",
                                color:
                                  clip.modo === "real"
                                    ? "oklch(0.65 0.16 150)"
                                    : "oklch(0.7 0.14 60)",
                              }}
                            >
                              {clip.modo === "real" ? "Real" : "Simulado"}
                            </Badge>
                          </div>

                          <p
                            className="text-xs leading-relaxed line-clamp-2"
                            style={{ color: "oklch(0.65 0.08 240)" }}
                          >
                            {clip.excerpt}
                          </p>

                          <div className="flex flex-wrap gap-1">
                            {clip.tags.map((tag) => (
                              <Badge
                                key={tag}
                                className="text-[9px] border-0"
                                style={{
                                  background: "oklch(0.2 0.08 230 / 0.5)",
                                  color: "oklch(0.65 0.14 230)",
                                }}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              {clip.clienteNome && (
                                <Badge
                                  className="text-[9px] border-0"
                                  style={{
                                    background: "oklch(0.22 0.1 280 / 0.4)",
                                    color: "oklch(0.7 0.15 280)",
                                  }}
                                >
                                  {clip.clienteNome}
                                </Badge>
                              )}
                              <span
                                className="text-[10px]"
                                style={{ color: "oklch(0.5 0.07 240)" }}
                              >
                                {new Date(clip.criadoEm).toLocaleDateString(
                                  "pt-BR",
                                )}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                data-ocid={`webclipper.aria.button.${idx + 1}`}
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs hover:bg-white/10"
                                style={{ color: "oklch(0.65 0.18 230)" }}
                                onClick={() => handleAnalisarAria(clip)}
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                Analisar
                              </Button>
                              <Button
                                data-ocid={`webclipper.delete_button.${idx + 1}`}
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 hover:bg-red-500/10"
                                style={{ color: "oklch(0.6 0.16 20)" }}
                                onClick={() => handleExcluir(clip.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
