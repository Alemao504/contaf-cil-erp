import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  HardDrive,
  RefreshCw,
  RotateCcw,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import { deleteRecord, getAllRecords, putRecord } from "../lib/db";

export interface LixeiraItem {
  id: string;
  nome: string;
  tipo: "cliente" | "lancamento" | "nota" | "documento";
  dataExclusao: string;
  excluidoPor: string;
  dadosOriginais?: string; // JSON serializado
}

const SEED_ITEMS: LixeiraItem[] = [
  {
    id: "lix-001",
    nome: "Mercado Santo Antônio Ltda",
    tipo: "cliente",
    dataExclusao: "2026-03-28T14:30:00",
    excluidoPor: "Maria Lima",
    dadosOriginais: JSON.stringify({
      cnpj: "12.345.678/0001-90",
      regime: "Simples Nacional",
    }),
  },
  {
    id: "lix-002",
    nome: "Lançamento NF #4521 — R$ 8.750,00",
    tipo: "lancamento",
    dataExclusao: "2026-03-27T09:15:00",
    excluidoPor: "João Ferreira",
    dadosOriginais: JSON.stringify({
      conta: "3.1.1.001",
      valor: 8750,
      historico: "Receita de serviços",
    }),
  },
  {
    id: "lix-003",
    nome: "Nota: Reunião com cliente Oliveira & Cia",
    tipo: "nota",
    dataExclusao: "2026-03-26T16:45:00",
    excluidoPor: "Ana Paula",
    dadosOriginais: JSON.stringify({
      conteudo: "Discussão sobre abertura de filial em SP",
      tags: ["reunião", "expansão"],
    }),
  },
  {
    id: "lix-004",
    nome: "DANFE_4521_TechSolucoes.pdf",
    tipo: "documento",
    dataExclusao: "2026-03-25T11:20:00",
    excluidoPor: "Carlos Mendes",
    dadosOriginais: JSON.stringify({ clientId: "cli-003", tamanho: 245000 }),
  },
  {
    id: "lix-005",
    nome: "Lançamento Folha Março/2026 — R$ 42.300,00",
    tipo: "lancamento",
    dataExclusao: "2026-03-24T08:00:00",
    excluidoPor: "Maria Lima",
    dadosOriginais: JSON.stringify({
      conta: "3.2.1.001",
      valor: 42300,
      historico: "Folha de pagamento",
    }),
  },
  {
    id: "lix-006",
    nome: "Construtora Horizonte S.A.",
    tipo: "cliente",
    dataExclusao: "2026-03-22T13:10:00",
    excluidoPor: "João Ferreira",
    dadosOriginais: JSON.stringify({
      cnpj: "98.765.432/0001-11",
      regime: "Lucro Real",
    }),
  },
  {
    id: "lix-007",
    nome: "Contrato_Prestacao_Servicos_2026.docx",
    tipo: "documento",
    dataExclusao: "2026-03-20T10:30:00",
    excluidoPor: "Ana Paula",
    dadosOriginais: JSON.stringify({ clientId: "cli-001", tamanho: 89000 }),
  },
];

interface BackupHistorico {
  id: string;
  data: string;
  hora: string;
  tamanho: string;
  provedor: string;
  status: "completo" | "parcial" | "erro";
  itens: number;
}

const SEED_BACKUPS: BackupHistorico[] = [
  {
    id: "bk-001",
    data: "31/03/2026",
    hora: "02:00",
    tamanho: "14.2 MB",
    provedor: "Google Drive",
    status: "completo",
    itens: 2847,
  },
  {
    id: "bk-002",
    data: "30/03/2026",
    hora: "02:00",
    tamanho: "13.9 MB",
    provedor: "Google Drive",
    status: "completo",
    itens: 2841,
  },
  {
    id: "bk-003",
    data: "29/03/2026",
    hora: "02:00",
    tamanho: "13.7 MB",
    provedor: "OneDrive",
    status: "parcial",
    itens: 2815,
  },
  {
    id: "bk-004",
    data: "28/03/2026",
    hora: "02:00",
    tamanho: "0 KB",
    provedor: "Dropbox",
    status: "erro",
    itens: 0,
  },
  {
    id: "bk-005",
    data: "27/03/2026",
    hora: "02:00",
    tamanho: "13.4 MB",
    provedor: "Google Drive",
    status: "completo",
    itens: 2800,
  },
];

