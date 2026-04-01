import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

type PushNotif = {
  id: number;
  dataHora: string;
  tipo: "Fiscal" | "Contrato" | "Fraude" | "Relatório" | "Sistema";
  mensagem: string;
  status: "Entregue" | "Pendente" | "Falhou";
};

type SyncLog = {
  id: number;
  dataHora: string;
  tipo: string;
  status: "Sucesso" | "Falhou" | "Pendente";
  registros: number;
};

const INITIAL_NOTIFS: PushNotif[] = [
  {
    id: 1,
    dataHora: "31/03/2026 09:15",
    tipo: "Fiscal",
    mensagem: "DARF vencendo amanhã — Empresa Alpha Ltda",
    status: "Entregue",
  },
  {
    id: 2,
    dataHora: "31/03/2026 08:42",
    tipo: "Contrato",
    mensagem: "Novo contrato cadastrado — Beta Serviços S/A",
    status: "Entregue",
  },
  {
    id: 3,
    dataHora: "30/03/2026 17:30",
    tipo: "Fraude",
    mensagem: "Anomalia detectada — Lançamento duplicado #4521",
    status: "Entregue",
  },
  {
    id: 4,
    dataHora: "30/03/2026 16:00",
    tipo: "Relatório",
    mensagem: "Relatório mensal de março disponível para Gamma Tech",
    status: "Entregue",
  },
  {
    id: 5,
    dataHora: "30/03/2026 11:20",
    tipo: "Fraude",
    mensagem: "CNPJ inválido detectado — Delta Comércio ME",
    status: "Entregue",
  },
  {
    id: 6,
    dataHora: "29/03/2026 14:55",
    tipo: "Fiscal",
    mensagem: "FGTS vence em 3 dias — Epsilon Indústria",
    status: "Entregue",
  },
  {
    id: 7,
    dataHora: "29/03/2026 09:00",
    tipo: "Sistema",
    mensagem: "Backup automático concluído com sucesso",
    status: "Entregue",
  },
  {
    id: 8,
    dataHora: "28/03/2026 18:30",
    tipo: "Fraude",
    mensagem: "Variação brusca detectada — Zeta Holding",
    status: "Falhou",
  },
];

const INITIAL_SYNC_LOG: SyncLog[] = [
  {
    id: 1,
    dataHora: "31/03/2026 09:00",
    tipo: "Clientes",
    status: "Sucesso",
    registros: 48,
  },
  {
    id: 2,
    dataHora: "31/03/2026 09:00",
    tipo: "Lançamentos",
    status: "Sucesso",
    registros: 312,
  },
  {
    id: 3,
    dataHora: "31/03/2026 08:55",
    tipo: "Contratos",
    status: "Sucesso",
    registros: 27,
  },
  {
    id: 4,
    dataHora: "30/03/2026 23:00",
    tipo: "Documentos",
    status: "Sucesso",
    registros: 156,
  },
  {
    id: 5,
    dataHora: "30/03/2026 23:00",
    tipo: "Notas Fiscais",
    status: "Sucesso",
    registros: 94,
  },
  {
    id: 6,
    dataHora: "30/03/2026 22:45",
    tipo: "Agenda",
    status: "Falhou",
    registros: 0,
  },
  {
    id: 7,
    dataHora: "30/03/2026 20:00",
    tipo: "Clientes",
    status: "Sucesso",
    registros: 47,
  },
  {
    id: 8,
    dataHora: "29/03/2026 23:00",
    tipo: "Lançamentos",
    status: "Sucesso",
    registros: 289,
  },
  {
    id: 9,
    dataHora: "29/03/2026 22:50",
    tipo: "Patrimônio",
    status: "Sucesso",
    registros: 18,
  },
  {
    id: 10,
    dataHora: "28/03/2026 23:00",
    tipo: "Orçamento",
    status: "Pendente",
    registros: 0,
  },
];

