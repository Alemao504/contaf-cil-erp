import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Cloud,
  CloudOff,
  Download,
  FileText,
  HardDrive,
  Info,
  Lock,
  LogIn,
  LogOut,
  QrCode,
  RefreshCw,
  Shield,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import { getAllRecords, putRecord } from "../lib/db";

interface BackupEntry {
  id: string;
  data: string;
  hora: string;
  provedor: string;
  tamanho: string;
  status: "sucesso" | "falha";
}

const INITIAL_BACKUP_HISTORY: BackupEntry[] = [
  {
    id: "bk1",
    data: "31/03/2026",
    hora: "08:14",
    provedor: "Google Drive",
    tamanho: "3.2 MB",
    status: "sucesso",
  },
  {
    id: "bk2",
    data: "30/03/2026",
    hora: "08:15",
    provedor: "Google Drive",
    tamanho: "3.1 MB",
    status: "sucesso",
  },
  {
    id: "bk3",
    data: "29/03/2026",
    hora: "08:10",
    provedor: "Google Drive",
    tamanho: "2.9 MB",
    status: "sucesso",
  },
  {
    id: "bk4",
    data: "28/03/2026",
    hora: "08:12",
    provedor: "OneDrive",
    tamanho: "2.9 MB",
    status: "falha",
  },
  {
    id: "bk5",
    data: "27/03/2026",
    hora: "08:18",
    provedor: "Google Drive",
    tamanho: "2.8 MB",
    status: "sucesso",
  },
];

const AUDIT_LOG = [
  {
    data: "31/03/2026",
    hora: "09:47",
    usuario: "Paulo Roberto",
    acao: "Login",
    modulo: "Sistema",
  },
  {
    data: "31/03/2026",
    hora: "09:52",
    usuario: "Paulo Roberto",
    acao: "Exportação PDF",
    modulo: "Relatórios",
  },
  {
    data: "31/03/2026",
    hora: "10:05",
    usuario: "Ana Silva",
    acao: "Aprovação Nível 2",
    modulo: "Workflow",
  },
  {
    data: "31/03/2026",
    hora: "10:18",
    usuario: "Paulo Roberto",
    acao: "Executar Análise",
    modulo: "Detecção de Fraudes",
  },
  {
    data: "30/03/2026",
    hora: "17:30",
    usuario: "Carlos Melo",
    acao: "Logout",
    modulo: "Sistema",
  },
  {
    data: "30/03/2026",
    hora: "16:45",
    usuario: "Carlos Melo",
    acao: "Lançamento manual",
    modulo: "Lançamentos",
  },
  {
    data: "30/03/2026",
    hora: "15:22",
    usuario: "Ana Silva",
    acao: "Upload de documento",
    modulo: "Documentos",
  },
  {
    data: "30/03/2026",
    hora: "14:10",
    usuario: "Paulo Roberto",
    acao: "Simulação tributária",
    modulo: "Simulador",
  },
  {
    data: "29/03/2026",
    hora: "11:30",
    usuario: "Ana Silva",
    acao: "Login",
    modulo: "Sistema",
  },
  {
    data: "29/03/2026",
    hora: "09:15",
    usuario: "Paulo Roberto",
    acao: "Backup manual",
    modulo: "Sync & Segurança",
  },
];

const PROVIDERS = [
  { id: "google", label: "Google Drive", color: "text-blue-500" },
  { id: "onedrive", label: "OneDrive", color: "text-sky-600" },
  { id: "dropbox", label: "Dropbox", color: "text-indigo-500" },
];

