import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { BarChart2 as BarChart2Icon } from "lucide-react";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  Camera,
  Database,
  Eye,
  EyeOff,
  FileKey,
  FileText as FileTextIcon,
  Globe,
  Loader2,
  Mic,
  Network,
  PenTool,
  Scissors,
  Settings2,
  Shield,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  User,
  Volume2,
  Zap,
} from "lucide-react";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CertificadoDigitalCard } from "../components/CertificadoDigitalCard";
import { SimuladorConfigCard } from "../components/SimuladorConfigCard";
import { SincronizacaoPastasCard } from "../components/SincronizacaoPastasCard";
import { TransmissaoReceitaCard } from "../components/TransmissaoReceitaCard";
import { useARIA } from "../context/ARIAContext";
import { useAppContext } from "../context/AppContext";
import useARIAVoice from "../hooks/useARIAVoice";
import { useAriaModules } from "../hooks/useAriaModules";
import { useSaveProfile } from "../hooks/useQueries";
import { ARIA_MODULE_GROUPS } from "../lib/ariaModules";
import {
  encryptPassword,
  fileToBase64,
  parseCertificadoInfo,
  statusCertificado,
} from "../lib/certificadoService";

import {
  type CertificadoDigital,
  clearStore,
  deleteCertificado,
  getAllCertificados,
  getAllRecords,
  getRecord,
  getStorageStats,
  putRecord,
  saveCertificado,
} from "../lib/db";

const ALL_STORES = [
  "clients",
  "journal_entries",
  "documents_local",
  "notas_fiscais",
  "agenda_items",
  "configuracoes",
];
const STORE_LABELS: Record<string, string> = {
  clients: "Clientes",
  journal_entries: "Lançamentos",
  documents_local: "Documentos",
  notas_fiscais: "Notas Fiscais",
  agenda_items: "Agenda",
  configuracoes: "Configurações",
};

const GOV_API_STATUS = [
  {
    label: "Receita Federal / CNPJ",
    desc: "BrasilAPI (gratuita, sem certificado)",
    icon: Globe,
    free: true,
  },
  {
    label: "SEFAZ NF-e",
    desc: "Requer certificado digital A1/A3",
    icon: ShieldCheck,
    free: false,
  },
  {
    label: "eSocial",
    desc: "Requer certificado digital A1/A3 + habilitação eSocial",
    icon: Network,
    free: false,
  },
  {
    label: "SPED",
    desc: "Geração local, transmissão via PGE (Programa Gerador)",
    icon: Database,
    free: true,
  },
];

function ConfigVozComandos() {
  const { isSupported, recognitionSupported } = useARIAVoice();
  const [voiceEnabled, setVoiceEnabledState] = useState(
    () => localStorage.getItem("aria_voice_enabled") === "true",
  );
  const [commandsEnabled, setCommandsEnabledState] = useState(
    () => localStorage.getItem("aria_commands_enabled") === "true",
  );
  const [language, setLanguage] = useState(() => {
    const s = localStorage.getItem("aria_voice_language");
    if (s === "pt" || s === "en" || s === "es") return s;
    return "pt";
  });
  // using useARIA just for toast; navigation via appContext
  const { setCurrentPage } = useAppContext();

  const setVoiceEnabled = (v: boolean) => {
    setVoiceEnabledState(v);
    localStorage.setItem("aria_voice_enabled", String(v));
    toast.success(`Voz da ARIA ${v ? "ativada" : "desativada"}`);
  };
  const setCommandsEnabled = (v: boolean) => {
    setCommandsEnabledState(v);
    localStorage.setItem("aria_commands_enabled", String(v));
    toast.success(`Comandos de voz ${v ? "ativados" : "desativados"}`);
  };

  return (
    <Card
      data-ocid="config.voz_comandos.card"
      className="rounded-xl border-border shadow-sm overflow-hidden"
    >
      <CardHeader
        className="px-5 py-4 border-b border-border"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.15 0.07 25) 0%, oklch(0.16 0.09 40) 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-white">
                🎙️ Voz & Comandos de Voz
              </CardTitle>
              <p className="text-xs text-white/60 mt-0.5">
                ARIA fala e obedece comandos por voz
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-foreground">
                Voz da ARIA (Text-to-Speech)
              </p>
              <p className="text-[11px] text-muted-foreground">
                ARIA fala em voz alta o que está fazendo
              </p>
            </div>
          </div>
          <Switch
            data-ocid="config.aria_voz.tts.toggle"
            checked={voiceEnabled}
            onCheckedChange={setVoiceEnabled}
            disabled={!isSupported}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <Mic className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-foreground">
                Comandos de Voz (Microfone)
              </p>
              <p className="text-[11px] text-muted-foreground">
                Fale para controlar o sistema
              </p>
            </div>
          </div>
          <Switch
            data-ocid="config.aria_voz.commands.toggle"
            checked={commandsEnabled}
            onCheckedChange={setCommandsEnabled}
            disabled={!recognitionSupported}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Idioma da Voz</p>
          <Select
            value={language}
            onValueChange={(v) => {
              setLanguage(v as "pt" | "en" | "es");
              localStorage.setItem("aria_voice_language", v);
            }}
          >
            <SelectTrigger
              data-ocid="config.aria_voz.language.select"
              className="w-48"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">🇧🇷 Português (PT-BR)</SelectItem>
              <SelectItem value="en">🇺🇸 English (EN-US)</SelectItem>
              <SelectItem value="es">🇪🇸 Español (ES-ES)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(!isSupported || !recognitionSupported) && (
          <p className="text-xs text-yellow-500 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {!isSupported && "Síntese de voz não suportada. "}
            {!recognitionSupported && "Reconhecimento de voz não suportado. "}
            Use Chrome ou Edge para suporte completo.
          </p>
        )}

        <Button
          data-ocid="config.aria_voz.open_page.button"
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          onClick={() => setCurrentPage("aria-voz")}
        >
          <Mic className="w-3.5 h-3.5" />
          Abrir página completa de Voz & Comandos
        </Button>
      </CardContent>
    </Card>
  );
}