const tipoBadgeColor: Record<string, string> = {
  Fiscal: "bg-red-500/20 text-red-400 border-red-500/30",
  Contrato: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Fraude: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Relatório: "bg-green-500/20 text-green-400 border-green-500/30",
  Sistema: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const syncStatusColor: Record<string, string> = {
  Sucesso: "bg-green-500/20 text-green-400 border-green-500/30",
  Falhou: "bg-red-500/20 text-red-400 border-red-500/30",
  Pendente: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export default function AppMobile() {
  const { isOnline } = useOnlineStatus();

  // PWA install
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(
    () => window.matchMedia("(display-mode: standalone)").matches,
  );

  // Push notifications
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission>(() =>
      "Notification" in window ? Notification.permission : "denied",
    );
  const [pushMode, setPushMode] = useState<"simulado" | "real">(
    () =>
      (localStorage.getItem("pwa_push_mode") as "simulado" | "real") ??
      "simulado",
  );
  const [pushEnabled, setPushEnabled] = useState(
    () => localStorage.getItem("pwa_push_enabled") !== "false",
  );
  const [notifs, setNotifs] = useState<PushNotif[]>(INITIAL_NOTIFS);

  // Offline sync
  const [autoSync, setAutoSync] = useState(
    () => localStorage.getItem("pwa_auto_sync") !== "false",
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLog] = useState<SyncLog[]>(INITIAL_SYNC_LOG);
  const [lastSyncTime] = useState("31/03/2026 09:00");

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.info("Use o menu do navegador para instalar o app.");
      return;
    }
    (deferredPrompt as any).prompt();
    const result = await (deferredPrompt as any).userChoice;
    if (result.outcome === "accepted") {
      setIsInstalled(true);
      toast.success("App instalado com sucesso!");
    }
    setDeferredPrompt(null);
  };

  const handleRequestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notificações não suportadas neste navegador.");
      return;
    }
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === "granted") {
      toast.success("Permissão concedida!");
    } else {
      toast.error("Permissão negada pelo usuário.");
    }
  };

  const handleTestNotif = () => {
    const msg = "ContaFácil ERP — Notificação de teste enviada com sucesso!";
    if (notifPermission === "granted") {
      new Notification("ContaFácil ERP", { body: msg, icon: "/favicon.ico" });
    }
    const newNotif: PushNotif = {
      id: Date.now(),
      dataHora: new Date().toLocaleString("pt-BR").replace(",", ""),
      tipo: "Sistema",
      mensagem: "Notificação de teste enviada manualmente",
      status: notifPermission === "granted" ? "Entregue" : "Pendente",
    };
    setNotifs((prev) => [newNotif, ...prev]);
    toast.success("Notificação de teste enviada!");
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 200));
      setSyncProgress(i);
    }
    setIsSyncing(false);
    toast.success("Sincronização concluída — 637 registros atualizados.");
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(0.25 0.1 240 / 0.5)" }}
        >
          <Smartphone className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            App Mobile & PWA
          </h1>
          <p className="text-xs text-muted-foreground">
            Notificações push, modo offline e instalação do app
          </p>
        </div>
        <div className="ml-auto">
          {isOnline ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
              <Wifi className="w-3 h-3" /> Online
            </Badge>
          ) : (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1">
              <WifiOff className="w-3 h-3" /> Offline
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger data-ocid="app-mobile.status.tab" value="status">
            <Smartphone className="w-4 h-4 mr-1.5" /> Status PWA
          </TabsTrigger>
          <TabsTrigger data-ocid="app-mobile.push.tab" value="push">
            <Bell className="w-4 h-4 mr-1.5" /> Notificações Push
          </TabsTrigger>
          <TabsTrigger data-ocid="app-mobile.offline.tab" value="offline">
            <RefreshCw className="w-4 h-4 mr-1.5" /> Modo Offline
          </TabsTrigger>
        </TabsList>

        {/* Tab 1 — Status PWA */}
        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Install Status */}
            <Card className="rounded-xl border-border">
              <CardHeader
                className="px-5 py-4 border-b border-border"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.14 0.05 240) 0%, oklch(0.17 0.07 220) 100%)",
                }}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-400" />
                    Instalação do App
                  </CardTitle>
                  <Badge
                    className={
                      isInstalled
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    }
                  >
                    {isInstalled ? "Já instalado" : "Disponível"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Versão</span>
                    <span className="text-foreground font-medium">v35.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Última atualização</span>
                    <span className="text-foreground font-medium">
                      31/03/2026
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plataforma</span>
                    <span className="text-foreground font-medium">
                      PWA / Web App
                    </span>
                  </div>
                </div>
                {!isInstalled && (
                  <Button
                    data-ocid="app-mobile.install.button"
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleInstall}
                  >
                    <Download className="w-4 h-4" /> Instalar App
                  </Button>
                )}
                {isInstalled && (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    App instalado no dispositivo
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card className="rounded-xl border-border">
              <CardHeader
                className="px-5 py-4 border-b border-border"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.14 0.05 240) 0%, oklch(0.17 0.07 220) 100%)",
                }}
              >
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                  Status da Conexão
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex flex-col items-center justify-center gap-3 py-8">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${
                    isOnline
                      ? "bg-green-500/20 text-green-400 border-2 border-green-500/40"
                      : "bg-red-500/20 text-red-400 border-2 border-red-500/40"
                  }`}
                >
                  {isOnline ? (
                    <Wifi className="w-8 h-8" />
                  ) : (
                    <WifiOff className="w-8 h-8" />
                  )}
                </div>
                <Badge
                  className={`text-sm px-4 py-1 ${
                    isOnline
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}
                >
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </Badge>
                <p className="text-xs text-muted-foreground text-center">
                  {isOnline
                    ? "Dados sincronizando em tempo real"
                    : "Dados em modo offline — sincronize quando voltar online"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* PWA Features */}
          <Card className="rounded-xl border-border">
            <CardHeader
              className="px-5 py-4 border-b border-border"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.14 0.05 240) 0%, oklch(0.17 0.07 220) 100%)",
              }}
            >
              <CardTitle className="text-sm font-bold text-white">
                Funcionalidades PWA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Modo Offline", enabled: true },
                  {
                    label: "Notificações Push",
                    enabled: notifPermission === "granted",
                  },
                  { label: "Instalação Desktop/Mobile", enabled: true },
                  { label: "Sincronização Automática", enabled: autoSync },
                ].map((f) => (
                  <div
                    key={f.label}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-xs ${
                      f.enabled
                        ? "border-green-500/30 bg-green-500/10 text-green-400"
                        : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    {f.enabled ? (
                      <CheckCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span className="font-medium">{f.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2 — Notificações Push */}
        <TabsContent value="push" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Permission */}
            <Card className="rounded-xl border-border">
              <CardHeader
                className="px-5 py-4 border-b border-border"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.14 0.05 240) 0%, oklch(0.17 0.07 220) 100%)",
                }}
              >
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  Permissão de Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Status atual
                  </span>
                  <Badge
                    className={
                      notifPermission === "granted"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : notifPermission === "denied"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    }
                  >
                    {notifPermission === "granted"
                      ? "Concedida"
                      : notifPermission === "denied"
                        ? "Negada"
                        : "Não solicitada"}
                  </Badge>
                </div>
                {notifPermission !== "granted" && (
                  <Button
                    data-ocid="app-mobile.request-permission.button"
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleRequestPermission}
                    disabled={notifPermission === "denied"}
                  >
                    <Bell className="w-4 h-4" /> Solicitar Permissão
                  </Button>
                )}
                {notifPermission === "denied" && (
                  <p className="text-xs text-red-400/80">
                    Permissão bloqueada. Habilite nas configurações do
                    navegador.
                  </p>
                )}
                {notifPermission === "granted" && (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Notificações habilitadas
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mode & Test */}
            <Card className="rounded-xl border-border">
              <CardHeader
                className="px-5 py-4 border-b border-border"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.14 0.05 240) 0%, oklch(0.17 0.07 220) 100%)",
                }}
              >
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  Configurações de Envio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Modo Simulado / Real
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pushMode === "simulado"
                        ? "Notificações locais no navegador"
                        : "Via Web Push API (VAPID)"}
                    </p>
                  </div>
                  <Switch
                    data-ocid="app-mobile.push-mode.switch"
                    checked={pushMode === "real"}
                    onCheckedChange={(v) => {
                      const mode = v ? "real" : "simulado";
                      setPushMode(mode);
                      localStorage.setItem("pwa_push_mode", mode);
                    }}
                  />
                </div>
                {pushMode === "real" && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1">
                    <p className="font-medium">Chave VAPID</p>
                    <p className="text-blue-400/70">
                      Configure em Configurações → ARIA → Web Push para inserir
                      a chave VAPID pública do seu servidor.
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Notificações push
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ativar/desativar envio
                    </p>
                  </div>
                  <Switch
                    data-ocid="app-mobile.push-enabled.switch"
                    checked={pushEnabled}
                    onCheckedChange={(v) => {
                      setPushEnabled(v);
                      localStorage.setItem("pwa_push_enabled", String(v));
                    }}
                  />
                </div>
                <Button
                  data-ocid="app-mobile.test-notif.button"
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleTestNotif}
                  disabled={!pushEnabled}
                >
                  <Bell className="w-4 h-4" /> Enviar Notificação de Teste
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* History */}
          <Card className="rounded-xl border-border">
            <CardHeader
              className="px-5 py-4 border-b border-border"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.14 0.05 240) 0%, oklch(0.17 0.07 220) 100%)",
              }}
            >
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Histórico de Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs">Data/Hora</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Mensagem</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifs.map((n, i) => (
                    <TableRow
                      key={n.id}
                      data-ocid={`app-mobile.notif.item.${i + 1}`}
                      className="border-border text-xs"
                    >
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {n.dataHora}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] border ${tipoBadgeColor[n.tipo]}`}
                        >
                          {n.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground max-w-xs truncate">
                        {n.mensagem}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] border ${
                            n.status === "Entregue"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : n.status === "Falhou"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }`}
                        >
                          {n.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3 — Modo Offline */}
        <TabsContent value="offline" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sync Status */}
            <Card className="rounded-xl border-border">
              <CardHeader
                className="px-5 py-4 border-b border-border"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.14 0.05 240) 0%, oklch(0.17 0.07 220) 100%)",
                }}
              >
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                  Status de Sincronização
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Última sincronização
                    </span>
                    <span className="text-foreground font-medium">
                      {lastSyncTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Registros em cache
                    </span>
                    <span className="text-foreground font-medium">637</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Operações pendentes
                    </span>
                    <span className="text-yellow-400 font-medium">3</span>
                  </div>
                </div>
                {isSyncing && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Sincronizando...</span>
                      <span>{syncProgress}%</span>
                    </div>
                    <Progress
                      data-ocid="app-mobile.sync.loading_state"
                      value={syncProgress}
                      className="h-2"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Sincronização Automática
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sincroniza ao voltar online
                    </p>
                  </div>
                  <Switch
                    data-ocid="app-mobile.auto-sync.switch"
                    checked={autoSync}
                    onCheckedChange={(v) => {
                      setAutoSync(v);
                      localStorage.setItem("pwa_auto_sync", String(v));
                    }}
                  />
                </div>
                <Button
                  data-ocid="app-mobile.force-sync.button"
                  size="sm"
                  className="w-full gap-2"
                  disabled={isSyncing}
                  onClick={handleForceSync}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
                  />
                  {isSyncing ? "Sincronizando..." : "Forçar Sincronização"}
                </Button>
              </CardContent>
            </Card>

            {/* Pending + Offline capabilities */}
            <div className="space-y-4">
              <Card className="rounded-xl border-border">
                <CardHeader
                  className="px-5 py-4 border-b border-border"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.14 0.05 240) 0%, oklch(0.17 0.07 220) 100%)",
                  }}
                >
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    Operações Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {[
                    {
                      label: "Lançamento #1234",
                      desc: "aguardando sync — 5 min atrás",
                    },
                    {
                      label: "Contrato atualizado",
                      desc: "Beta Serviços S/A — 2 min atrás",
                    },
                    {
                      label: "Nota fiscal #5678",
                      desc: "emitida offline — 8 min atrás",
                    },
                  ].map((op, i) => (
                    <div
                      key={op.label}
                      data-ocid={`app-mobile.pending.item.${i + 1}`}
                      className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-xs"
                    >
                      <Clock className="w-3 h-3 text-yellow-400 shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">
                          {op.label}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          — {op.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-xl border-border">
                <CardHeader
                  className="px-5 py-3 border-b border-border"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.14 0.05 240) 0%, oklch(0.17 0.07 220) 100%)",
                  }}
                >
                  <CardTitle className="text-xs font-bold text-white">
                    Disponível Offline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-1.5">
                  {[
                    "Consulta de clientes",
                    "Visualização de documentos",
                    "Lançamentos manuais",
                    "Notas livres",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-xs text-green-400"
                    >
                      <CheckCircle className="w-3 h-3 shrink-0" />
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sync Log */}
          <Card className="rounded-xl border-border">
            <CardHeader
              className="px-5 py-4 border-b border-border"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.14 0.05 240) 0%, oklch(0.17 0.07 220) 100%)",
              }}
            >
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                Log de Sincronização
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs">Data/Hora</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">
                      Registros
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLog.map((s, i) => (
                    <TableRow
                      key={s.id}
                      data-ocid={`app-mobile.sync-log.item.${i + 1}`}
                      className="border-border text-xs"
                    >
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {s.dataHora}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {s.tipo}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] border ${syncStatusColor[s.status]}`}
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-foreground">
                        {s.registros > 0 ? s.registros : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