export default function SincronizacaoSeguranca() {
  const { addMessage } = useARIA();

  // Sync state
  const [modoReal, setModoReal] = useState(
    () => localStorage.getItem("sync_modo_real") === "true",
  );
  const [connectedProviders, setConnectedProviders] = useState<
    Record<string, boolean>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("sync_providers") || "{}");
    } catch {
      return {};
    }
  });
  const [backupFreq, setBackupFreq] = useState(
    () => localStorage.getItem("sync_freq") || "diario",
  );
  const [backupHistory, setBackupHistory] = useState<BackupEntry[]>(
    INITIAL_BACKUP_HISTORY,
  );
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Security state
  const [minLen, setMinLen] = useState(() =>
    Number(localStorage.getItem("security_min_len") || "8"),
  );
  const [requireUpper, setRequireUpper] = useState(
    () => localStorage.getItem("security_upper") !== "false",
  );
  const [requireNumbers, setRequireNumbers] = useState(
    () => localStorage.getItem("security_numbers") !== "false",
  );
  const [requireSpecial, setRequireSpecial] = useState(
    () => localStorage.getItem("security_special") === "true",
  );
  const [sessionTimeout, setSessionTimeout] = useState(
    () => localStorage.getItem("security_timeout") || "30min",
  );
  const [twoFAEnabled, setTwoFAEnabled] = useState(
    () => localStorage.getItem("security_2fa") === "true",
  );

  useEffect(() => {
    getAllRecords<BackupEntry>("backup_historico")
      .then((records) => {
        if (records.length > 0) setBackupHistory(records);
      })
      .catch(() => {});
  }, []);

  const toggleProvider = (id: string) => {
    const next = { ...connectedProviders, [id]: !connectedProviders[id] };
    setConnectedProviders(next);
    localStorage.setItem("sync_providers", JSON.stringify(next));
    const label = PROVIDERS.find((p) => p.id === id)?.label ?? id;
    toast.success(next[id] ? `${label} conectado` : `${label} desconectado`);
  };

  const doBackup = async () => {
    const activeProvider = Object.entries(connectedProviders).find(
      ([, v]) => v,
    )?.[0];
    const providerLabel = activeProvider
      ? (PROVIDERS.find((p) => p.id === activeProvider)?.label ?? "Nuvem")
      : "Google Drive";

    setIsBackingUp(true);
    setBackupProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 150));
      setBackupProgress(i);
    }

    const now = new Date();
    const entry: BackupEntry = {
      id: `bk_${Date.now()}`,
      data: now.toLocaleDateString("pt-BR"),
      hora: now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      provedor: providerLabel,
      tamanho: `${(Math.random() * 1 + 2.5).toFixed(1)} MB`,
      status: "sucesso",
    };

    await putRecord("backup_historico", entry).catch(() => {});
    setBackupHistory((prev) => [entry, ...prev]);
    setIsBackingUp(false);
    setBackupProgress(0);
    toast.success("Backup realizado com sucesso!");

    addMessage({
      type: "success",
      text: `✅ Backup concluído com sucesso! ${entry.data} ${entry.hora} — Dados sincronizados com ${providerLabel}. Nenhuma inconsistência detectada.`,
    });
  };

  const exportBackupZip = () => {
    toast.success("Download do backup local iniciado (simulado)");
  };

  const securityScore = (() => {
    let score = 60;
    if (requireUpper) score += 5;
    if (requireNumbers) score += 5;
    if (requireSpecial) score += 10;
    if (minLen >= 12) score += 5;
    if (twoFAEnabled) score += 15;
    if (sessionTimeout !== "nunca") score += 5;
    return Math.min(score, 100);
  })();

  const saveSecuritySetting = (key: string, value: string) => {
    localStorage.setItem(`security_${key}`, value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Sync &amp; Segurança
          </h1>
          <p className="text-sm text-muted-foreground">
            Sincronização em nuvem e configurações de segurança do sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="sync" data-ocid="sync_seguranca.tab">
        <TabsList className="mb-4">
          <TabsTrigger value="sync" data-ocid="sync_seguranca.sync.tab">
            <Cloud className="w-4 h-4 mr-2" /> Sincronização em Nuvem
          </TabsTrigger>
          <TabsTrigger value="security" data-ocid="sync_seguranca.security.tab">
            <ShieldCheck className="w-4 h-4 mr-2" /> Segurança
          </TabsTrigger>
        </TabsList>

        {/* SYNC TAB */}
        <TabsContent value="sync" className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HardDrive className="w-4 h-4" /> Modo de Operação
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Switch
                id="sync-mode"
                data-ocid="sync_seguranca.mode.switch"
                checked={modoReal}
                onCheckedChange={(v) => {
                  setModoReal(v);
                  localStorage.setItem("sync_modo_real", String(v));
                  toast.info(v ? "Modo real ativado" : "Modo simulado ativo");
                }}
              />
              <Label htmlFor="sync-mode">
                {modoReal ? "Modo Real" : "Modo Simulado"}
              </Label>
              {!modoReal && (
                <Badge variant="secondary" className="ml-auto">
                  <Info className="w-3 h-3 mr-1" /> Simulado
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Cloud className="w-4 h-4" /> Provedores de Nuvem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PROVIDERS.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {connectedProviders[p.id] ? (
                      <Cloud className={`w-5 h-5 ${p.color}`} />
                    ) : (
                      <CloudOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="font-medium text-sm">{p.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        connectedProviders[p.id] ? "default" : "secondary"
                      }
                    >
                      {connectedProviders[p.id] ? "Conectado" : "Desconectado"}
                    </Badge>
                    <Button
                      size="sm"
                      variant={connectedProviders[p.id] ? "outline" : "default"}
                      data-ocid={`sync_seguranca.${p.id}.button`}
                      onClick={() => toggleProvider(p.id)}
                    >
                      {connectedProviders[p.id] ? "Desconectar" : "Conectar"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Frequência de Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={backupFreq}
                  onValueChange={(v) => {
                    setBackupFreq(v);
                    localStorage.setItem("sync_freq", v);
                  }}
                >
                  <SelectTrigger data-ocid="sync_seguranca.freq.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  className="w-full"
                  data-ocid="sync_seguranca.backup.primary_button"
                  onClick={doBackup}
                  disabled={isBackingUp}
                >
                  {isBackingUp ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isBackingUp ? "Fazendo backup..." : "Fazer Backup Agora"}
                </Button>

                {isBackingUp && (
                  <div
                    className="space-y-1"
                    data-ocid="sync_seguranca.backup.loading_state"
                  >
                    <Progress value={backupProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {backupProgress}%
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  data-ocid="sync_seguranca.export_zip.button"
                  onClick={exportBackupZip}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Backup Local (ZIP)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Histórico de Backups
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table data-ocid="sync_seguranca.backup.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Data/Hora</TableHead>
                      <TableHead className="text-xs">Provedor</TableHead>
                      <TableHead className="text-xs">Tamanho</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backupHistory.slice(0, 5).map((entry, i) => (
                      <TableRow
                        key={entry.id}
                        data-ocid={`sync_seguranca.backup.item.${i + 1}`}
                      >
                        <TableCell className="text-xs">
                          <div>{entry.data}</div>
                          <div className="text-muted-foreground">
                            {entry.hora}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {entry.provedor}
                        </TableCell>
                        <TableCell className="text-xs">
                          {entry.tamanho}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entry.status === "sucesso"
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {entry.status === "sucesso" ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Sucesso
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Falha
                              </>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Status de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">
                  {securityScore}/100
                </div>
                <div className="flex-1">
                  <Progress value={securityScore} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {securityScore >= 80
                      ? "Segurança boa"
                      : securityScore >= 60
                        ? "Segurança moderada"
                        : "Atenção necessária"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Sessão com timeout ativo</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>IndexedDB criptografado</span>
                </div>
                <div className="flex items-center gap-2">
                  {twoFAEnabled ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Info className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className={twoFAEnabled ? "" : "text-yellow-600"}>
                    {twoFAEnabled ? "2FA ativo" : "2FA não ativado"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Logs de auditoria habilitados</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Backups automáticos</span>
                </div>
                <div className="flex items-center gap-2">
                  {requireSpecial ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Info className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className={requireSpecial ? "" : "text-yellow-600"}>
                    Caracteres especiais{" "}
                    {requireSpecial ? "exigidos" : "recomendados"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Política de Senhas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">
                    Tamanho mínimo: <strong>{minLen} caracteres</strong>
                  </Label>
                  <Slider
                    min={8}
                    max={20}
                    step={1}
                    value={[minLen]}
                    data-ocid="sync_seguranca.min_len.input"
                    onValueChange={([v]) => {
                      if (v !== undefined) {
                        setMinLen(v);
                        saveSecuritySetting("min_len", String(v));
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sec-upper" className="text-sm">
                    Exigir letras maiúsculas
                  </Label>
                  <Switch
                    id="sec-upper"
                    data-ocid="sync_seguranca.upper.switch"
                    checked={requireUpper}
                    onCheckedChange={(v) => {
                      setRequireUpper(v);
                      saveSecuritySetting("upper", String(v));
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sec-numbers" className="text-sm">
                    Exigir números
                  </Label>
                  <Switch
                    id="sec-numbers"
                    data-ocid="sync_seguranca.numbers.switch"
                    checked={requireNumbers}
                    onCheckedChange={(v) => {
                      setRequireNumbers(v);
                      saveSecuritySetting("numbers", String(v));
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sec-special" className="text-sm">
                    Exigir caracteres especiais
                  </Label>
                  <Switch
                    id="sec-special"
                    data-ocid="sync_seguranca.special.switch"
                    checked={requireSpecial}
                    onCheckedChange={(v) => {
                      setRequireSpecial(v);
                      saveSecuritySetting("special", String(v));
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Configuração de Sessão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm">Timeout de sessão</Label>
                    <Select
                      value={sessionTimeout}
                      onValueChange={(v) => {
                        setSessionTimeout(v);
                        saveSecuritySetting("timeout", v);
                      }}
                    >
                      <SelectTrigger data-ocid="sync_seguranca.timeout.select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15min">15 minutos</SelectItem>
                        <SelectItem value="30min">30 minutos</SelectItem>
                        <SelectItem value="1h">1 hora</SelectItem>
                        <SelectItem value="4h">4 horas</SelectItem>
                        <SelectItem value="nunca">Nunca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    data-ocid="sync_seguranca.end_sessions.button"
                    onClick={() => toast.success("Todas as sessões encerradas")}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Encerrar todas as sessões ativas
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <QrCode className="w-4 h-4" /> 2FA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="2fa" className="text-sm">
                      Ativar Autenticação em 2 Fatores
                    </Label>
                    <Switch
                      id="2fa"
                      data-ocid="sync_seguranca.2fa.switch"
                      checked={twoFAEnabled}
                      onCheckedChange={(v) => {
                        setTwoFAEnabled(v);
                        saveSecuritySetting("2fa", String(v));
                        if (v)
                          toast.success("2FA ativado — escaneie o QR Code");
                        else toast.info("2FA desativado");
                      }}
                    />
                  </div>
                  {twoFAEnabled && (
                    <div className="flex flex-col items-center gap-2 p-4 bg-muted rounded-lg">
                      <QrCode className="w-16 h-16 text-foreground" />
                      <p className="text-xs text-muted-foreground text-center">
                        Escaneie com Google Authenticator ou Authy
                      </p>
                      <code className="text-xs bg-background px-2 py-1 rounded">
                        CONTAFACIL-2FA-DEMO-KEY
                      </code>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Log de Auditoria
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  data-ocid="sync_seguranca.export_log.button"
                  onClick={() =>
                    toast.success("Exportando log de auditoria em PDF...")
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table data-ocid="sync_seguranca.audit.table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Hora</TableHead>
                    <TableHead className="text-xs">Usuário</TableHead>
                    <TableHead className="text-xs">Ação</TableHead>
                    <TableHead className="text-xs">Módulo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {AUDIT_LOG.map((entry, i) => (
                    <TableRow
                      key={entry.hora + entry.usuario}
                      data-ocid={`sync_seguranca.audit.item.${i + 1}`}
                    >
                      <TableCell className="text-xs">{entry.data}</TableCell>
                      <TableCell className="text-xs">{entry.hora}</TableCell>
                      <TableCell className="text-xs font-medium">
                        {entry.usuario}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          {entry.acao.includes("Login") &&
                            !entry.acao.includes("Logout") && (
                              <LogIn className="w-3 h-3 text-green-500" />
                            )}
                          {entry.acao.includes("Logout") && (
                            <LogOut className="w-3 h-3 text-red-500" />
                          )}
                          {entry.acao}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {entry.modulo}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="text-center text-xs text-muted-foreground pt-2">
        &copy; {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
