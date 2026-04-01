import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Pause,
  Play,
  Square,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useARIA } from "../context/ARIAContext";
import { useAppContext } from "../context/AppContext";

type ClientStatus = "pending" | "processing" | "done" | "error" | "skipped";

interface BatchClient {
  id: string;
  name: string;
  status: ClientStatus;
  progress: number;
  tasks: string[];
  completedTasks: string[];
  error?: string;
}

const TASK_OPTIONS = [
  { id: "relatorio", label: "Relatório Mensal" },
  { id: "folha", label: "Folha de Pagamento" },
  { id: "fiscal", label: "Guias de Impostos" },
  { id: "backup", label: "Backup de Dados" },
  { id: "conciliacao", label: "Conciliação Bancária" },
];

export default function AriaLote() {
  const { clients } = useAppContext();
  const { addMessage } = useARIA();
  const [selectedTasks, setSelectedTasks] = useState<string[]>([
    "relatorio",
    "fiscal",
  ]);
  const [batchClients, setBatchClients] = useState<BatchClient[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [done, setDone] = useState(false);
  const pausedRef = useRef(false);
  const stoppedRef = useRef(false);

  const initBatch = useCallback(() => {
    const taskLabels = TASK_OPTIONS.filter((t) =>
      selectedTasks.includes(t.id),
    ).map((t) => t.label);
    const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name));
    const fallback =
      sorted.length > 0
        ? sorted
        : [
            { id: "c1", name: "Construtora Beta Ltda" },
            { id: "c2", name: "Empresa Alfa Ltda" },
            { id: "c3", name: "Comercial Gama ME" },
            { id: "c4", name: "Tech Solutions SA" },
            { id: "c5", name: "Distribuidora Delta Eireli" },
          ];
    const list = (sorted.length > 0 ? sorted : fallback) as {
      id: string;
      name: string;
    }[];
    setBatchClients(
      list.map((c) => ({
        id: c.id,
        name: c.name,
        status: "pending",
        progress: 0,
        tasks: taskLabels,
        completedTasks: [],
      })),
    );
    setCurrentIdx(0);
    setDone(false);
  }, [clients, selectedTasks]);

  const runBatch = useCallback(async () => {
    setIsRunning(true);
    setIsPaused(false);
    pausedRef.current = false;
    stoppedRef.current = false;
    setDone(false);

    const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const waitIfPaused = async () => {
      while (pausedRef.current && !stoppedRef.current) {
        await delay(300);
      }
    };

    let clientList: BatchClient[] = [];
    setBatchClients((prev) => {
      clientList = prev;
      return prev;
    });
    // read current state
    await delay(10);

    setBatchClients((prev) => {
      clientList = [...prev];
      return prev;
    });

    addMessage({
      type: "info",
      text: `🔄 Iniciando processamento em lote de ${clientList.length} clientes (A→Z)...`,
    });

    for (let i = 0; i < clientList.length; i++) {
      if (stoppedRef.current) break;
      await waitIfPaused();
      if (stoppedRef.current) break;

      setCurrentIdx(i);
      const client = clientList[i];

      setBatchClients((prev) =>
        prev.map((c, ci) =>
          ci === i ? { ...c, status: "processing", progress: 5 } : c,
        ),
      );

      addMessage({
        type: "info",
        text: `📋 Processando ${i + 1}/${clientList.length}: ${client.name}`,
      });

      const tasks = client.tasks;
      for (let ti = 0; ti < tasks.length; ti++) {
        if (stoppedRef.current) break;
        await waitIfPaused();
        await delay(600 + Math.random() * 400);

        const prog = Math.round(((ti + 1) / tasks.length) * 90);
        setBatchClients((prev) =>
          prev.map((c, ci) =>
            ci === i
              ? {
                  ...c,
                  progress: prog,
                  completedTasks: [...c.completedTasks, tasks[ti]],
                }
              : c,
          ),
        );
      }

      if (stoppedRef.current) {
        setBatchClients((prev) =>
          prev.map((c, ci) =>
            ci === i ? { ...c, status: "skipped", progress: 0 } : c,
          ),
        );
        break;
      }

      const hasError = Math.random() < 0.08;
      setBatchClients((prev) =>
        prev.map((c, ci) =>
          ci === i
            ? {
                ...c,
                status: hasError ? "error" : "done",
                progress: 100,
                error: hasError
                  ? "Timeout na conexão com API fiscal"
                  : undefined,
              }
            : c,
        ),
      );

      if (hasError) {
        addMessage({
          type: "error",
          text: `❌ Erro em ${client.name}: Timeout na API fiscal`,
        });
      }

      await delay(200);
    }

    setIsRunning(false);
    setDone(true);
    addMessage({
      type: "success",
      text: "✅ Processamento em lote concluído!",
    });
  }, [addMessage]);

  const handleStart = () => {
    initBatch();
    setTimeout(() => runBatch(), 50);
  };

  const handlePause = () => {
    setIsPaused(true);
    pausedRef.current = true;
    addMessage({ type: "warning", text: "⏸️ Processamento em lote pausado." });
  };

  const handleResume = () => {
    setIsPaused(false);
    pausedRef.current = false;
    addMessage({ type: "info", text: "▶️ Processamento em lote retomado." });
  };

  const handleStop = () => {
    stoppedRef.current = true;
    pausedRef.current = false;
    setIsRunning(false);
    setIsPaused(false);
    addMessage({
      type: "warning",
      text: "⏹️ Processamento em lote interrompido pelo usuário.",
    });
  };

  const completedCount = batchClients.filter((c) => c.status === "done").length;
  const errorCount = batchClients.filter((c) => c.status === "error").length;
  const totalProgress =
    batchClients.length > 0
      ? Math.round(
          batchClients.reduce((s, c) => s + c.progress, 0) /
            batchClients.length,
        )
      : 0;

  const statusIcon = (s: ClientStatus) => {
    switch (s) {
      case "done":
        return <CheckCircle2 size={15} className="text-green-400 shrink-0" />;
      case "error":
        return <XCircle size={15} className="text-red-400 shrink-0" />;
      case "processing":
        return (
          <Loader2 size={15} className="text-blue-400 animate-spin shrink-0" />
        );
      case "skipped":
        return <Circle size={15} className="text-yellow-400 shrink-0" />;
      default:
        return <Circle size={15} className="text-muted-foreground shrink-0" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Processamento em Lote
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          ARIA processa múltiplos clientes em sequência (A→Z) automaticamente
        </p>
      </div>

      {/* Task selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Tarefas a Executar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TASK_OPTIONS.map((task) => (
              <div key={task.id} className="flex items-center gap-2">
                <Switch
                  id={`task-${task.id}`}
                  checked={selectedTasks.includes(task.id)}
                  onCheckedChange={(checked) => {
                    setSelectedTasks((prev) =>
                      checked
                        ? [...prev, task.id]
                        : prev.filter((t) => t !== task.id),
                    );
                  }}
                  disabled={isRunning}
                />
                <label
                  htmlFor={`task-${task.id}`}
                  className="text-xs text-foreground cursor-pointer"
                >
                  {task.label}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isRunning && (
          <Button
            onClick={handleStart}
            disabled={selectedTasks.length === 0}
            data-ocid="lote.primary_button"
          >
            <Play size={14} className="mr-1.5" />
            {done ? "Executar Novamente" : "Iniciar Lote"}
          </Button>
        )}
        {isRunning && !isPaused && (
          <Button
            variant="outline"
            onClick={handlePause}
            data-ocid="lote.secondary_button"
          >
            <Pause size={14} className="mr-1.5" /> Pausar
          </Button>
        )}
        {isRunning && isPaused && (
          <Button onClick={handleResume} data-ocid="lote.secondary_button">
            <Play size={14} className="mr-1.5" /> Retomar
          </Button>
        )}
        {isRunning && (
          <Button
            variant="destructive"
            onClick={handleStop}
            data-ocid="lote.delete_button"
          >
            <Square size={14} className="mr-1.5" /> Parar
          </Button>
        )}
        {batchClients.length > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {completedCount + errorCount}/{batchClients.length} concluídos
            {errorCount > 0 && (
              <span className="text-red-400 ml-1">({errorCount} erros)</span>
            )}
          </span>
        )}
      </div>

      {/* Overall progress */}
      {batchClients.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>
                {isRunning && !isPaused
                  ? `Processando cliente ${Math.min(currentIdx + 1, batchClients.length)}/${batchClients.length}...`
                  : isPaused
                    ? "Pausado"
                    : done
                      ? "Concluído"
                      : "Aguardando"}
              </span>
              <span>{totalProgress}%</span>
            </div>
            <Progress
              value={totalProgress}
              className="h-2"
              data-ocid="lote.loading_state"
            />
          </CardContent>
        </Card>
      )}

      {/* Client list */}
      {batchClients.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users size={14} /> Clientes ({batchClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="divide-y divide-border">
                {batchClients.map((client, idx) => (
                  <div
                    key={client.id}
                    className="flex items-start gap-3 px-4 py-3"
                    data-ocid={`lote.item.${idx + 1}`}
                  >
                    {statusIcon(client.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground truncate">
                          {client.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {client.status === "done" && "✅ Concluído"}
                          {client.status === "error" && "❌ Erro"}
                          {client.status === "processing" &&
                            `⏳ ${client.progress}%`}
                          {client.status === "pending" && "⏳ Aguardando"}
                          {client.status === "skipped" && "⚠️ Ignorado"}
                        </span>
                      </div>
                      {client.status === "processing" && (
                        <Progress
                          value={client.progress}
                          className="h-1 mt-1.5"
                        />
                      )}
                      {client.error && (
                        <p className="text-[10px] text-red-400 mt-0.5">
                          {client.error}
                        </p>
                      )}
                      {client.completedTasks.length > 0 &&
                        client.status !== "processing" && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {client.completedTasks.map((t) => (
                              <span
                                key={t}
                                className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {batchClients.length === 0 && (
        <Card data-ocid="lote.empty_state">
          <CardContent className="py-16 text-center">
            <Zap size={36} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Configure as tarefas acima e clique em "Iniciar Lote" para
              processar todos os clientes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
