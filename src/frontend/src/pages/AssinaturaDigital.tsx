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
  CheckCircle2,
  Clock,
  Download,
  FileSignature,
  FileText,
  PenTool,
  Plus,
  Trash2,
  Upload,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getAllRecords, putRecord } from "../lib/db";

type StatusDoc = "pendente" | "assinado" | "recusado";

interface Signatario {
  nome: string;
  papel: string;
  assinatura?: string; // dataURL
  assinadoEm?: string;
}

interface DocumentoAssinado {
  id: string;
  nomeDocumento: string;
  clienteId?: string;
  clienteNome?: string;
  status: StatusDoc;
  signatarios: Signatario[];
  posicao: string;
  criadoEm: string;
  documentoBase64?: string;
  tipoDocumento?: string;
}

const PAPEIS = ["Contador", "Sócio", "Auxiliar", "Cliente", "Testemunha"];

const POSICOES = [
  { value: "topo", label: "Topo do documento" },
  { value: "centro", label: "Centro do documento" },
  { value: "rodape", label: "Rodapé do documento" },
];

const SAMPLE_DOCS: DocumentoAssinado[] = [
  {
    id: "doc-1",
    nomeDocumento: "Contrato de Prestação de Serviços - Empresa Alfa Ltda",
    clienteNome: "Empresa Alfa Ltda",
    status: "assinado",
    posicao: "rodape",
    criadoEm: "2026-03-20T14:30:00",
    signatarios: [
      {
        nome: "Dr. Carlos Mendes",
        papel: "Contador",
        assinadoEm: "2026-03-20T15:00:00",
      },
      {
        nome: "Ana Paula Souza",
        papel: "Sócio",
        assinadoEm: "2026-03-20T16:00:00",
      },
    ],
  },
  {
    id: "doc-2",
    nomeDocumento: "Declaração de Responsabilidade Fiscal - Tech Solutions SA",
    clienteNome: "Tech Solutions SA",
    status: "pendente",
    posicao: "rodape",
    criadoEm: "2026-03-28T10:00:00",
    signatarios: [
      { nome: "Ricardo Lima", papel: "Contador" },
      { nome: "Fernanda Costa", papel: "Sócio" },
    ],
  },
  {
    id: "doc-3",
    nomeDocumento: "Relatório Contábil Anual 2025 - Construtora Beta Ltda",
    clienteNome: "Construtora Beta Ltda",
    status: "recusado",
    posicao: "rodape",
    criadoEm: "2026-03-15T09:00:00",
    signatarios: [{ nome: "Marcos Alves", papel: "Contador" }],
  },
];

