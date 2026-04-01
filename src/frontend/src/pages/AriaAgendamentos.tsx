import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch";
import {
  AlarmClock,
  CalendarClock,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useARIA } from "../context/ARIAContext";

interface AgendadoTask {
  id: string;
  name: string;
  taskType: string;
  frequency: string;
  time: string;
  clients: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
}

const TASK_TYPES = [
  "Relatório Mensal",
  "Folha de Pagamento",
  "Guias de Impostos",
  "Backup de Dados",
  "Conciliação Bancária",
  "Fechamento Contábil",
  "Análise Preditiva",
  "Exportação em Lote",
];

const FREQUENCIES = ["Diário", "Semanal", "Quinzenal", "Mensal"];

const INITIAL_TASKS: AgendadoTask[] = [
  {
    id: "t1",
    name: "Relatório Mensal — Todos os Clientes",
    taskType: "Relatório Mensal",
    frequency: "Mensal",
    time: "08:00",
    clients: "Todos",
    enabled: true,
    lastRun: "01/03/2026 08:00",
    nextRun: "01/04/2026 08:00",
    runCount: 4,
  },
  {
    id: "t2",
    name: "Folha de Pagamento — Mensal",
    taskType: "Folha de Pagamento",
    frequency: "Mensal",
    time: "09:00",
    clients: "Todos",
    enabled: true,
    lastRun: "05/03/2026 09:00",
    nextRun: "05/04/2026 09:00",
    runCount: 3,
  },
  {
    id: "t3",
    name: "Backup Diário",
    taskType: "Backup de Dados",
    frequency: "Diário",
    time: "02:00",
    clients: "Todos",
    enabled: false,
    lastRun: "31/03/2026 02:00",
    nextRun: "01/04/2026 02:00",
    runCount: 30,
  },
];

function freqBadgeColor(freq: string) {
  switch (freq) {
    case "Diário":
      return "bg-blue-500/15 text-blue-400";
    case "Semanal":
      return "bg-purple-500/15 text-purple-400";
    case "Quinzenal":
      return "bg-orange-500/15 text-orange-400";
    case "Mensal":
      return "bg-green-500/15 text-green-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function AriaAgendamentos() {
  const { addMessage } = useARIA();
  const [tasks, setTasks] = useState<AgendadoTask[]>(() => {
    try {
      const s = localStorage.getItem("ariaAgendamentos");
      if (s) return JSON.parse(s);
    } catch {}
    return INITIAL_TASKS;
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    taskType: TASK_TYPES[0],
    frequency: FREQUENCIES[0],
    time: "08:00",
    clients: "Todos",
  });

  useEffect(() => {
    localStorage.setItem("ariaAgendamentos", JSON.stringify(tasks));
  }, [tasks]);

  const handleToggle = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, enabled: !t.enabled };
        addMessage({
          type: updated.enabled ? "success" : "warning",
          text: updated.enabled
            ? `✅ Agendamento "${t.name}" ativado.`
            : `⏸️ Agendamento "${t.name}" desativado.`,
        });
        return updated;
      }),
    );
  };

  const handleDelete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (task)
      addMessage({
        type: "info",
        text: `🗑️ Agendamento "${task.name}" removido.`,
      });
  };

  const handleRunNow = (task: AgendadoTask) => {
    addMessage({ type: "info", text: `▶️ Executando agora: ${task.name}...` });
    setTimeout(() => {
      addMessage({
        type: "success",
        text: `✅ ${task.name} concluído com sucesso!`,
      });
    }, 2000);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              lastRun: new Date().toLocaleString("pt-BR"),
              runCount: t.runCount + 1,
            }
          : t,
      ),
    );
  };

  const handleCreate = () => {
    if (!form.name.trim()) return;
    const newTask: AgendadoTask = {
      id: `t${Date.now()}`,
      name: form.name,
      taskType: form.taskType,
      frequency: form.frequency,
      time: form.time,
      clients: form.clients,
      enabled: true,
      nextRun: `Próx. execução às ${form.time}`,
      runCount: 0,
    };
    setTasks((prev) => [...prev, newTask]);
    addMessage({
      type: "success",
      text: `📅 Novo agendamento criado: ${form.name}`,
    });
    setOpen(false);
    setForm({
      name: "",
      taskType: TASK_TYPES[0],
      frequency: FREQUENCIES[0],
      time: "08:00",
      clients: "Todos",
    });
  };

  const activeCount = tasks.filter((t) => t.enabled).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Automações Agendadas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure tarefas automáticas que a ARIA executa em datas/horários
            definidos
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-ocid="agendamentos.open_modal_button">
              <Plus size={14} className="mr-1.5" /> Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="agendamentos.dialog">
            <DialogHeader>
              <DialogTitle>Criar Agendamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  data-ocid="agendamentos.input"
                  placeholder="Ex: Relatório Mensal — Empresa Alfa"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipo de Tarefa</Label>
                  <Select
                    value={form.taskType}
                    onValueChange={(v) => setForm({ ...form, taskType: v })}
                  >
                    <SelectTrigger data-ocid="agendamentos.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Frequência</Label>
                  <Select
                    value={form.frequency}
                    onValueChange={(v) => setForm({ ...form, frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Clientes</Label>
                  <Input
                    placeholder="Todos ou nome do cliente"
                    value={form.clients}
                    onChange={(e) =>
                      setForm({ ...form, clients: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                data-ocid="agendamentos.cancel_button"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                data-ocid="agendamentos.confirm_button"
              >
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">
              {tasks.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Total de agendamentos
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">
              {activeCount}
            </div>
            <div className="text-xs text-muted-foreground">Ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">
              {tasks.reduce((s, t) => s + t.runCount, 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              Execuções totais
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {tasks.length === 0 && (
          <Card data-ocid="agendamentos.empty_state">
            <CardContent className="py-12 text-center">
              <CalendarClock
                size={32}
                className="mx-auto text-muted-foreground mb-3"
              />
              <p className="text-sm text-muted-foreground">
                Nenhum agendamento criado ainda.
              </p>
            </CardContent>
          </Card>
        )}
        {tasks.map((task, idx) => (
          <Card key={task.id} data-ocid={`agendamentos.item.${idx + 1}`}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">
                      {task.name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${freqBadgeColor(task.frequency)}`}
                    >
                      {task.frequency}
                    </span>
                    {task.enabled ? (
                      <Badge className="text-[10px] bg-green-500/15 text-green-400 border-0">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Zap size={11} /> {task.taskType}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {task.time}
                    </span>
                    {task.lastRun && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-green-400" />{" "}
                        Últ.: {task.lastRun}
                      </span>
                    )}
                    {task.nextRun && (
                      <span className="flex items-center gap-1">
                        <AlarmClock size={11} className="text-blue-400" />{" "}
                        Próx.: {task.nextRun}
                      </span>
                    )}
                    <span>{task.runCount} execuções</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={task.enabled}
                    onCheckedChange={() => handleToggle(task.id)}
                    data-ocid="agendamentos.switch"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => handleRunNow(task)}
                    title="Executar agora"
                  >
                    <Zap size={13} className="text-yellow-400" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(task.id)}
                    data-ocid={`agendamentos.delete_button.${idx + 1}`}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