const TIPO_LABELS: Record<LixeiraItem["tipo"], string> = {
  cliente: "Cliente",
  lancamento: "Lançamento",
  nota: "Nota",
  documento: "Documento",
};

const TIPO_COLORS: Record<LixeiraItem["tipo"], string> = {
  cliente: "bg-blue-100 text-blue-700",
  lancamento: "bg-green-100 text-green-700",
  nota: "bg-yellow-100 text-yellow-700",
  documento: "bg-purple-100 text-purple-700",
};

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function SincronizacaoNuvem() {
  const { addMessage } = useARIA();
  const [lixeira, setLixeira] = useState<LixeiraItem[]>([]);
  const [backups, setBackups] = useState<BackupHistorico[]>(SEED_BACKUPS);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [syncEnabled, setSyncEnabled] = useState(
    () => localStorage.getItem("sync_nuvem_enabled") === "true",
  );
  const [provedor, setProvedor] = useState(
    () => localStorage.getItem("sync_nuvem_provedor") || "google",
  );
  const [intervalo, setIntervalo] = useState(
    () => localStorage.getItem("sync_nuvem_intervalo") || "24h",
  );
  const [syncStatus, setSyncStatus] = useState<"synced" | "pending" | "error">(
    "synced",
  );
  const [lastSync, setLastSync] = useState(
    () => localStorage.getItem("sync_nuvem_last") || "Nunca sincronizado",
  );
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [inclDocs, setInclDocs] = useState(
    () => localStorage.getItem("sync_incl_docs") !== "false",
  );
  const [backupPreDelete, setBackupPreDelete] = useState(
    () => localStorage.getItem("sync_backup_pre_delete") !== "false",
  );
  const [notifAria, setNotifAria] = useState(
    () => localStorage.getItem("sync_notif_aria") !== "false",
  );
  const [retencao, setRetencao] = useState(
    () => localStorage.getItem("sync_retencao") || "30",
  );
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load lixeira from IndexedDB
  useEffect(() => {
    getAllRecords<LixeiraItem>("lixeira_itens")
      .then((items) => {
        if (items.length === 0) {
          // Seed example items
          Promise.all(SEED_ITEMS.map((i) => putRecord("lixeira_itens", i)))
            .then(() => setLixeira(SEED_ITEMS))
            .catch(() => setLixeira(SEED_ITEMS));
        } else {
          setLixeira(items);
        }
      })
      .catch(() => setLixeira(SEED_ITEMS));
  }, []);

  const handleSyncNow = () => {
    if (!syncEnabled) {
      toast.error("Sincronização está desabilitada. Ative-a primeiro.");
      return;
    }
    setSyncing(true);
    setSyncProgress(0);
    setSyncStatus("pending");

    let p = 0;
    progressRef.current = setInterval(() => {
      p += Math.random() * 25 + 10;
      if (p >= 100) {
        p = 100;
        clearInterval(progressRef.current!);
        setSyncProgress(100);
        setSyncing(false);
        setSyncStatus("synced");
        const now = new Date().toLocaleString("pt-BR");
        setLastSync(now);
        localStorage.setItem("sync_nuvem_last", now);

        const novoBackup: BackupHistorico = {
          id: `bk-${Date.now()}`,
          data: new Date().toLocaleDateString("pt-BR"),
          hora: new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          tamanho: `${(Math.random() * 3 + 13).toFixed(1)} MB`,
          provedor:
            provedor === "google"
              ? "Google Drive"
              : provedor === "onedrive"
                ? "OneDrive"
                : "Dropbox",
          status: "completo",
          itens: 2800 + Math.floor(Math.random() * 100),
        };
        setBackups((prev) => [novoBackup, ...prev]);
        putRecord("backup_historico", novoBackup).catch(() => {});

        toast.success("Sincronização concluída com sucesso!");
        if (notifAria) {
          addMessage({
            type: "success",
            text: `☁️ Sincronização concluída! Backup salvo em ${novoBackup.provedor} — ${novoBackup.tamanho}, ${novoBackup.itens} registros.`,
          });
        }
      } else {
        setSyncProgress(Math.min(p, 99));
      }
    }, 200);
  };

  const handleRestore = (item: LixeiraItem) => {
    deleteRecord("lixeira_itens", item.id)
      .then(() => {
        setLixeira((prev) => prev.filter((x) => x.id !== item.id));
        toast.success(`"${item.nome}" restaurado com sucesso!`);
        addMessage({
          type: "success",
          text: `♻️ Item restaurado da lixeira: "${item.nome}" (${TIPO_LABELS[item.tipo]}).`,
        });
      })
      .catch(() => {
        setLixeira((prev) => prev.filter((x) => x.id !== item.id));
        toast.success(`"${item.nome}" restaurado!`);
      });
  };

  const handleDeletePermanent = (item: LixeiraItem) => {
    deleteRecord("lixeira_itens", item.id)
      .then(() => {
        setLixeira((prev) => prev.filter((x) => x.id !== item.id));
        toast.success(`"${item.nome}" excluído permanentemente.`);
      })
      .catch(() => {
        setLixeira((prev) => prev.filter((x) => x.id !== item.id));
        toast.success("Item excluído permanentemente.");
      });
  };

  const handleRestoreAll = () => {
    const count = filteredLixeira.length;
    Promise.all(
      filteredLixeira.map((i) => deleteRecord("lixeira_itens", i.id)),
    ).finally(() => {
      const ids = new Set(filteredLixeira.map((i) => i.id));
      setLixeira((prev) => prev.filter((x) => !ids.has(x.id)));
      toast.success(`${count} item(s) restaurados com sucesso!`);
      addMessage({
        type: "success",
        text: `♻️ ${count} item(s) restaurados da lixeira de uma vez.`,
      });
    });
  };

  const handleDownloadBackup = (bk: BackupHistorico) => {
    const data = JSON.stringify(
      {
        backup: bk,
        timestamp: new Date().toISOString(),
        app: "ContaFácil ERP",
      },
      null,
      2,
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_contafacil_${bk.data.replace(/\//g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup baixado!");
  };

  const filteredLixeira = lixeira.filter(
    (i) => filtroTipo === "todos" || i.tipo === filtroTipo,
  );

  const provedorLabel =
    provedor === "google"
      ? "Google Drive"
      : provedor === "onedrive"
        ? "OneDrive"
        : "Dropbox";

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-primary" />
            Sincronização em Nuvem
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Backup automático, recuperação de dados e lixeira com restauração
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncStatus === "synced" && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Sincronizado
            </Badge>
          )}
          {syncStatus === "pending" && (
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Sincronizando
            </Badge>
          )}
          {syncStatus === "error" && (
            <Badge className="bg-red-100 text-red-700 border-red-200">
              <XCircle className="w-3 h-3 mr-1" /> Erro
            </Badge>
          )}
          <Badge variant="outline">{lixeira.length} na lixeira</Badge>
        </div>
      </div>

      <Tabs defaultValue="sync">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="sync" data-ocid="sync_nuvem.sync.tab">
            Sincronização
          </TabsTrigger>
          <TabsTrigger value="lixeira" data-ocid="sync_nuvem.lixeira.tab">
            Lixeira
            {lixeira.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center">
                {lixeira.length > 9 ? "9+" : lixeira.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="historico" data-ocid="sync_nuvem.historico.tab">
            Backups
          </TabsTrigger>
          <TabsTrigger value="config" data-ocid="sync_nuvem.config.tab">
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB: SYNC ===== */}
        <TabsContent value="sync" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sync control card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-primary" />
                  Controle de Sincronização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">
                      Sincronização em Nuvem
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Habilitar backup automático
                    </p>
                  </div>
                  <Switch
                    data-ocid="sync_nuvem.enabled.switch"
                    checked={syncEnabled}
                    onCheckedChange={(v) => {
                      setSyncEnabled(v);
                      localStorage.setItem("sync_nuvem_enabled", String(v));
                      if (v) {
                        setSyncStatus("pending");
                        toast.success("Sincronização ativada!");
                      } else {
                        setSyncStatus("error");
                        toast.success("Sincronização desativada.");
                      }
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Provedor</Label>
                  <div className="flex gap-2">
                    {[
                      { id: "google", label: "Google Drive" },
                      { id: "onedrive", label: "OneDrive" },
                      { id: "dropbox", label: "Dropbox" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        data-ocid={`sync_nuvem.provedor_${p.id}.button`}
                        onClick={() => {
                          setProvedor(p.id);
                          localStorage.setItem("sync_nuvem_provedor", p.id);
                        }}
                        className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${
                          provedor === p.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Intervalo de Sincronização</Label>
                  <Select
                    value={intervalo}
                    onValueChange={(v) => {
                      setIntervalo(v);
                      localStorage.setItem("sync_nuvem_intervalo", v);
                    }}
                  >
                    <SelectTrigger data-ocid="sync_nuvem.intervalo.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="1h">A cada 1 hora</SelectItem>
                      <SelectItem value="6h">A cada 6 horas</SelectItem>
                      <SelectItem value="24h">A cada 24 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  {syncing ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Sincronizando com {provedorLabel}...</span>
                        <span>{Math.round(syncProgress)}%</span>
                      </div>
                      <Progress value={syncProgress} className="h-2" />
                    </div>
                  ) : (
                    <Button
                      data-ocid="sync_nuvem.sincronizar.button"
                      onClick={handleSyncNow}
                      className="w-full"
                      disabled={!syncEnabled}
                    >
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Sincronizar Agora
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-primary" />
                  Status e Armazenamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Última sincronização
                    </span>
                    <span className="font-medium text-xs">{lastSync}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Provedor ativo
                    </span>
                    <span className="font-medium">{provedorLabel}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">
                      {syncEnabled ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1">
                          <CloudOff className="w-3 h-3" /> Inativo
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Uso de Armazenamento
                  </Label>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>IndexedDB Local</span>
                      <span className="font-medium">14.2 MB / 50 MB</span>
                    </div>
                    <Progress value={28} className="h-1.5" />
                    <div className="flex justify-between text-xs">
                      <span>Nuvem ({provedorLabel})</span>
                      <span className="font-medium">67.8 MB / 15 GB</span>
                    </div>
                    <Progress value={0.5} className="h-1.5" />
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
                  <p className="font-medium">Dados sincronizados</p>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Clientes</span>
                    <span>48</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Lançamentos</span>
                    <span>2.341</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Documentos</span>
                    <span>387</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Notas</span>
                    <span>71</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== TAB: LIXEIRA ===== */}
        <TabsContent value="lixeira" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger
                  className="w-40"
                  data-ocid="sync_nuvem.lixeira_filter.select"
                >
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="cliente">Clientes</SelectItem>
                  <SelectItem value="lancamento">Lançamentos</SelectItem>
                  <SelectItem value="nota">Notas</SelectItem>
                  <SelectItem value="documento">Documentos</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {filteredLixeira.length} item(s)
              </span>
            </div>
            {filteredLixeira.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    data-ocid="sync_nuvem.restaurar_todos.button"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Restaurar Todos
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent data-ocid="sync_nuvem.restaurar_todos.dialog">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Restaurar todos os itens?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {filteredLixeira.length} item(s) serão restaurados para
                      seus locais originais.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-ocid="sync_nuvem.restaurar_todos.cancel_button">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      data-ocid="sync_nuvem.restaurar_todos.confirm_button"
                      onClick={handleRestoreAll}
                    >
                      Restaurar Todos
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {filteredLixeira.length === 0 ? (
            <div
              data-ocid="sync_nuvem.lixeira.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl"
            >
              <Trash2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">Lixeira vazia</p>
              <p className="text-sm text-muted-foreground/70">
                Nenhum item excluído no momento
              </p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table data-ocid="sync_nuvem.lixeira.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Excluído em</TableHead>
                    <TableHead>Excluído por</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLixeira.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      data-ocid={`sync_nuvem.lixeira.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">
                        {item.nome}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_COLORS[item.tipo]}`}
                        >
                          {TIPO_LABELS[item.tipo]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmt(item.dataExclusao)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.excluidoPor}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`sync_nuvem.lixeira.restore_button.${idx + 1}`}
                            onClick={() => handleRestore(item)}
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Restaurar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                data-ocid={`sync_nuvem.lixeira.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent
                              data-ocid={`sync_nuvem.lixeira.delete_dialog.${idx + 1}`}
                            >
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Excluir permanentemente?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  &ldquo;{item.nome}&rdquo; será excluído
                                  permanentemente e não poderá ser recuperado.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  data-ocid={`sync_nuvem.lixeira.delete_cancel.${idx + 1}`}
                                >
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  data-ocid={`sync_nuvem.lixeira.delete_confirm.${idx + 1}`}
                                  onClick={() => handleDeletePermanent(item)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ===== TAB: HISTÓRICO BACKUPS ===== */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          <div className="rounded-xl border overflow-hidden">
            <Table data-ocid="sync_nuvem.backups.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Data / Hora</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((bk, idx) => (
                  <TableRow
                    key={bk.id}
                    data-ocid={`sync_nuvem.backups.item.${idx + 1}`}
                  >
                    <TableCell className="text-sm">
                      <span className="font-medium">{bk.data}</span>
                      <span className="text-muted-foreground ml-1">
                        às {bk.hora}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{bk.provedor}</TableCell>
                    <TableCell className="text-sm">{bk.tamanho}</TableCell>
                    <TableCell className="text-sm">
                      {bk.itens > 0 ? bk.itens.toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      {bk.status === "completo" && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Completo
                        </Badge>
                      )}
                      {bk.status === "parcial" && (
                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                          Parcial
                        </Badge>
                      )}
                      {bk.status === "erro" && (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                          <XCircle className="w-3 h-3 mr-1" /> Erro
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              data-ocid={`sync_nuvem.backups.restore_button.${idx + 1}`}
                              disabled={bk.status === "erro"}
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              Restaurar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Restaurar este backup?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                O backup de {bk.data} ({bk.tamanho}, {bk.itens}{" "}
                                registros) será restaurado. Esta ação
                                substituirá os dados atuais.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  toast.success(
                                    `Backup de ${bk.data} restaurado com sucesso!`,
                                  )
                                }
                              >
                                Restaurar Backup
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          size="sm"
                          variant="ghost"
                          data-ocid={`sync_nuvem.backups.download_button.${idx + 1}`}
                          onClick={() => handleDownloadBackup(bk)}
                          disabled={bk.status === "erro"}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ===== TAB: CONFIGURAÇÕES ===== */}
        <TabsContent value="config" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Opções de Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">
                    Incluir documentos no backup
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Pode aumentar significativamente o tamanho do backup
                  </p>
                </div>
                <Switch
                  data-ocid="sync_nuvem.incl_docs.switch"
                  checked={inclDocs}
                  onCheckedChange={(v) => {
                    setInclDocs(v);
                    localStorage.setItem("sync_incl_docs", String(v));
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">
                    Backup automático antes de exclusões
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Cria um ponto de restauração antes de excluir qualquer dado
                  </p>
                </div>
                <Switch
                  data-ocid="sync_nuvem.backup_pre_delete.switch"
                  checked={backupPreDelete}
                  onCheckedChange={(v) => {
                    setBackupPreDelete(v);
                    localStorage.setItem("sync_backup_pre_delete", String(v));
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">
                    Notificar ARIA ao sincronizar
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    ARIA enviará mensagem ao chat quando a sincronização for
                    concluída
                  </p>
                </div>
                <Switch
                  data-ocid="sync_nuvem.notif_aria.switch"
                  checked={notifAria}
                  onCheckedChange={(v) => {
                    setNotifAria(v);
                    localStorage.setItem("sync_notif_aria", String(v));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-medium">Retenção de backups</Label>
                <Select
                  value={retencao}
                  onValueChange={(v) => {
                    setRetencao(v);
                    localStorage.setItem("sync_retencao", v);
                  }}
                >
                  <SelectTrigger
                    data-ocid="sync_nuvem.retencao.select"
                    className="w-56"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                    <SelectItem value="ilimitado">Ilimitado</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Backups mais antigos serão excluídos automaticamente
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Modo de Integração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">
                    Modo Real (API de Nuvem)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Quando ativo, conecta a APIs reais de nuvem. Quando inativo,
                    usa modo simulado.
                  </p>
                </div>
                <Switch
                  data-ocid="sync_nuvem.modo_real.switch"
                  checked={
                    localStorage.getItem("sync_nuvem_modo_real") === "true"
                  }
                  onCheckedChange={(v) => {
                    localStorage.setItem("sync_nuvem_modo_real", String(v));
                    toast.success(
                      v
                        ? "Modo real ativado. Configure as credenciais de API."
                        : "Modo simulado ativado.",
                    );
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
