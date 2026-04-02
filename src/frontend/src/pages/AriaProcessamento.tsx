import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ListChecks,
  Loader2,
  Play,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { type ScanTask, useARIA } from "../context/ARIAContext";

const ALL_CLIENTS = [
  "Ana Lima",
  "Bruno Ferreira",
  "Carlos Mendes",
  "Diana Costa",
  "Eduardo Santos",
  "Fernanda Oliveira",
  "Gustavo Rocha",
  "Helena Martins",
];

function statusColor(status: ScanTask["status"]) {
  switch (status) {
    case "concluido":
      return "border-green-500/40 bg-green-500/10";
    case "processando":
      return "border-yellow-400/50 bg-yellow-400/10";
    case "erro":
      return "border-red-500/40 bg-red-500/10";
    default:
      return "border-blue-400/30 bg-blue-400/8";
  }
}

function StatusIcon({ status }: { status: ScanTask["status"] }) {
  switch (status) {
    case "concluido":
      return <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />;
    case "processando":
      return (
        <Loader2 className="w-4 h-4 text-yellow-400 animate-spin flex-shrink-0" />
      );
    case "erro":
      return <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
    default:
      return <Circle className="w-4 h-4 text-blue-400 flex-shrink-0" />;
  }
}

function StatusLabel({ status }: { status: ScanTask["status"] }) {
  const map: Record<ScanTask["status"], { label: string; cls: string }> = {
    pendente: { label: "Pendente", cls: "bg-blue-500/20 text-blue-300" },
    processando: {
      label: "Processando",
      cls: "bg-yellow-500/20 text-yellow-300",
    },
    concluido: { label: "Concluído", cls: "bg-green-500/20 text-green-300" },
    erro: { label: "Erro", cls: "bg-red-500/20 text-red-300" },
  };
  const { label, cls } = map[status];
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${cls}`}
    >
      {label}
    </span>
  );
}

export default function AriaProcessamento() {
  const { scanTasks, isProcessing, startSequentialProcessing, reScan } =
    useARIA();

  const [selectedClients, setSelectedClients] = useState<Set<string>>(
    new Set(ALL_CLIENTS),
  );
  const [errorTask, setErrorTask] = useState<ScanTask | null>(null);

  const total = scanTasks.length;
  const done = scanTasks.filter((t) => t.status === "concluido").length;
  const errors = scanTasks.filter((t) => t.status === "erro").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  function toggleClient(name: string) {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function handleStartProcessing() {
    startSequentialProcessing(Array.from(selectedClients));
  }

  function handleReScan() {
    reScan(Array.from(selectedClients));
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <ListChecks className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Processamento Sequencial ARIA
          </h1>
          <p className="text-sm text-muted-foreground">
            A ARIA processa um cliente por vez, em ordem, sem sobrepor tarefas
          </p>
        </div>
      </div>

      {/* Controls + progress */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <Button
              data-ocid="aria-processamento.primary_button"
              onClick={handleStartProcessing}
              disabled={isProcessing || scanTasks.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isProcessing ? "Processando..." : "Iniciar Processamento"}
            </Button>
            <Button
              data-ocid="aria-processamento.secondary_button"
              variant="outline"
              onClick={handleReScan}
              disabled={isProcessing}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Novo Scan
            </Button>
            <div className="ml-auto text-sm text-muted-foreground">
              {done}/{total} concluídos
              {errors > 0 && (
                <span className="ml-2 text-red-400 font-medium">
                  · {errors} erro{errors > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          {total > 0 && (
            <div className="space-y-1">
              <Progress
                data-ocid="aria-processamento.loading_state"
                value={progress}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground text-right">
                {progress}% concluído
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client selector */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Clientes Selecionados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ALL_CLIENTS.map((name) => {
              const checkId = `client-check-${name.replace(/\s+/g, "-").toLowerCase()}`;
              return (
                <div
                  key={name}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <Checkbox
                    id={checkId}
                    data-ocid="aria-processamento.checkbox"
                    checked={selectedClients.has(name)}
                    onCheckedChange={() => toggleClient(name)}
                  />
                  <Label
                    htmlFor={checkId}
                    className="text-sm text-foreground/80 group-hover:text-foreground transition-colors cursor-pointer"
                  >
                    {name}
                  </Label>
                </div>
              );
            })}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                onClick={() => setSelectedClients(new Set(ALL_CLIENTS))}
              >
                Selecionar todos
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setSelectedClients(new Set())}
              >
                Limpar
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Task progress list */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Lista de Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scanTasks.length === 0 ? (
              <div
                data-ocid="aria-processamento.empty_state"
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <ListChecks className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">
                  Nenhuma tarefa encontrada.
                </p>
                <p className="text-muted-foreground/60 text-xs mt-1">
                  Clique em &quot;Novo Scan&quot; para detectar tarefas
                  pendentes.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[380px] pr-2">
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {scanTasks.map((task, idx) => (
                      <motion.div
                        key={task.id}
                        data-ocid={`aria-processamento.item.${idx + 1}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${statusColor(
                          task.status,
                        )}`}
                      >
                        <StatusIcon status={task.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {task.clienteName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {task.tipo}
                          </p>
                        </div>
                        <StatusLabel status={task.status} />
                        {task.status === "erro" && (
                          <Button
                            data-ocid={`aria-processamento.edit_button.${idx + 1}`}
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                            onClick={() => setErrorTask(task)}
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Ver Erro
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error detail dialog */}
      <Dialog
        open={!!errorTask}
        onOpenChange={(open) => !open && setErrorTask(null)}
      >
        <DialogContent data-ocid="aria-processamento.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              Detalhe do Erro
            </DialogTitle>
          </DialogHeader>
          {errorTask && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                    Cliente
                  </p>
                  <p className="font-medium">{errorTask.clienteName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                    Tarefa
                  </p>
                  <p className="font-medium">{errorTask.tipo}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-300">
                  {errorTask.erroDetalhe || "Erro desconhecido."}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              data-ocid="aria-processamento.cancel_button"
              variant="outline"
              onClick={() => setErrorTask(null)}
            >
              Fechar
            </Button>
            <Button
              data-ocid="aria-processamento.confirm_button"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setErrorTask(null)}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Marcar como Resolvido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