export default function AssinaturaDigital() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [documentos, setDocumentos] = useState<DocumentoAssinado[]>([]);
  const [uploadedDoc, setUploadedDoc] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState("");
  const [uploadedType, setUploadedType] = useState("");
  const [posicao, setPosicao] = useState("rodape");
  const [signatarios, setSignatarios] = useState<Signatario[]>([
    { nome: "", papel: "Contador" },
  ]);
  const [currentSignIdx, setCurrentSignIdx] = useState(0);
  const [isSigning, setIsSigning] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentoAssinado | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    getAllRecords<DocumentoAssinado>("documentos_assinados")
      .then((recs) => {
        if (recs.length === 0) {
          setDocumentos(SAMPLE_DOCS);
          for (const doc of SAMPLE_DOCS) {
            putRecord("documentos_assinados", doc).catch(() => {});
          }
        } else {
          setDocumentos(recs);
        }
      })
      .catch(() => setDocumentos(SAMPLE_DOCS));
  }, []);

  const startDrawing = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    lastPos.current = { x, y };
    setIsDrawing(true);
  }, []);

  const draw = useCallback(
    (x: number, y: number) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.strokeStyle = "#1e3a5f";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (lastPos.current) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      lastPos.current = { x, y };
      setHasSignature(true);
    },
    [isDrawing],
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    startDrawing(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    draw(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    startDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    draw(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedDoc(ev.target?.result as string);
      setUploadedName(file.name);
      setUploadedType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const addSignatario = () => {
    setSignatarios((prev) => [...prev, { nome: "", papel: "Contador" }]);
  };

  const removeSignatario = (idx: number) => {
    setSignatarios((prev) => prev.filter((_, i) => i !== idx));
    if (currentSignIdx >= signatarios.length - 1) {
      setCurrentSignIdx(Math.max(0, signatarios.length - 2));
    }
  };

  const updateSignatario = (
    idx: number,
    field: keyof Signatario,
    value: string,
  ) => {
    setSignatarios((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    );
  };

  const handleAssinar = async () => {
    if (!uploadedDoc) {
      toast.error("Por favor, faça upload de um documento primeiro.");
      return;
    }
    if (!hasSignature) {
      toast.error("Por favor, desenhe sua assinatura no campo abaixo.");
      return;
    }
    const currentSig = signatarios[currentSignIdx];
    if (!currentSig?.nome) {
      toast.error("Por favor, informe o nome do assinante.");
      return;
    }
    setIsSigning(true);
    try {
      const canvas = canvasRef.current;
      const sigDataUrl = canvas?.toDataURL("image/png") ?? "";
      const now = new Date().toISOString();
      const updatedSigs = signatarios.map((s, i) =>
        i === currentSignIdx
          ? { ...s, assinatura: sigDataUrl, assinadoEm: now }
          : s,
      );
      const allSigned = updatedSigs.every((s) => s.assinadoEm);
      const doc: DocumentoAssinado = {
        id: `doc-${Date.now()}`,
        nomeDocumento: uploadedName || "Documento sem título",
        status: allSigned ? "assinado" : "pendente",
        signatarios: updatedSigs,
        posicao,
        criadoEm: now,
        documentoBase64: uploadedDoc,
        tipoDocumento: uploadedType,
      };
      await putRecord("documentos_assinados", doc);
      setDocumentos((prev) => [doc, ...prev]);
      clearCanvas();
      setUploadedDoc(null);
      setUploadedName("");
      setSignatarios([{ nome: "", papel: "Contador" }]);
      toast.success("Documento assinado e salvo com sucesso!");
      window.dispatchEvent(
        new CustomEvent("aria-message", {
          detail: {
            message: `📝 Documento "${doc.nomeDocumento}" foi assinado por ${currentSig.nome} (${currentSig.papel}) em ${new Date(now).toLocaleString("pt-BR")}. Status: ${allSigned ? "Completamente assinado" : "Aguardando demais signatários"}.`,
          },
        }),
      );
    } catch {
      toast.error("Erro ao salvar assinatura. Tente novamente.");
    } finally {
      setIsSigning(false);
    }
  };

  const exportarAssinatura = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      toast.error("Desenhe uma assinatura primeiro.");
      return;
    }
    const link = document.createElement("a");
    link.download = "assinatura.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Assinatura exportada como PNG.");
  };

  const pendentes = documentos.filter((d) => d.status === "pendente").length;

  const statusConfig: Record<
    StatusDoc,
    { label: string; color: string; icon: React.ReactNode }
  > = {
    assinado: {
      label: "Assinado",
      color: "oklch(0.22 0.09 150 / 0.5)",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    pendente: {
      label: "Pendente",
      color: "oklch(0.25 0.1 60 / 0.5)",
      icon: <Clock className="w-3 h-3" />,
    },
    recusado: {
      label: "Recusado",
      color: "oklch(0.22 0.1 30 / 0.5)",
      icon: <XCircle className="w-3 h-3" />,
    },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-6 py-5 border-b border-border flex items-center justify-between"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.055 240), oklch(0.26 0.065 240))",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(0.45 0.16 230)" }}
          >
            <PenTool className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Assinatura Digital</h1>
            <p className="text-xs text-blue-300/70">
              Assine documentos diretamente no sistema
            </p>
          </div>
        </div>
        {pendentes > 0 && (
          <Badge
            data-ocid="assinatura.pending.badge"
            className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
          >
            {pendentes} pendente{pendentes > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="assinar" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger
              data-ocid="assinatura.assinar.tab"
              value="assinar"
              className="text-xs"
            >
              <PenTool className="w-3.5 h-3.5 mr-1.5" />
              Assinar Documento
            </TabsTrigger>
            <TabsTrigger
              data-ocid="assinatura.historico.tab"
              value="historico"
              className="text-xs"
            >
              <FileSignature className="w-3.5 h-3.5 mr-1.5" />
              Histórico ({documentos.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB: Assinar */}
          <TabsContent value="assinar" className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Left: Upload + Preview */}
              <Card className="rounded-xl border-border shadow-sm">
                <CardHeader className="px-5 py-4 border-b border-border">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary/60" />
                    Documento para Assinar
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    data-ocid="assinatura.upload.button"
                    variant="outline"
                    className="w-full h-24 border-dashed border-2 flex flex-col gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">
                      {uploadedName ||
                        "Clique para fazer upload (PDF ou imagem)"}
                    </span>
                  </Button>

                  {uploadedDoc && (
                    <div
                      className="rounded-lg overflow-hidden border border-border"
                      style={{ maxHeight: "240px" }}
                    >
                      {uploadedType.startsWith("image/") ? (
                        <img
                          src={uploadedDoc}
                          alt="Preview documento"
                          className="w-full object-contain"
                          style={{ maxHeight: "240px" }}
                        />
                      ) : (
                        <div className="bg-muted flex flex-col items-center justify-center py-10 gap-3">
                          <FileText className="w-12 h-12 text-primary/40" />
                          <p className="text-sm text-muted-foreground text-center px-4">
                            {uploadedName}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            PDF carregado
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Posição da assinatura
                    </Label>
                    <Select value={posicao} onValueChange={setPosicao}>
                      <SelectTrigger
                        data-ocid="assinatura.posicao.select"
                        className="text-xs h-8"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POSICOES.map((p) => (
                          <SelectItem
                            key={p.value}
                            value={p.value}
                            className="text-xs"
                          >
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Right: Signatários */}
              <Card className="rounded-xl border-border shadow-sm">
                <CardHeader className="px-5 py-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-primary/60" />
                      Signatários
                    </CardTitle>
                    <Button
                      data-ocid="assinatura.add_signatario.button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={addSignatario}
                    >
                      <Plus className="w-3 h-3" />
                      Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {signatarios.map((sig, idx) => (
                    <div
                      key={`sig-${sig.nome || idx}`}
                      data-ocid={`assinatura.signatario.item.${idx + 1}`}
                      className="flex gap-2 items-start p-3 rounded-lg border border-border"
                      style={{
                        background:
                          idx === currentSignIdx
                            ? "oklch(0.97 0.02 240)"
                            : undefined,
                      }}
                    >
                      <div className="flex-1 space-y-2">
                        <Input
                          data-ocid={`assinatura.signatario.input.${idx + 1}`}
                          placeholder="Nome do assinante"
                          value={sig.nome}
                          onChange={(e) =>
                            updateSignatario(idx, "nome", e.target.value)
                          }
                          className="h-7 text-xs"
                        />
                        <Select
                          value={sig.papel}
                          onValueChange={(v) =>
                            updateSignatario(idx, "papel", v)
                          }
                        >
                          <SelectTrigger
                            data-ocid={`assinatura.signatario.select.${idx + 1}`}
                            className="h-7 text-xs"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAPEIS.map((p) => (
                              <SelectItem key={p} value={p} className="text-xs">
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-primary/60 hover:text-primary"
                          onClick={() => setCurrentSignIdx(idx)}
                          title="Assinar como este signatário"
                        >
                          <PenTool className="w-3 h-3" />
                        </Button>
                        {signatarios.length > 1 && (
                          <Button
                            data-ocid={`assinatura.signatario.delete_button.${idx + 1}`}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive"
                            onClick={() => removeSignatario(idx)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-foreground">
                    Assinando como:{" "}
                    <strong>
                      {signatarios[currentSignIdx]?.nome || "(sem nome)"}
                    </strong>{" "}
                    — {signatarios[currentSignIdx]?.papel}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Signature Canvas */}
            <Card className="rounded-xl border-border shadow-sm">
              <CardHeader className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-primary/60" />
                    Área de Assinatura
                    <span className="text-[11px] font-normal text-muted-foreground">
                      — Desenhe com mouse ou toque
                    </span>
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      data-ocid="assinatura.export.button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={exportarAssinatura}
                      disabled={!hasSignature}
                    >
                      <Download className="w-3 h-3" />
                      Exportar PNG
                    </Button>
                    <Button
                      data-ocid="assinatura.clear.button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                      onClick={clearCanvas}
                    >
                      <Trash2 className="w-3 h-3" />
                      Limpar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div
                  className="rounded-xl border-2 border-dashed overflow-hidden"
                  style={{ borderColor: "oklch(0.7 0.1 240)" }}
                >
                  <canvas
                    data-ocid="assinatura.canvas_target"
                    ref={canvasRef}
                    width={800}
                    height={180}
                    className="w-full touch-none cursor-crosshair block"
                    style={{ background: "#fafbfe", maxHeight: "180px" }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                {!hasSignature && (
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    Clique e arraste para desenhar sua assinatura
                  </p>
                )}

                {/* Carimbo preview */}
                {hasSignature && signatarios[currentSignIdx]?.nome && (
                  <div
                    className="mt-3 flex items-center gap-3 px-4 py-2 rounded-lg border border-border text-xs text-muted-foreground"
                    style={{ background: "oklch(0.97 0.01 240)" }}
                  >
                    <FileSignature className="w-3.5 h-3.5 text-primary/60" />
                    <span>
                      Carimbo:{" "}
                      <strong>{signatarios[currentSignIdx].nome}</strong> —{" "}
                      {signatarios[currentSignIdx].papel} —{" "}
                      {new Date().toLocaleString("pt-BR")}
                    </span>
                  </div>
                )}

                <Button
                  data-ocid="assinatura.submit_button"
                  className="w-full mt-4 gap-2"
                  onClick={handleAssinar}
                  disabled={isSigning || !hasSignature || !uploadedDoc}
                >
                  {isSigning ? (
                    <>
                      <span className="animate-spin">⏳</span> Assinando...
                    </>
                  ) : (
                    <>
                      <PenTool className="w-4 h-4" />
                      Assinar Documento
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Histórico */}
          <TabsContent value="historico" className="space-y-4">
            {documentos.length === 0 ? (
              <div
                data-ocid="assinatura.empty_state"
                className="flex flex-col items-center justify-center py-16 text-muted-foreground"
              >
                <FileSignature className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Nenhum documento assinado ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {documentos.map((doc, idx) => {
                  const cfg = statusConfig[doc.status];
                  return (
                    <Card
                      key={doc.id}
                      data-ocid={`assinatura.item.${idx + 1}`}
                      className="rounded-xl border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              background:
                                doc.status === "assinado"
                                  ? "oklch(0.22 0.09 150 / 0.15)"
                                  : doc.status === "pendente"
                                    ? "oklch(0.25 0.1 60 / 0.15)"
                                    : "oklch(0.22 0.1 30 / 0.15)",
                            }}
                          >
                            <FileText
                              className="w-4 h-4"
                              style={{
                                color:
                                  doc.status === "assinado"
                                    ? "oklch(0.55 0.18 150)"
                                    : doc.status === "pendente"
                                      ? "oklch(0.65 0.2 60)"
                                      : "oklch(0.6 0.2 30)",
                              }}
                            />
                          </div>
                          <Badge
                            className="text-[10px] border-0 shrink-0 gap-1"
                            style={{
                              background: cfg.color,
                              color:
                                doc.status === "assinado"
                                  ? "oklch(0.65 0.18 150)"
                                  : doc.status === "pendente"
                                    ? "oklch(0.7 0.2 60)"
                                    : "oklch(0.65 0.2 30)",
                            }}
                          >
                            {cfg.icon}
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-foreground mb-1 line-clamp-2">
                          {doc.nomeDocumento}
                        </p>
                        {doc.clienteNome && (
                          <p className="text-[11px] text-muted-foreground mb-2">
                            {doc.clienteNome}
                          </p>
                        )}
                        <div className="text-[11px] text-muted-foreground space-y-0.5">
                          <p>
                            {doc.signatarios.length} signatário
                            {doc.signatarios.length > 1 ? "s" : ""}:
                          </p>
                          {doc.signatarios.slice(0, 2).map((s, si) => (
                            <p
                              key={`s-${s.nome || si}`}
                              className="flex items-center gap-1"
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  background: s.assinadoEm
                                    ? "oklch(0.55 0.18 150)"
                                    : "oklch(0.65 0.2 60)",
                                }}
                              />
                              {s.nome} ({s.papel})
                            </p>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 mt-2">
                          {new Date(doc.criadoEm).toLocaleDateString("pt-BR")}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedDoc}
        onOpenChange={(o) => !o && setSelectedDoc(null)}
      >
        <DialogContent
          data-ocid="assinatura.dialog"
          className="max-w-lg rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <FileSignature className="w-4 h-4" />
              Detalhes do Documento
            </DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold">
                  {selectedDoc.nomeDocumento}
                </p>
                {selectedDoc.clienteNome && (
                  <p className="text-xs text-muted-foreground">
                    {selectedDoc.clienteNome}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <Badge
                  className="text-[11px] border-0 gap-1"
                  style={{
                    background: statusConfig[selectedDoc.status].color,
                    color:
                      selectedDoc.status === "assinado"
                        ? "oklch(0.65 0.18 150)"
                        : selectedDoc.status === "pendente"
                          ? "oklch(0.7 0.2 60)"
                          : "oklch(0.65 0.2 30)",
                  }}
                >
                  {statusConfig[selectedDoc.status].icon}
                  {statusConfig[selectedDoc.status].label}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2">Signatários:</p>
                <div className="space-y-2">
                  {selectedDoc.signatarios.map((s, i) => (
                    <div
                      key={`sd-${s.nome || i}`}
                      className="flex items-center justify-between text-xs p-2 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium">{s.nome}</p>
                        <p className="text-muted-foreground">{s.papel}</p>
                      </div>
                      {s.assinadoEm ? (
                        <div className="text-right">
                          <CheckCircle2
                            className="w-3.5 h-3.5 ml-auto"
                            style={{ color: "oklch(0.55 0.18 150)" }}
                          />
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(s.assinadoEm).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      ) : (
                        <Clock
                          className="w-3.5 h-3.5"
                          style={{ color: "oklch(0.65 0.2 60)" }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>
                  Criado em:{" "}
                  {new Date(selectedDoc.criadoEm).toLocaleString("pt-BR")}
                </p>
                <p>
                  Posição da assinatura:{" "}
                  {POSICOES.find((p) => p.value === selectedDoc.posicao)?.label}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              data-ocid="assinatura.close_button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedDoc(null)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
