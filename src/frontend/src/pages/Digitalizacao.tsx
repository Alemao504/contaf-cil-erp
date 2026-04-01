import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Brain,
  Camera,
  CameraOff,
  CheckCircle2,
  Download,
  FileImage,
  Loader2,
  Printer,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import {
  applyDocumentFilter,
  applyPhotoFilter,
  captureFrame,
  rotateCanvas,
  saveDigitalizedDoc,
  startCamera,
  stopCamera,
} from "../lib/cameraService";
import type { DigitalizedDoc } from "../lib/cameraService";
import { type DocumentAnalysis, analyzeDocument } from "../lib/claudeService";
import { getAllRecords, getRecord, putRecord } from "../lib/db";

interface ClientRecord {
  id: string;
  name: string;
}

function buildDefaultFileName(): string {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  return `Doc_${y}-${mo}-${d}_${h}-${mi}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCnpj(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Digitalizacao() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { addMessage } = useARIA();

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"document" | "photo">(
    "document",
  );
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [selectedClientId, setSelectedClientId] = useState<string>("none");
  const [fileName, setFileName] = useState<string>(() =>
    buildDefaultFileName(),
  );
  const [recentDocs, setRecentDocs] = useState<DigitalizedDoc[]>([]);
  const [cameraPermissionDenied, setCameraPermissionDenied] =
    useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [cameraStarting, setCameraStarting] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [clients, setClients] = useState<ClientRecord[]>([]);

  // OCR / ARIA states
  const [ocrResult, setOcrResult] = useState<DocumentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrApproved, setOcrApproved] = useState(false);
  const [camOcrReal, setCamOcrReal] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");

  const loadRecentDocs = useCallback(() => {
    getAllRecords<DigitalizedDoc>("documents_local")
      .then((docs) => {
        const digitalized = docs
          .filter((d) => d.tipo === "digitalizado")
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 10);
        setRecentDocs(digitalized);
      })
      .catch(() => {});
  }, []);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stopCamera(streamRef.current);
    };
  }, []);

  // Load clients, recent docs, and camera OCR settings on mount
  useEffect(() => {
    getAllRecords<ClientRecord>("clients")
      .then(setClients)
      .catch(() => {});
    loadRecentDocs();
    // Read camOcrReal from IndexedDB
    getRecord<{ key: string; value: boolean }>("configuracoes", "camOcrReal")
      .then((r) => {
        if (r?.value !== undefined) setCamOcrReal(Boolean(r.value));
      })
      .catch(() => {});
    // Read API key from localStorage
    const storedKey = localStorage.getItem("claudeApiKey") ?? "";
    setApiKey(storedKey);
  }, [loadRecentDocs]);

  // Re-apply filter when filterMode changes (only when a capture exists)
  useEffect(() => {
    if (!originalCanvasRef.current) return;
    const original = originalCanvasRef.current;
    const clone = document.createElement("canvas");
    clone.width = original.width;
    clone.height = original.height;
    const ctx = clone.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(original, 0, 0);
    if (filterMode === "document") {
      applyDocumentFilter(clone);
    } else {
      applyPhotoFilter(clone);
    }
    currentCanvasRef.current = clone;
    setCapturedDataUrl(clone.toDataURL("image/png"));
  }, [filterMode]);

  const handleStartCamera = async () => {
    setCameraStarting(true);
    setCameraPermissionDenied(false);
    try {
      if (!videoRef.current) return;
      const s = await startCamera(videoRef.current, facingMode);
      streamRef.current = s;
      setStreamActive(true);
    } catch (err) {
      const error = err as Error;
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setCameraPermissionDenied(true);
        toast.error("Permissão de câmera negada");
      } else {
        setCameraPermissionDenied(true);
        toast.error("Câmera não disponível neste dispositivo");
      }
    } finally {
      setCameraStarting(false);
    }
  };

  const handleStopCamera = useCallback(() => {
    stopCamera(streamRef.current);
    streamRef.current = null;
    setStreamActive(false);
  }, []);

  const handleCapture = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);
    try {
      const raw = captureFrame(videoRef.current);
      originalCanvasRef.current = raw;
      const clone = document.createElement("canvas");
      clone.width = raw.width;
      clone.height = raw.height;
      const ctx = clone.getContext("2d");
      if (ctx) {
        ctx.drawImage(raw, 0, 0);
        if (filterMode === "document") {
          applyDocumentFilter(clone);
        } else {
          applyPhotoFilter(clone);
        }
      }
      currentCanvasRef.current = clone;
      setCapturedDataUrl(clone.toDataURL("image/png"));
      handleStopCamera();
    } finally {
      setIsCapturing(false);
    }
  };

  const handleNewCapture = () => {
    setCapturedDataUrl("");
    originalCanvasRef.current = null;
    currentCanvasRef.current = null;
    setFileName(buildDefaultFileName());
    // Reset OCR states
    setOcrResult(null);
    setOcrApproved(false);
    setIsAnalyzing(false);
  };

  const handleRotate = (direction: "left" | "right") => {
    if (!currentCanvasRef.current) return;
    const rotatedCurrent = rotateCanvas(currentCanvasRef.current, direction);
    currentCanvasRef.current = rotatedCurrent;
    if (originalCanvasRef.current) {
      originalCanvasRef.current = rotateCanvas(
        originalCanvasRef.current,
        direction,
      );
    }
    setCapturedDataUrl(rotatedCurrent.toDataURL("image/png"));
  };

  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        originalCanvasRef.current = canvas;
        const clone = document.createElement("canvas");
        clone.width = canvas.width;
        clone.height = canvas.height;
        const ctx2 = clone.getContext("2d");
        if (!ctx2) return;
        ctx2.drawImage(canvas, 0, 0);
        if (filterMode === "document") {
          applyDocumentFilter(clone);
        } else {
          applyPhotoFilter(clone);
        }
        currentCanvasRef.current = clone;
        setCapturedDataUrl(clone.toDataURL("image/png"));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      processImageFile(file);
    } else {
      toast.error("Apenas arquivos de imagem são aceitos (PNG, JPG, WEBP)");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleSave = async () => {
    if (!currentCanvasRef.current) {
      toast.error("Nenhuma imagem capturada para salvar");
      return;
    }
    const clientId = selectedClientId === "none" ? "" : selectedClientId;
    try {
      await saveDigitalizedDoc(currentCanvasRef.current, fileName, clientId);
      toast.success(`Documento "${fileName}" salvo com sucesso!`);
      loadRecentDocs();
      window.dispatchEvent(
        new CustomEvent("aria-message", {
          detail: {
            text: `Documento digitalizado salvo com sucesso! Arquivo: ${fileName}. Disponível em Documentos.`,
          },
        }),
      );
    } catch {
      toast.error("Erro ao salvar documento no sistema");
    }
  };

  const handleExportPdf = () => {
    if (!currentCanvasRef.current) {
      toast.error("Nenhuma imagem capturada");
      return;
    }
    const dataUrl = currentCanvasRef.current.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Popup bloqueado. Permita popups para exportar PDF.");
      return;
    }
    win.document.write(
      `<html><head><title>${fileName}</title><style>body{margin:0;display:flex;justify-content:center;background:#fff;}img{width:100%;max-width:210mm;display:block;}</style></head><body><img src="${dataUrl}" /></body></html>`,
    );
    win.document.close();
    win.print();
  };

  const handleDownloadPng = () => {
    if (!currentCanvasRef.current) {
      toast.error("Nenhuma imagem capturada");
      return;
    }
    const a = document.createElement("a");
    a.href = currentCanvasRef.current.toDataURL("image/png");
    a.download = `${fileName}.png`;
    a.click();
  };

  const handleDownloadDoc = (doc: DigitalizedDoc) => {
    const a = document.createElement("a");
    a.href = doc.dataUrl;
    a.download = `${doc.fileName}.png`;
    a.click();
  };

  // OCR / ARIA analysis
  const handleAnalyzeOcr = async () => {
    if (!capturedDataUrl) return;
    setIsAnalyzing(true);
    setOcrResult(null);
    setOcrApproved(false);
    try {
      let result: DocumentAnalysis;
      if (camOcrReal && apiKey) {
        result = await analyzeDocument(
          `[IMAGE_BASE64]${capturedDataUrl}`,
          fileName,
          apiKey,
        );
      } else {
        // Simulated result for demo
        await new Promise((r) => setTimeout(r, 1200));
        result = {
          tipo: "NF-e",
          cnpj: "12345678000195",
          valor: 125000,
          data: new Date().toISOString().slice(0, 10),
          descricao: "Nota Fiscal de Serviços - Consultoria Empresarial",
          lancamentos: [
            {
              id: "l1",
              debitoCode: "1.1.01",
              creditoCode: "2.1.01",
              valor: 125000,
              historico: "NF-e serviços recebidos",
            },
          ],
        };
      }
      setOcrResult(result);
      addMessage({
        type: "info",
        text: `🔍 ARIA analisou "${fileName}": ${result.tipo} — Valor: ${formatBRL(result.valor)} — CNPJ: ${
          result.cnpj ? formatCnpj(result.cnpj) : "não identificado"
        }`,
      });
    } catch {
      addMessage({
        type: "error",
        text: `❌ Erro ao analisar "${fileName}". Verifique a API Key em Configurações → ARIA.`,
      });
      toast.error("Erro ao analisar documento. Verifique a API Key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApproveOcr = async () => {
    if (!ocrResult) return;
    const record = {
      id: `ocr_cam_${Date.now()}`,
      fileName,
      clientId: selectedClientId === "none" ? "" : selectedClientId,
      status: "approved",
      tipo: ocrResult.tipo,
      cnpj: ocrResult.cnpj,
      valor: ocrResult.valor,
      data: ocrResult.data,
      descricao: ocrResult.descricao,
      lancamentos: ocrResult.lancamentos,
      createdAt: new Date().toISOString(),
      source: "camera",
      analysis: ocrResult,
    };
    await putRecord("ocr_results", record);
    setOcrApproved(true);
    toast.success("Resultado aprovado e salvo!");
    addMessage({
      type: "success",
      text: `✅ Lançamento aprovado: ${ocrResult.tipo} — ${formatBRL(ocrResult.valor)}. Salvo em Documentos.`,
    });
  };

  const clientName = (id: string) =>
    clients.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="flex flex-col h-full overflow-auto bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-5 border-b border-border bg-card">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(0.93 0.06 220)" }}
        >
          <Camera
            className="w-5 h-5"
            style={{ color: "oklch(0.45 0.14 220)" }}
          />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Digitalização de Documentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Capture documentos com a câmera ou faça upload de imagens
          </p>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Client selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <Label
            htmlFor="client-select"
            className="text-sm font-medium whitespace-nowrap"
          >
            Cliente (opcional):
          </Label>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger
              id="client-select"
              data-ocid="digitalizacao.select"
              className="w-60"
            >
              <SelectValue placeholder="Selecionar cliente..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem cliente</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Camera / Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {capturedDataUrl ? "Imagem Capturada" : "Câmera / Upload"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Permission denied notice */}
              {cameraPermissionDenied && !capturedDataUrl && (
                <div
                  data-ocid="digitalizacao.error_state"
                  className="flex items-start gap-2 p-3 rounded-lg"
                  style={{
                    background: "oklch(0.96 0.04 25)",
                    color: "oklch(0.45 0.15 25)",
                  }}
                >
                  <CameraOff className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    Permissão de câmera negada. Use o upload de imagem abaixo.
                  </p>
                </div>
              )}

              {/* Live video feed */}
              {streamActive && !capturedDataUrl && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-lg border border-border"
                    style={{ maxHeight: "320px", objectFit: "cover" }}
                  />
                  <Button
                    data-ocid="digitalizacao.primary_button"
                    onClick={handleCapture}
                    disabled={isCapturing}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 shadow-lg"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {isCapturing ? "Capturando..." : "Capturar Foto"}
                  </Button>
                </div>
              )}

              {/* Captured image preview */}
              {capturedDataUrl && (
                <div className="space-y-3">
                  <img
                    src={capturedDataUrl}
                    alt="Imagem capturada"
                    className="w-full rounded-lg border border-border"
                    style={{ maxHeight: "320px", objectFit: "contain" }}
                  />

                  {/* Analyze with ARIA button */}
                  {!ocrApproved && (
                    <Button
                      data-ocid="digitalizacao.ocr_button"
                      onClick={handleAnalyzeOcr}
                      disabled={isAnalyzing}
                      className="w-full text-white"
                      style={{ background: "oklch(0.45 0.15 195)" }}
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4 mr-2" />
                      )}
                      {isAnalyzing ? "Analisando..." : "Analisar com ARIA"}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    data-ocid="digitalizacao.secondary_button"
                    onClick={handleNewCapture}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Nova Captura
                  </Button>
                </div>
              )}

              {/* Upload drop zone — uses <label> for native keyboard/click accessibility */}
              {!streamActive && !capturedDataUrl && (
                <label
                  htmlFor="digitalizacao-file-input"
                  data-ocid="digitalizacao.dropzone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleFileDrop}
                  className={`flex flex-col items-center border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/20"
                  }`}
                >
                  <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    Arraste uma imagem ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WEBP aceitos
                  </p>
                  <input
                    id="digitalizacao-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileInput}
                    data-ocid="digitalizacao.upload_button"
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Right column: Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Controles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Camera section */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Câmera</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    data-ocid="digitalizacao.toggle"
                    onClick={() =>
                      setFacingMode((m) =>
                        m === "environment" ? "user" : "environment",
                      )
                    }
                    className="text-xs"
                  >
                    {facingMode === "environment"
                      ? "📷 Câmera Traseira"
                      : "🤳 Câmera Frontal"}
                  </Button>
                  {!streamActive ? (
                    <Button
                      size="sm"
                      data-ocid="digitalizacao.button"
                      onClick={handleStartCamera}
                      disabled={cameraStarting}
                    >
                      <Camera className="w-3 h-3 mr-1" />
                      {cameraStarting ? "Iniciando..." : "Iniciar Câmera"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStopCamera}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Parar Câmera
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter section */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Filtro de Imagem
                </Label>
                <RadioGroup
                  value={filterMode}
                  onValueChange={(v) =>
                    setFilterMode(v as "document" | "photo")
                  }
                  data-ocid="digitalizacao.radio"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="document" id="filter-doc" />
                    <Label
                      htmlFor="filter-doc"
                      className="cursor-pointer text-sm font-normal"
                    >
                      Documento (P&amp;B Alto Contraste)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="photo" id="filter-photo" />
                    <Label
                      htmlFor="filter-photo"
                      className="cursor-pointer text-sm font-normal"
                    >
                      Foto (Cores Naturais)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Rotation section */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Rotação</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRotate("left")}
                    disabled={!capturedDataUrl}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Girar Esquerda
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRotate("right")}
                    disabled={!capturedDataUrl}
                  >
                    <RotateCw className="w-4 h-4 mr-1" />
                    Girar Direita
                  </Button>
                </div>
              </div>

              {/* Save section */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  Salvar Documento
                </Label>
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Nome do arquivo"
                  data-ocid="digitalizacao.input"
                  className="text-sm"
                />
                <div className="flex flex-col gap-2">
                  <Button
                    data-ocid="digitalizacao.save_button"
                    onClick={handleSave}
                    disabled={!capturedDataUrl}
                    className="w-full"
                  >
                    <FileImage className="w-4 h-4 mr-2" />
                    Salvar no Sistema
                  </Button>
                  <Button
                    variant="outline"
                    data-ocid="digitalizacao.secondary_button"
                    onClick={handleExportPdf}
                    disabled={!capturedDataUrl}
                    className="w-full"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadPng}
                    disabled={!capturedDataUrl}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PNG
                  </Button>
                </div>
              </div>

              {/* OCR mode badge */}
              <div
                className="p-3 rounded-lg text-xs"
                style={{
                  background:
                    camOcrReal && apiKey
                      ? "oklch(0.94 0.06 150)"
                      : "oklch(0.96 0.02 240)",
                  color:
                    camOcrReal && apiKey
                      ? "oklch(0.35 0.12 150)"
                      : "oklch(0.5 0.04 240)",
                }}
              >
                <span className="font-semibold">
                  {camOcrReal && apiKey
                    ? "🟢 OCR Real (Claude AI)"
                    : "🔵 OCR Simulado"}
                </span>
                <span className="ml-2 opacity-70">
                  {camOcrReal && !apiKey
                    ? "— API Key não configurada"
                    : "— Configurar em Configurações → ARIA"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* OCR Result Panel */}
        {(ocrResult || isAnalyzing) && (
          <Card data-ocid="digitalizacao.ocr_panel">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain
                  className="w-5 h-5"
                  style={{ color: "oklch(0.45 0.15 195)" }}
                />
                <CardTitle className="text-base">
                  Dados Extraídos pela ARIA
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Loading state */}
              {isAnalyzing && (
                <div
                  data-ocid="digitalizacao.ocr_panel.loading_state"
                  className="flex items-center gap-3 py-6 justify-center"
                >
                  <Loader2
                    className="w-6 h-6 animate-spin"
                    style={{ color: "oklch(0.45 0.15 195)" }}
                  />
                  <p className="text-sm text-muted-foreground">
                    ARIA analisando imagem com Claude AI...
                  </p>
                </div>
              )}

              {/* Results */}
              {ocrResult && !isAnalyzing && (
                <div className="space-y-4">
                  {/* Approved badge */}
                  {ocrApproved && (
                    <div
                      data-ocid="digitalizacao.ocr_panel.success_state"
                      className="flex items-center gap-2 p-3 rounded-lg"
                      style={{
                        background: "oklch(0.94 0.06 150)",
                        color: "oklch(0.35 0.12 150)",
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        Aprovado e salvo no sistema
                      </span>
                    </div>
                  )}

                  {/* Extracted fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground font-medium">
                        Tipo de Documento
                      </span>
                      <Badge
                        variant="secondary"
                        className="w-fit text-xs font-semibold"
                      >
                        {ocrResult.tipo || "—"}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground font-medium">
                        CNPJ
                      </span>
                      <span className="text-sm font-mono">
                        {ocrResult.cnpj ? formatCnpj(ocrResult.cnpj) : "—"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground font-medium">
                        Valor
                      </span>
                      <span className="text-sm font-semibold">
                        {ocrResult.valor > 0 ? formatBRL(ocrResult.valor) : "—"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground font-medium">
                        Data
                      </span>
                      <span className="text-sm">
                        {ocrResult.data
                          ? new Date(
                              `${ocrResult.data}T00:00:00`,
                            ).toLocaleDateString("pt-BR")
                          : "—"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:col-span-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        Descrição
                      </span>
                      <span className="text-sm">
                        {ocrResult.descricao || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Suggested entries */}
                  {ocrResult.lancamentos.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Lançamentos Sugeridos
                      </Label>
                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Débito</TableHead>
                              <TableHead className="text-xs">Crédito</TableHead>
                              <TableHead className="text-xs">Valor</TableHead>
                              <TableHead className="text-xs">
                                Histórico
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ocrResult.lancamentos.map((l, idx) => (
                              <TableRow
                                key={l.id}
                                data-ocid={`digitalizacao.ocr_panel.item.${idx + 1}`}
                              >
                                <TableCell className="text-xs font-mono">
                                  {l.debitoCode}
                                </TableCell>
                                <TableCell className="text-xs font-mono">
                                  {l.creditoCode}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {formatBRL(l.valor)}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {l.historico}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  {!ocrApproved && (
                    <div className="flex gap-3">
                      <Button
                        data-ocid="digitalizacao.ocr_panel.confirm_button"
                        onClick={handleApproveOcr}
                        className="flex-1 text-white"
                        style={{ background: "oklch(0.52 0.17 150)" }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Aprovar e Salvar
                      </Button>
                      <Button
                        data-ocid="digitalizacao.ocr_panel.cancel_button"
                        variant="outline"
                        onClick={() => {
                          setOcrResult(null);
                          setOcrApproved(false);
                        }}
                        className="flex-1"
                        style={{
                          borderColor: "oklch(0.75 0.12 25)",
                          color: "oklch(0.45 0.15 25)",
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent digitalized documents */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Documentos Digitalizados Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentDocs.length === 0 ? (
              <div
                data-ocid="digitalizacao.empty_state"
                className="flex flex-col items-center justify-center py-10 text-muted-foreground"
              >
                <FileImage className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Nenhum documento digitalizado ainda</p>
                <p className="text-xs mt-1">
                  Capture ou faça upload de uma imagem e salve no sistema.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentDocs.map((doc, idx) => (
                  <div
                    key={doc.id}
                    data-ocid={`digitalizacao.item.${idx + 1}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-md border border-border overflow-hidden flex-shrink-0 bg-muted">
                      {doc.dataUrl && (
                        <img
                          src={doc.dataUrl}
                          alt={doc.fileName}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(doc.createdAt)} &middot;{" "}
                        {formatSize(doc.tamanho)}
                      </p>
                      {doc.clientId && (
                        <p className="text-xs text-muted-foreground">
                          {clientName(doc.clientId)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant="secondary"
                        className="text-xs hidden sm:inline-flex"
                      >
                        PNG
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        data-ocid={`digitalizacao.delete_button.${idx + 1}`}
                        onClick={() => handleDownloadDoc(doc)}
                        title="Baixar imagem"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