function ConfiguracoesIA() {
  const { modules, toggle, setGroupAll, setAll, activeCount, totalCount } =
    useAriaModules();

  return (
    <Card
      data-ocid="config.aria_modules.card"
      className="rounded-xl border-border shadow-sm overflow-hidden"
    >
      <CardHeader
        className="px-5 py-4 border-b border-border"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.13 0.06 265) 0%, oklch(0.16 0.09 220) 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-white">
                Configurações IA
              </CardTitle>
              <p className="text-xs text-white/60 mt-0.5">
                Controle o que a ARIA faz automaticamente
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="config.aria_modules.activate_all_button"
              onClick={() => {
                setAll(true);
                toast.success("ARIA: todos os módulos ativados");
              }}
              className="text-xs px-3 py-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors font-medium"
            >
              Ativar Todos
            </button>
            <button
              type="button"
              data-ocid="config.aria_modules.deactivate_all_button"
              onClick={() => {
                setAll(false);
                toast.success("ARIA: todos os módulos desativados");
              }}
              className="text-xs px-3 py-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors font-medium"
            >
              Desativar Todos
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/70">Módulos ativos</span>
            <span className="text-xs font-semibold text-white">
              {activeCount} / {totalCount}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/70 transition-all duration-500"
              style={{
                width: `${totalCount > 0 ? (activeCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {ARIA_MODULE_GROUPS.map((group) => {
          const groupActive = group.modules.filter((m) => modules[m.id]).length;
          return (
            <div
              key={group.id}
              className="rounded-lg border border-border overflow-hidden"
              style={{ borderLeftWidth: "3px", borderLeftColor: group.color }}
            >
              {/* Group header */}
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ background: group.bg }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{group.icon}</span>
                  <span className="text-xs font-semibold text-foreground">
                    {group.label}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({groupActive}/{group.modules.length})
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-ocid={`config.aria_modules.${group.id}.activate_all_button`}
                    onClick={() => {
                      setGroupAll(group.id, true);
                      toast.success(`ARIA: ${group.label} — tudo ativado`);
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-white border border-border text-foreground hover:bg-gray-50 transition-colors font-medium"
                  >
                    Ativar Tudo
                  </button>
                  <button
                    type="button"
                    data-ocid={`config.aria_modules.${group.id}.deactivate_all_button`}
                    onClick={() => {
                      setGroupAll(group.id, false);
                      toast.success(`ARIA: ${group.label} — tudo desativado`);
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-white border border-border text-foreground hover:bg-gray-50 transition-colors font-medium"
                  >
                    Desativar Tudo
                  </button>
                </div>
              </div>

              {/* Module list */}
              <div className="divide-y divide-border bg-white">
                {group.modules.map((mod, idx) => {
                  const isOn = modules[mod.id] ?? mod.defaultOn;
                  return (
                    <div
                      key={mod.id}
                      data-ocid={`config.aria_modules.${group.id}.toggle.${idx + 1}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Status dot */}
                      <div
                        className={`shrink-0 w-2 h-2 rounded-full transition-colors ${isOn ? "bg-emerald-500" : "bg-gray-300"}`}
                      />
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground leading-snug flex items-center gap-2">
                          {mod.label}
                          {mod.id === "transmissao_receita" && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
                            >
                              Em breve
                            </Badge>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {mod.description}
                        </p>
                      </div>
                      {/* Switch */}
                      <Switch
                        checked={isOn}
                        onCheckedChange={() => {
                          toggle(mod.id);
                          toast.success(
                            `ARIA: ${mod.label} ${!isOn ? "ativado" : "desativado"}`,
                          );
                        }}
                        aria-label={mod.label}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function Configuracoes() {
  const { userProfile, setUserProfile, setCurrentPage } = useAppContext();
  const saveProfile = useSaveProfile();
  const {
    settings,
    updateSettings,
    setIsActive,
    setIsChatOpen,
    startProcessingDemo,
    isActive,
    isProcessing,
  } = useARIA();
  const [form, setForm] = useState({ name: "", email: "", role: "user" });
  const [exportFormat, setExportFormat] = useState<string>(
    () => localStorage.getItem("exportFormat") ?? "pdf",
  );
  const [appLanguage, setAppLanguage] = useState<string>(
    () => localStorage.getItem("appLanguage") ?? "pt",
  );
  const [claudeApiKey, setClaudeApiKey] = useState<string>(
    () => localStorage.getItem("claudeApiKey") ?? "",
  );
  const [useRealProcessing, setUseRealProcessing] = useState<boolean>(
    () => localStorage.getItem("useRealProcessing") === "true",
  );
  const [storageStats, setStorageStats] = useState<Record<string, number>>({});
  const [loadingStats, setLoadingStats] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);

  // APIs Governamentais
  const [govApiReal, setGovApiReal] = useState(false);
  const [hasCertificado, setHasCertificado] = useState(false);

  // Detecção de Fraudes
  const [fraudeReal, setFraudeReal] = useState(false);
  const [webClipperReal, setWebClipperReal] = useState(false);
  const [assinaturaReal, setAssinaturaReal] = useState(false);
  // OCR via Câmera
  const [camOcrReal, setCamOcrReal] = useState(false);
  // Orçamento
  const [orcamentoReal, setOrcamentoReal] = useState(
    localStorage.getItem("orcamento_modo") === "real",
  );
  const [orcamentoThreshold, setOrcamentoThreshold] = useState(
    localStorage.getItem("orcamento_threshold") || "20",
  );
  const [orcamentoAriaAuto, setOrcamentoAriaAuto] = useState(
    localStorage.getItem("orcamento_aria_auto") !== "false",
  );
  const [pwaPushEnabled, setPwaPushEnabled] = useState(
    () => localStorage.getItem("pwa_push_enabled") !== "false",
  );
  const [pwaAutoSync, setPwaAutoSync] = useState(
    () => localStorage.getItem("pwa_auto_sync") !== "false",
  );
  const [fiscalExportFormat, setFiscalExportFormat] = useState(
    () => localStorage.getItem("fiscalExportFormat") ?? "txt",
  );

  // Certificado Digital state
  const [certificados, setCertificados] = useState<CertificadoDigital[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [certForm, setCertForm] = useState({
    cnpj: "",
    razaoSocial: "",
    tipo: "A1",
    validade: "",
    senha: "",
  });
  const [savingCert, setSavingCert] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setForm({
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
      });
    }
    const master = localStorage.getItem("masterUser");
    if (master && !userProfile) {
      try {
        const m = JSON.parse(master);
        setForm({
          name: m.name ?? "",
          email: m.email ?? "",
          role: m.role ?? "admin",
        });
      } catch {}
    }
  }, [userProfile]);

  useEffect(() => {
    getStorageStats()
      .then(setStorageStats)
      .catch(() => setStorageStats({}))
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    Promise.all([
      getAllCertificados(),
      getRecord<{ key: string; value: boolean }>("configuracoes", "govApiReal"),
      getAllRecords<object>("certificados_digitais"),
      getRecord<{ key: string; value: boolean }>("configuracoes", "fraudeReal"),
      getRecord<{ key: string; value: boolean }>("configuracoes", "camOcrReal"),
      getRecord<{ key: string; value: boolean }>(
        "configuracoes",
        "webClipperReal",
      ),
      getRecord<{ key: string; value: boolean }>(
        "configuracoes",
        "assinaturaReal",
      ),
    ])
      .then(([certs, govRec, allCerts, frRec, camOcrRec, wcRec, assiRec]) => {
        setCertificados(certs);
        if (govRec?.value !== undefined) setGovApiReal(Boolean(govRec.value));
        setHasCertificado(allCerts.length > 0);
        if (frRec?.value !== undefined) setFraudeReal(Boolean(frRec.value));
        if (camOcrRec?.value !== undefined)
          setCamOcrReal(Boolean(camOcrRec.value));
        if (wcRec?.value !== undefined) setWebClipperReal(Boolean(wcRec.value));
        if (assiRec?.value !== undefined)
          setAssinaturaReal(Boolean(assiRec.value));
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    try {
      await saveProfile.mutateAsync(form);
      setUserProfile(form);
      toast.success("Perfil salvo com sucesso!");
    } catch {
      toast.error("Erro ao salvar perfil");
    }
  };

  const handleSavePrefs = () => {
    localStorage.setItem("exportFormat", exportFormat);
    localStorage.setItem("appLanguage", appLanguage);
    toast.success("Preferências salvas!");
  };

  const handleTestARIA = () => {
    if (!isActive) setIsActive(true);
    setIsChatOpen(true);
    setTimeout(() => startProcessingDemo(), 300);
    toast.success("ARIA iniciando demonstração de processamento...");
  };

  const handleClearCache = async () => {
    if (
      !window.confirm(
        "Tem certeza? Isso apagará todos os lançamentos, documentos e dados locais. Os clientes serão mantidos.",
      )
    )
      return;
    setClearingCache(true);
    try {
      await Promise.all(
        [
          "journal_entries",
          "documents_local",
          "notas_fiscais",
          "agenda_items",
          "configuracoes",
        ].map((s) => clearStore(s)),
      );
      setStorageStats(await getStorageStats());
      toast.success("Cache limpo com sucesso!");
    } catch {
      toast.error("Erro ao limpar cache");
    } finally {
      setClearingCache(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const allowed = ["pfx", "p12", "cer", "crt"];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowed.includes(ext)) {
      toast.error("Formato inválido. Use: PFX, P12, CER ou CRT");
      return;
    }
    const info = parseCertificadoInfo(file);
    setSelectedFile(file);
    setCertForm((p) => ({ ...p, tipo: info.tipo }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSaveCert = async () => {
    if (!selectedFile) return;
    if (certForm.cnpj.replace(/\D/g, "").length < 14) {
      toast.error("CNPJ inválido");
      return;
    }
    if (!certForm.razaoSocial.trim()) {
      toast.error("Razão Social é obrigatória");
      return;
    }
    if (!certForm.validade) {
      toast.error("Data de validade é obrigatória");
      return;
    }
    setSavingCert(true);
    try {
      const [dadosCertificado, senhaCriptografada] = await Promise.all([
        fileToBase64(selectedFile),
        certForm.senha
          ? encryptPassword(certForm.senha)
          : Promise.resolve(undefined),
      ]);
      const cert: CertificadoDigital = {
        id: `cert-${Date.now()}`,
        nome: selectedFile.name,
        tipo: certForm.tipo as "A1" | "A3",
        cnpj: certForm.cnpj,
        razaoSocial: certForm.razaoSocial,
        validade: certForm.validade,
        armazenado: new Date().toISOString(),
        tamanho: selectedFile.size,
        status: statusCertificado(certForm.validade),
        dadosCertificado,
        senhaCriptografada,
      };
      await saveCertificado(cert);
      const updated = await getAllCertificados();
      setCertificados(updated);
      setHasCertificado(true);
      setSelectedFile(null);
      setCertForm({
        cnpj: "",
        razaoSocial: "",
        tipo: "A1",
        validade: "",
        senha: "",
      });
      toast.success("Certificado salvo com segurança!");
    } catch {
      toast.error("Erro ao salvar certificado");
    } finally {
      setSavingCert(false);
    }
  };

  const handleDeleteCert = async (id: string) => {
    try {
      await deleteCertificado(id);
      const remaining = certificados.filter((c) => c.id !== id);
      setCertificados(remaining);
      setHasCertificado(remaining.length > 0);
      toast.success("Certificado excluído");
    } catch {
      toast.error("Erro ao excluir certificado");
    }
  };

  const handleToggleGovApiReal = async (v: boolean) => {
    setGovApiReal(v);
    await putRecord("configuracoes", { key: "govApiReal", value: v }).catch(
      () => {},
    );
    toast.success(v ? "APIs reais ativadas" : "Modo simulado ativado");
  };

  const handleToggleFraudeReal = async (v: boolean) => {
    setFraudeReal(v);
    await putRecord("configuracoes", { key: "fraudeReal", value: v }).catch(
      () => {},
    );
    toast.success(v ? "Detecção real ativada" : "Modo simulado ativado");
  };

  const handleToggleWebClipperReal = async (v: boolean) => {
    setWebClipperReal(v);
    localStorage.setItem("webClipperReal", String(v));
    await putRecord("configuracoes", { key: "webClipperReal", value: v }).catch(
      () => {},
    );
    toast.success(
      v ? "Web Clipper real ativado" : "Web Clipper simulado ativado",
    );
  };

  const handleToggleAssinaturaReal = async (v: boolean) => {
    setAssinaturaReal(v);
    await putRecord("configuracoes", { key: "assinaturaReal", value: v }).catch(
      () => {},
    );
    toast.success(v ? "Assinatura real ativada" : "Modo simulado ativado");
  };

  const handleToggleCamOcrReal = async (v: boolean) => {
    setCamOcrReal(v);
    await putRecord("configuracoes", { key: "camOcrReal", value: v }).catch(
      () => {},
    );
    toast.success(
      v ? "OCR real ativado para câmera" : "Modo simulado ativado para câmera",
    );
  };

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  return (
    <div className="flex flex-col h-full">
      <header className="no-print flex items-center px-6 py-4 bg-white border-b border-border">
        <div>
          <h1 className="text-xl font-semibold">Configurações</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Perfil do usuário e preferências do sistema
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 max-w-2xl space-y-5">
        {/* ARIA */}
        <Card
          data-ocid="config.aria.card"
          className="rounded-xl border-border shadow-sm overflow-hidden"
        >
          <CardHeader
            className="px-5 py-4 border-b border-border"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.15 0.06 240) 0%, oklch(0.18 0.08 195) 100%)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="relative w-12 h-12 rounded-full overflow-hidden shrink-0"
                  style={{ border: "2px solid oklch(0.6 0.18 195)" }}
                >
                  <img
                    src="/assets/generated/aria-avatar-transparent.dim_400x500.png"
                    alt="ARIA"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    ARIA — Inteligência Artificial
                  </CardTitle>
                  <p className="text-[11px] text-cyan-400/70 mt-0.5">
                    Assistente de Registro Inteligente Automatizado
                  </p>
                </div>
              </div>
              <Badge
                className="text-[10px] border-0 shrink-0"
                style={{
                  background: isActive
                    ? "oklch(0.3 0.1 145 / 0.6)"
                    : "oklch(0.25 0.03 240 / 0.6)",
                  color: isActive
                    ? "oklch(0.8 0.15 145)"
                    : "oklch(0.6 0.03 240)",
                }}
              >
                {isActive
                  ? isProcessing
                    ? "● Processando"
                    : "● Ativa"
                  : "○ Inativa"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            {[
              {
                id: "aria-auto-mode",
                icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
                label: "Modo Automático Total",
                desc: "ARIA processa todos os arquivos, lança contabilizações e resolve erros sem pedir autorização.",
                key: "autoMode" as const,
                ocid: "aria.auto_mode.switch",
              },
              {
                id: "aria-auto-approve",
                icon: <Settings2 className="w-3.5 h-3.5 text-blue-500" />,
                label: "Aprovação Automática de Lançamentos",
                desc: "ARIA aprova automaticamente os lançamentos contábeis gerados. Não requer revisão manual.",
                key: "autoApproveEntries" as const,
                ocid: "aria.auto_approve.switch",
              },
              {
                id: "aria-auto-complete",
                icon: <Shield className="w-3.5 h-3.5 text-emerald-500" />,
                label: "Conclusão Automática",
                desc: 'Ao final do processamento, executa "OK Todos" automaticamente sem exibir botões de confirmação.',
                key: "autoComplete" as const,
                ocid: "aria.auto_complete.switch",
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 p-4 rounded-xl"
                style={{ background: "oklch(0.97 0.01 240)" }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.icon}
                    <Label
                      className="text-xs font-semibold cursor-pointer"
                      htmlFor={item.id}
                    >
                      {item.label}
                    </Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <Switch
                  id={item.id}
                  data-ocid={item.ocid}
                  checked={settings[item.key]}
                  onCheckedChange={(v) => {
                    updateSettings({ [item.key]: v });
                    toast.success(
                      `${item.label} ${v ? "ativado" : "desativado"}`,
                    );
                  }}
                />
              </div>
            ))}

            <div
              className="flex flex-col gap-3 p-4 rounded-xl"
              style={{ background: "oklch(0.97 0.01 240)" }}
            >
              {/* useRealProcessing toggle */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3.5 h-3.5 text-cyan-500" />
                    <Label
                      className="text-xs font-semibold cursor-pointer"
                      htmlFor="aria-real-processing"
                    >
                      Usar processamento real (Claude API)
                    </Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Ativa o OCR real via Claude AI para extrair dados de PDFs,
                    imagens e XMLs. Requer API Key configurada abaixo.
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={
                        useRealProcessing && claudeApiKey
                          ? {
                              background: "oklch(0.92 0.08 150)",
                              color: "oklch(0.35 0.12 150)",
                            }
                          : {
                              background: "oklch(0.94 0.06 240)",
                              color: "oklch(0.5 0.04 240)",
                            }
                      }
                    >
                      {useRealProcessing && claudeApiKey
                        ? "Modo: Real (Claude API)"
                        : "Modo: Demonstração"}
                    </span>
                  </div>
                </div>
                <Switch
                  id="aria-real-processing"
                  data-ocid="aria.real_processing.switch"
                  checked={useRealProcessing}
                  onCheckedChange={(v) => {
                    setUseRealProcessing(v);
                    localStorage.setItem("useRealProcessing", String(v));
                    toast.success(
                      v
                        ? "Processamento real ativado!"
                        : "Modo demonstração ativado.",
                    );
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-cyan-500" />
                  <Label className="text-xs font-semibold">
                    Chave API Claude (sk-ant-...)
                  </Label>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={
                    claudeApiKey
                      ? {
                          background: "oklch(0.92 0.08 150)",
                          color: "oklch(0.35 0.12 150)",
                        }
                      : {
                          background: "oklch(0.94 0.06 20)",
                          color: "oklch(0.45 0.14 20)",
                        }
                  }
                >
                  {claudeApiKey ? "Configurada ✓" : "Não configurada"}
                </span>
              </div>
              <Input
                data-ocid="aria.claude_key.input"
                type="password"
                className="h-8 text-xs"
                placeholder="sk-ant-..."
                value={claudeApiKey}
                onChange={(e) => setClaudeApiKey(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Necessária para processamento real de documentos via IA. Obtenha
                em{" "}
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  console.anthropic.com
                </a>
              </p>
              <Button
                type="button"
                data-ocid="aria.claude_key.save_button"
                size="sm"
                className="text-xs w-fit"
                style={{ background: "oklch(0.45 0.15 195)", color: "white" }}
                onClick={() => {
                  localStorage.setItem("claudeApiKey", claudeApiKey);
                  toast.success(
                    claudeApiKey
                      ? "Claude API Key salva!"
                      : "Claude API Key removida.",
                  );
                }}
              >
                Salvar API Key
              </Button>
            </div>

            {/* camOcrReal toggle — OCR via Câmera */}
            <div
              className="flex flex-col gap-3 p-4 rounded-xl"
              style={{ background: "oklch(0.97 0.01 240)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Camera className="w-3.5 h-3.5 text-cyan-500" />
                    <Label
                      className="text-xs font-semibold cursor-pointer"
                      htmlFor="aria-cam-ocr-real"
                    >
                      OCR Real via Câmera
                    </Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Usa Claude API para extrair dados de imagens capturadas pela
                    câmera. Requer API Key configurada acima.
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={
                        camOcrReal && claudeApiKey
                          ? {
                              background: "oklch(0.92 0.08 150)",
                              color: "oklch(0.35 0.12 150)",
                            }
                          : {
                              background: "oklch(0.94 0.06 240)",
                              color: "oklch(0.5 0.04 240)",
                            }
                      }
                    >
                      {camOcrReal && claudeApiKey
                        ? "Modo: Real (Claude Vision)"
                        : "Modo: Demonstração"}
                    </span>
                  </div>
                </div>
                <Switch
                  id="aria-cam-ocr-real"
                  data-ocid="aria.cam_ocr_real.switch"
                  checked={camOcrReal}
                  onCheckedChange={handleToggleCamOcrReal}
                />
              </div>
            </div>

            <Button
              type="button"
              data-ocid="aria.test.button"
              size="sm"
              className="text-xs text-white border-0"
              style={{ background: "oklch(0.45 0.15 195)" }}
              onClick={handleTestARIA}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              ) : (
                <Bot className="w-3 h-3 mr-1.5" />
              )}
              {isProcessing ? "ARIA processando..." : "Testar ARIA"}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Certificado Digital */}
        <Card
          data-ocid="config.cert.card"
          className="rounded-xl border-border shadow-sm overflow-hidden"
        >
          <CardHeader
            className="px-5 py-4 border-b border-border"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.14 0.05 280) 0%, oklch(0.17 0.07 240) 100%)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.25 0.1 240 / 0.5)" }}
                >
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    Certificado Digital
                  </CardTitle>
                  <p className="text-[11px] text-cyan-400/70 mt-0.5">
                    A1 / A3 para SEFAZ, eSocial e FGTS Digital
                  </p>
                </div>
              </div>
              <Badge
                className="text-[10px] border-0 shrink-0"
                style={{
                  background: "oklch(0.3 0.1 240 / 0.6)",
                  color: "oklch(0.75 0.1 240)",
                }}
              >
                Pasta Dedicada
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Faça upload do seu certificado digital (.pfx, .p12, .cer, .crt)
              para habilitar autenticação com SEFAZ, eSocial, SERPRO e FGTS
              Digital. O arquivo fica armazenado{" "}
              <span className="font-semibold text-foreground">
                somente no seu dispositivo
              </span>
              , nunca enviado para servidores externos.
            </p>

            {/* Upload area */}
            {!selectedFile ? (
              <div
                data-ocid="cert.dropzone"
                className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
                style={{
                  borderColor: dragOver
                    ? "oklch(0.55 0.15 240)"
                    : "oklch(0.85 0.03 240)",
                  background: dragOver
                    ? "oklch(0.95 0.04 240)"
                    : "oklch(0.98 0.01 240)",
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onKeyDown={(e) =>
                  e.key === "Enter" && fileInputRef.current?.click()
                }
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload
                  className="w-8 h-8 mx-auto mb-2"
                  style={{ color: "oklch(0.55 0.1 240)" }}
                />
                <p
                  className="text-xs font-semibold"
                  style={{ color: "oklch(0.4 0.1 240)" }}
                >
                  Arraste o certificado aqui ou clique para selecionar
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Formatos aceitos: PFX, P12, CER, CRT
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pfx,.p12,.cer,.crt"
                  className="hidden"
                  data-ocid="cert.upload_button"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
              </div>
            ) : (
              <div
                className="rounded-xl p-4 space-y-4"
                style={{ background: "oklch(0.97 0.02 240)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileKey
                      className="w-4 h-4"
                      style={{ color: "oklch(0.45 0.15 240)" }}
                    />
                    <span className="text-xs font-semibold">
                      {selectedFile.name}
                    </span>
                    <Badge
                      className="text-[10px] border-0"
                      style={{
                        background: "oklch(0.92 0.06 240)",
                        color: "oklch(0.3 0.1 240)",
                      }}
                    >
                      {certForm.tipo}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground"
                    onClick={() => setSelectedFile(null)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs">CNPJ *</Label>
                    <Input
                      data-ocid="cert.cnpj.input"
                      className="h-8 text-xs mt-1"
                      placeholder="00.000.000/0000-00"
                      value={certForm.cnpj}
                      onChange={(e) =>
                        setCertForm((p) => ({
                          ...p,
                          cnpj: formatCnpj(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Razão Social *</Label>
                    <Input
                      data-ocid="cert.razao_social.input"
                      className="h-8 text-xs mt-1"
                      placeholder="Nome da empresa"
                      value={certForm.razaoSocial}
                      onChange={(e) =>
                        setCertForm((p) => ({
                          ...p,
                          razaoSocial: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={certForm.tipo}
                      onValueChange={(v) =>
                        setCertForm((p) => ({ ...p, tipo: v }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="cert.tipo.select"
                        className="h-8 text-xs mt-1"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1" className="text-xs">
                          A1 — Arquivo (.pfx/.p12)
                        </SelectItem>
                        <SelectItem value="A3" className="text-xs">
                          A3 — Token/Smartcard
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Data de Validade *</Label>
                    <Input
                      data-ocid="cert.validade.input"
                      type="date"
                      className="h-8 text-xs mt-1"
                      value={certForm.validade}
                      onChange={(e) =>
                        setCertForm((p) => ({ ...p, validade: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">
                      Senha do Certificado{" "}
                      <span className="text-muted-foreground font-normal">
                        (opcional)
                      </span>
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        data-ocid="cert.senha.input"
                        type={showSenha ? "text" : "password"}
                        className="h-8 text-xs pr-9"
                        placeholder="Será armazenada com criptografia AES-256"
                        value={certForm.senha}
                        onChange={(e) =>
                          setCertForm((p) => ({ ...p, senha: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSenha((v) => !v)}
                      >
                        {showSenha ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  data-ocid="cert.save_button"
                  size="sm"
                  className="text-xs text-white w-full"
                  style={{ background: "oklch(0.45 0.15 240)" }}
                  onClick={handleSaveCert}
                  disabled={savingCert}
                >
                  {savingCert ? (
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3 h-3 mr-1.5" />
                  )}
                  {savingCert ? "Salvando..." : "Salvar Certificado"}
                </Button>
              </div>
            )}

            {/* Lista de certificados */}
            {certificados.length > 0 ? (
              <div className="space-y-2" data-ocid="cert.list">
                <p className="text-xs font-semibold">
                  Certificados cadastrados ({certificados.length})
                </p>
                {certificados.map((cert, idx) => (
                  <CertificadoDigitalCard
                    key={cert.id}
                    cert={cert}
                    index={idx + 1}
                    onDelete={handleDeleteCert}
                  />
                ))}
              </div>
            ) : (
              <div
                data-ocid="cert.empty_state"
                className="text-center py-4 rounded-xl"
                style={{ background: "oklch(0.97 0.01 240)" }}
              >
                <CalendarClock className="w-7 h-7 mx-auto mb-1.5 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  Nenhum certificado cadastrado
                </p>
              </div>
            )}

            {/* Security footer */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: "oklch(0.94 0.04 150 / 0.4)" }}
            >
              <ShieldCheck
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "oklch(0.45 0.12 150)" }}
              />
              <p
                className="text-[10px]"
                style={{ color: "oklch(0.4 0.1 150)" }}
              >
                Armazenado localmente com criptografia AES-256 • Não enviado
                para servidores externos
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* APIs Governamentais */}
        <Card
          data-ocid="config.govapi.card"
          className="rounded-xl border-border shadow-sm overflow-hidden"
        >
          <CardHeader
            className="px-5 py-4 border-b border-border"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.14 0.06 260) 0%, oklch(0.17 0.08 220) 100%)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.28 0.12 240 / 0.5)" }}
                >
                  <Globe className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-white">
                    🏛️ APIs Governamentais
                  </CardTitle>
                  <p className="text-[11px] text-blue-300/70 mt-0.5">
                    SEFAZ • eSocial • Receita Federal • SPED
                  </p>
                </div>
              </div>
              <Badge
                className="text-[10px] border-0 shrink-0 font-semibold"
                style={{
                  background: govApiReal
                    ? "oklch(0.22 0.1 150 / 0.5)"
                    : "oklch(0.25 0.08 60 / 0.5)",
                  color: govApiReal
                    ? "oklch(0.7 0.18 150)"
                    : "oklch(0.75 0.15 60)",
                }}
              >
                {govApiReal ? "🟢 APIs Reais" : "🔴 Simulado"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Toggle real/simulado */}
            <div
              className="flex items-start justify-between gap-4 p-4 rounded-xl"
              style={{ background: "oklch(0.97 0.01 240)" }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Network className="w-3.5 h-3.5 text-blue-500" />
                  <Label
                    className="text-xs font-semibold cursor-pointer"
                    htmlFor="gov-api-real"
                  >
                    Usar APIs Reais (requer certificado digital)
                  </Label>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Ativa consultas reais à Receita Federal via BrasilAPI. SEFAZ e
                  eSocial requerem certificado A1/A3 cadastrado.
                </p>
              </div>
              <Switch
                id="gov-api-real"
                data-ocid="govapi.real.switch"
                checked={govApiReal}
                onCheckedChange={handleToggleGovApiReal}
              />
            </div>

            {/* Aviso se real ativado sem certificado */}
            {govApiReal && !hasCertificado && (
              <div
                data-ocid="govapi.cert_warning.error_state"
                className="flex items-start gap-2 p-3 rounded-lg"
                style={{
                  background: "oklch(0.22 0.08 60 / 0.2)",
                  border: "1px solid oklch(0.4 0.1 60 / 0.4)",
                }}
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-300">
                    Certificado digital não cadastrado
                  </p>
                  <p className="text-[11px] text-amber-200/70 mt-0.5">
                    SEFAZ e eSocial reais requerem certificado A1/A3. Faça
                    upload acima na seção Certificado Digital.
                  </p>
                </div>
              </div>
            )}

            {/* Status cards por API */}
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                Status das Integrações
              </p>
              {GOV_API_STATUS.map((api) => {
                const Icon = api.icon;
                const available = api.free || hasCertificado;
                return (
                  <div
                    key={api.label}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{ background: "oklch(0.97 0.01 240)" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: available
                          ? "oklch(0.92 0.06 150)"
                          : "oklch(0.92 0.04 240)",
                      }}
                    >
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{
                          color: available
                            ? "oklch(0.45 0.12 150)"
                            : "oklch(0.55 0.04 240)",
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold">{api.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {api.desc}
                      </p>
                    </div>
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: available
                          ? "oklch(0.6 0.15 150)"
                          : "oklch(0.55 0.08 60)",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              data-ocid="govapi.open.button"
              size="sm"
              className="text-xs font-semibold w-full"
              style={{ background: "oklch(0.35 0.12 240)", color: "white" }}
              onClick={() => setCurrentPage("apis-governamentais")}
            >
              <Globe className="w-3 h-3 mr-1.5" />
              Abrir APIs Governamentais
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* DETECÇÃO DE FRAUDES */}
        <Card
          data-ocid="config.fraude.card"
          style={{
            background: "oklch(0.14 0.04 240)",
            border: "1px solid oklch(0.25 0.06 240)",
          }}
        >
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-xl"
                  style={{ background: "oklch(0.22 0.08 20 / 0.4)" }}
                >
                  <Shield
                    className="w-4 h-4"
                    style={{ color: "oklch(0.7 0.18 20)" }}
                  />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-white">
                    🛡️ Detecção de Fraudes
                  </CardTitle>
                  <p className="text-[11px] text-blue-300/70 mt-0.5">
                    Análise de anomalias em lançamentos contábeis
                  </p>
                </div>
              </div>
              <Badge
                className="text-[10px] border-0 shrink-0 font-semibold"
                style={{
                  background: fraudeReal
                    ? "oklch(0.22 0.1 150 / 0.5)"
                    : "oklch(0.25 0.08 60 / 0.5)",
                  color: fraudeReal
                    ? "oklch(0.7 0.18 150)"
                    : "oklch(0.75 0.15 60)",
                }}
              >
                {fraudeReal ? "🟢 Análise Real" : "🔴 Simulado"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div
              className="flex items-start justify-between gap-4 p-4 rounded-xl"
              style={{ background: "oklch(0.97 0.01 240)" }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-red-500" />
                  <Label
                    className="text-xs font-semibold cursor-pointer"
                    htmlFor="fraude-real"
                  >
                    Usar Análise Real de Lançamentos
                  </Label>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Analisa os lançamentos reais do banco de dados local
                  (IndexedDB). No modo simulado, usa dados de exemplo para
                  demonstração.
                </p>
              </div>
              <Switch
                id="fraude-real"
                data-ocid="fraude.real.switch"
                checked={fraudeReal}
                onCheckedChange={handleToggleFraudeReal}
              />
            </div>
          </CardContent>
        </Card>

        {/* WEB CLIPPER */}
        <Card
          data-ocid="config.webclipper.card"
          style={{
            background: "oklch(0.14 0.04 240)",
            border: "1px solid oklch(0.25 0.06 240)",
          }}
        >
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-xl"
                  style={{ background: "oklch(0.22 0.1 230 / 0.4)" }}
                >
                  <Scissors
                    className="w-4 h-4"
                    style={{ color: "oklch(0.65 0.18 230)" }}
                  />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-white">
                    ✂️ Web Clipper
                  </CardTitle>
                  <p className="text-[11px] text-blue-300/70 mt-0.5">
                    Captura conteúdo de páginas web para análise
                  </p>
                </div>
              </div>
              <Badge
                className="text-[10px] border-0 shrink-0 font-semibold"
                style={{
                  background: webClipperReal
                    ? "oklch(0.22 0.1 150 / 0.5)"
                    : "oklch(0.25 0.08 60 / 0.5)",
                  color: webClipperReal
                    ? "oklch(0.7 0.18 150)"
                    : "oklch(0.75 0.15 60)",
                }}
              >
                {webClipperReal ? "🟢 Captura Real" : "🔴 Simulado"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div
              className="flex items-start justify-between gap-4 p-4 rounded-xl"
              style={{ background: "oklch(0.97 0.01 240)" }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Scissors className="w-3.5 h-3.5 text-blue-400" />
                  <Label
                    className="text-xs font-semibold cursor-pointer"
                    htmlFor="webclipper-real"
                  >
                    Usar Captura Real de URLs
                  </Label>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  No modo real, tenta buscar conteúdo da URL via proxy. No modo
                  simulado, usa dados de exemplo para demonstração.
                </p>
              </div>
              <Switch
                id="webclipper-real"
                data-ocid="webclipper.real.switch"
                checked={webClipperReal}
                onCheckedChange={handleToggleWebClipperReal}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Assinatura Digital */}
        <Card
          data-ocid="config.assinatura.card"
          className="rounded-xl border-0 overflow-hidden shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.22 0.055 240), oklch(0.26 0.065 240))",
          }}
        >
          <CardHeader className="px-5 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "oklch(0.45 0.16 230)" }}
                >
                  <PenTool
                    className="w-4 h-4"
                    style={{ color: "oklch(0.65 0.18 230)" }}
                  />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-white">
                    ✍️ Assinatura Digital
                  </CardTitle>
                  <p className="text-[11px] text-blue-300/70 mt-0.5">
                    Assinatura eletrônica de documentos
                  </p>
                </div>
              </div>
              <Badge
                className="text-[10px] border-0 shrink-0 font-semibold"
                style={{
                  background: assinaturaReal
                    ? "oklch(0.22 0.1 150 / 0.5)"
                    : "oklch(0.25 0.08 60 / 0.5)",
                  color: assinaturaReal
                    ? "oklch(0.7 0.18 150)"
                    : "oklch(0.75 0.15 60)",
                }}
              >
                {assinaturaReal ? "🟢 Real" : "🔴 Simulado"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div
              className="flex items-start justify-between gap-4 p-4 rounded-xl"
              style={{ background: "oklch(0.97 0.01 240)" }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <PenTool className="w-3.5 h-3.5 text-blue-400" />
                  <Label
                    className="text-xs font-semibold cursor-pointer"
                    htmlFor="assinatura-real"
                  >
                    Usar Assinatura com Certificado Digital
                  </Label>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  No modo real, usa o certificado digital cadastrado para
                  validar as assinaturas. No modo simulado, usa dados de
                  exemplo.
                </p>
              </div>
              <Switch
                id="assinatura-real"
                data-ocid="assinatura.real.switch"
                checked={assinaturaReal}
                onCheckedChange={handleToggleAssinaturaReal}
              />
            </div>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card
          data-ocid="config.profile.card"
          className="rounded-xl border-border shadow-sm"
        >
          <CardHeader className="px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary/60" />
              <CardTitle className="text-sm font-semibold">
                Perfil do Usuário
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <Label className="text-xs">Nome Completo</Label>
              <Input
                data-ocid="config.name.input"
                className="h-8 text-xs mt-1"
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input
                data-ocid="config.email.input"
                className="h-8 text-xs mt-1"
                placeholder="seu@email.com"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Função</Label>
              <div className="mt-1">
                <Badge
                  className="text-xs"
                  style={{
                    background: "oklch(0.92 0.06 240)",
                    color: "oklch(0.27 0.072 240)",
                  }}
                >
                  {form.role === "admin" ? "Administrador" : "Contador"}
                </Badge>
              </div>
            </div>
            <Button
              type="button"
              data-ocid="config.save.submit_button"
              size="sm"
              className="text-xs bg-primary text-white mt-2"
              onClick={handleSaveProfile}
              disabled={saveProfile.isPending}
            >
              {saveProfile.isPending && (
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              )}
              Salvar Perfil
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Export Preferences */}
        <Card
          data-ocid="config.export.card"
          className="rounded-xl border-border shadow-sm"
        >
          <CardHeader className="px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary/60" />
              <CardTitle className="text-sm font-semibold">
                Preferências de Exportação
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div>
              <Label className="text-xs font-semibold mb-3 block">
                Formato de Exportação
              </Label>
              <RadioGroup
                value={exportFormat}
                onValueChange={setExportFormat}
                className="space-y-2"
                data-ocid="config.export_format.radio"
              >
                {[
                  {
                    value: "pdf",
                    label: "PDF",
                    desc: "Abre o diálogo de impressão do navegador",
                  },
                  {
                    value: "word",
                    label: "Word (.doc)",
                    desc: "Baixa um arquivo de texto formatado",
                  },
                  {
                    value: "excel",
                    label: "Excel (.csv)",
                    desc: "Baixa uma planilha CSV",
                  },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem
                      value={opt.value}
                      id={`fmt-${opt.value}`}
                      className="mt-0.5"
                      data-ocid={`config.format_${opt.value}.radio`}
                    />
                    <label
                      htmlFor={`fmt-${opt.value}`}
                      className="cursor-pointer flex-1"
                    >
                      <p className="text-xs font-semibold">{opt.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {opt.desc}
                      </p>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-2 block">
                Idioma do Sistema
              </Label>
              <Select value={appLanguage} onValueChange={setAppLanguage}>
                <SelectTrigger
                  data-ocid="config.language.select"
                  className="h-8 text-xs w-48"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt" className="text-xs">
                    🇧🇷 Português
                  </SelectItem>
                  <SelectItem value="en" className="text-xs">
                    🇺🇸 English
                  </SelectItem>
                  <SelectItem value="es" className="text-xs">
                    🇪🇸 Español
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              data-ocid="config.prefs.save_button"
              size="sm"
              className="text-xs bg-primary text-white"
              onClick={handleSavePrefs}
            >
              Salvar Preferências
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Armazenamento Local */}
        <Card
          data-ocid="config.storage.card"
          className="rounded-xl border-border shadow-sm"
        >
          <CardHeader className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary/60" />
                <CardTitle className="text-sm font-semibold">
                  Armazenamento Local
                </CardTitle>
              </div>
              <Badge
                className="text-[10px] border-0"
                style={{
                  background: "oklch(0.92 0.08 150)",
                  color: "oklch(0.35 0.12 150)",
                }}
              >
                ● IndexedDB Ativo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <p className="text-[11px] text-muted-foreground">
              Dados salvos localmente no seu navegador. Persistem entre sessões
              sem necessidade de servidor externo.
            </p>
            {loadingStats ? (
              <div
                className="space-y-2"
                data-ocid="config.storage.loading_state"
              >
                {[1, 2, 3].map((k) => (
                  <div
                    key={k}
                    className="h-7 rounded animate-pulse"
                    style={{ background: "oklch(0.94 0.01 240)" }}
                  />
                ))}
              </div>
            ) : (
              <div
                className="grid grid-cols-2 gap-2"
                data-ocid="config.storage.table"
              >
                {ALL_STORES.map((store) => (
                  <div
                    key={store}
                    className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: "oklch(0.97 0.01 240)" }}
                  >
                    <span className="text-[11px] text-muted-foreground">
                      {STORE_LABELS[store] ?? store}
                    </span>
                    <span
                      className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full"
                      style={{
                        background: "oklch(0.92 0.06 240)",
                        color: "oklch(0.3 0.08 240)",
                      }}
                    >
                      {storageStats[store] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              data-ocid="config.storage.delete_button"
              size="sm"
              variant="outline"
              className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5 gap-1.5"
              onClick={handleClearCache}
              disabled={clearingCache}
            >
              {clearingCache ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
              Limpar Cache
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Sincronização de Pastas */}
        <SincronizacaoPastasCard />

        <Separator />

        {/* Simulador Tributário */}

        {/* Orçamento/Previsão */}
        <Card
          data-ocid="config.orcamento.card"
          className="rounded-xl border-border shadow-sm"
        >
          <CardHeader className="px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <BarChart2Icon className="w-4 h-4 text-primary/60" />
              <CardTitle className="text-sm font-semibold">
                Orçamento & Previsão
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Modo de dados</p>
                <p className="text-xs text-muted-foreground">
                  Simulado usa dados de exemplo; Real usa o IndexedDB local
                </p>
              </div>
              <Switch
                data-ocid="config.orcamento.mode.switch"
                checked={orcamentoReal}
                onCheckedChange={(v) => {
                  setOrcamentoReal(v);
                  localStorage.setItem(
                    "orcamento_modo",
                    v ? "real" : "simulado",
                  );
                  toast.success(
                    v ? "Modo real ativado" : "Modo simulado ativado",
                  );
                }}
              />
            </div>
            <div>
              <Label htmlFor="orc-threshold" className="text-sm font-medium">
                Threshold de alerta (%)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Centros com desvio acima deste percentual geram alerta no menu
              </p>
              <Input
                id="orc-threshold"
                type="number"
                min="1"
                max="100"
                className="w-32 h-8 text-sm"
                value={orcamentoThreshold}
                onChange={(e) => {
                  setOrcamentoThreshold(e.target.value);
                  localStorage.setItem("orcamento_threshold", e.target.value);
                }}
                data-ocid="config.orcamento.threshold.input"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  ARIA analisa automaticamente
                </p>
                <p className="text-xs text-muted-foreground">
                  ARIA envia análise dos desvios ao abrir aba Comparativo
                </p>
              </div>
              <Switch
                data-ocid="config.orcamento.aria.switch"
                checked={orcamentoAriaAuto}
                onCheckedChange={(v) => {
                  setOrcamentoAriaAuto(v);
                  localStorage.setItem("orcamento_aria_auto", String(v));
                  toast.success(
                    v
                      ? "Análise automática ativada"
                      : "Análise automática desativada",
                  );
                }}
              />
            </div>
          </CardContent>
        </Card>

        <SimuladorConfigCard />
        <Separator />

        {/* Módulo Fiscal */}
        <Card
          data-ocid="config.fiscal.card"
          className="rounded-xl border-border shadow-sm overflow-hidden"
        >
          <CardHeader
            className="px-5 py-4 border-b border-border"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.14 0.05 240) 0%, oklch(0.17 0.07 220) 100%)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "oklch(0.25 0.1 240 / 0.5)" }}
              >
                <FileTextIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-white">
                  Módulo Fiscal
                </CardTitle>
                <p className="text-[11px] text-blue-400/70 mt-0.5">
                  DCTF, ECF, ECD — Formato de exportação
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">
                  Formato padrão de exportação
                </p>
                <p className="text-xs text-muted-foreground">
                  Define o formato ao clicar em "Gerar Arquivo" em DCTF, ECF e
                  ECD
                </p>
              </div>
              <Select
                value={fiscalExportFormat}
                onValueChange={(v) => {
                  setFiscalExportFormat(v);
                  localStorage.setItem("fiscalExportFormat", v);
                  toast.success(
                    `Formato fiscal alterado para ${v.toUpperCase()}`,
                  );
                }}
              >
                <SelectTrigger
                  data-ocid="config.fiscal.format.select"
                  className="w-36 h-8 text-xs"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="txt">.txt (SPED)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="word">Word</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* App Mobile & PWA */}
        <Card
          data-ocid="config.appmobile.card"
          className="rounded-xl border-border shadow-sm overflow-hidden"
        >
          <CardHeader
            className="px-5 py-4 border-b border-border"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.14 0.05 240) 0%, oklch(0.17 0.07 220) 100%)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "oklch(0.25 0.1 240 / 0.5)" }}
              >
                <Smartphone className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-white">
                  App Mobile & PWA
                </CardTitle>
                <p className="text-[11px] text-blue-400/70 mt-0.5">
                  Notifica\u00e7\u00f5es push, modo offline e
                  instala\u00e7\u00e3o
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">
                  Notifica\u00e7\u00f5es Push
                </p>
                <p className="text-xs text-muted-foreground">
                  Receber alertas de vencimentos e eventos
                </p>
              </div>
              <Switch
                data-ocid="config.appmobile.push.switch"
                checked={pwaPushEnabled}
                onCheckedChange={(v) => {
                  setPwaPushEnabled(v);
                  localStorage.setItem("pwa_push_enabled", String(v));
                  toast.success(
                    v
                      ? "Notifica\u00e7\u00f5es push ativadas"
                      : "Notifica\u00e7\u00f5es push desativadas",
                  );
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">
                  Sincroniza\u00e7\u00e3o Autom\u00e1tica
                </p>
                <p className="text-xs text-muted-foreground">
                  Sincronizar ao voltar online
                </p>
              </div>
              <Switch
                data-ocid="config.appmobile.autosync.switch"
                checked={pwaAutoSync}
                onCheckedChange={(v) => {
                  setPwaAutoSync(v);
                  localStorage.setItem("pwa_auto_sync", String(v));
                  toast.success(
                    v
                      ? "Sincroniza\u00e7\u00e3o autom\u00e1tica ativada"
                      : "Sincroniza\u00e7\u00e3o autom\u00e1tica desativada",
                  );
                }}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">
                Eventos para notificar
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { key: "darf", label: "Vencimento DARF" },
                  { key: "contrato", label: "Novo contrato" },
                  { key: "fraude", label: "Alerta de fraude" },
                  { key: "relatorio", label: "Relat\u00f3rio dispon\u00edvel" },
                  { key: "backup", label: "Backup conclu\u00eddo" },
                ].map((ev) => (
                  <label
                    key={ev.key}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      data-ocid={`config.appmobile.event.${ev.key}.checkbox`}
                      defaultChecked
                      className="w-3.5 h-3.5 accent-blue-400"
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {ev.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="button"
              data-ocid="config.appmobile.open.button"
              onClick={() => setCurrentPage("app-mobile")}
              className="w-full text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 py-2 px-3 rounded-lg border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Abrir configura\u00e7\u00f5es do App Mobile \u2192
            </button>
          </CardContent>
        </Card>

        {/* Transmissão à Receita Federal */}
        <TransmissaoReceitaCard />

        {/* Configurações IA */}
        <ConfiguracoesIA />

        <ConfigVozComandos />

        <Separator />

        {/* App Info */}
        <Card
          data-ocid="config.info.card"
          className="rounded-xl border-border shadow-sm"
        >
          <CardHeader className="px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary/60" />
              <CardTitle className="text-sm font-semibold">
                Sobre o ContaFácil ERP
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-2 text-xs text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Versão:</span>{" "}
              1.0.0
            </p>
            <p>
              <span className="font-semibold text-foreground">Plataforma:</span>{" "}
              Internet Computer (ICP) — 100% Web, sem instalação
            </p>
            <p>
              <span className="font-semibold text-foreground">
                Funcionalidades:
              </span>{" "}
              Livro Diário, Razão, Balancete, Balanço Patrimonial, DRE, DLPA,
              Índices Financeiros
            </p>
            <p>
              <span className="font-semibold text-foreground">Padrão:</span> CFC
              — Conselho Federal de Contabilidade
            </p>
          </CardContent>
        </Card>
      </div>

      <footer className="no-print px-6 py-3 border-t border-border text-center">
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()}. Feito com ❤️ usando{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
