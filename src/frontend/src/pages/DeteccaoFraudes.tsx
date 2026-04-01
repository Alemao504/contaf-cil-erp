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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import { getRecord } from "../lib/db";
import {
  type FraudeAlerta,
  type NivelRisco,
  type StatusAlerta,
  type TipoAnomalia,
  atualizarStatusAlerta,
  encaminharParaWorkflow,
  executarAnalise,
  getAllAlertas,
} from "../lib/fraudeService";

const NIVEL_CONFIG: Record<
  NivelRisco,
  { label: string; color: string; icon: typeof ShieldAlert }
> = {
  alto: {
    label: "Alto Risco",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: ShieldX,
  },
  medio: {
    label: "Médio Risco",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: ShieldAlert,
  },
  baixo: {
    label: "Baixo Risco",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: Shield,
  },
};

const STATUS_CONFIG: Record<StatusAlerta, { label: string; color: string }> = {
  aberto: { label: "Aberto", color: "bg-red-50 text-red-600" },
  em_analise: { label: "Em Análise", color: "bg-blue-50 text-blue-600" },
  resolvido: { label: "Resolvido", color: "bg-green-50 text-green-700" },
  falso_positivo: {
    label: "Falso Positivo",
    color: "bg-gray-100 text-gray-500",
  },
};

const TIPO_LABEL: Record<TipoAnomalia, string> = {
  valor_duplicado: "Valor Duplicado",
  data_inconsistente: "Data Inconsistente",
  cnpj_invalido: "CNPJ Inválido",
  variacao_brusca: "Variação Brusca",
  horario_suspeito: "Horário Suspeito",
  sem_documento: "Sem Documento",
};

function nivelBgClass(nivel: NivelRisco) {
  if (nivel === "alto") return "border-l-4 border-l-red-500";
  if (nivel === "medio") return "border-l-4 border-l-amber-400";
  return "border-l-4 border-l-emerald-400";
}

export default function DeteccaoFraudes() {
  const { addMessage, setIsChatOpen, isActive } = useARIA();
  const [alertas, setAlertas] = useState<FraudeAlerta[]>([]);
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<"simulado" | "real">("simulado");
  const [filtroNivel, setFiltroNivel] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("aberto");
  const [filtroCliente, setFiltroCliente] = useState("todos");
  const [busca, setBusca] = useState("");
  const [selectedAlerta, setSelectedAlerta] = useState<FraudeAlerta | null>(
    null,
  );
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [showResolverDialog, setShowResolverDialog] = useState(false);
  const [resolverStatus, setResolverStatus] =
    useState<StatusAlerta>("resolvido");
  const [justificativa, setJustificativa] = useState("");
  const [savingAction, setSavingAction] = useState(false);

  const carregarAlertas = useCallback(async () => {
    try {
      const all = await getAllAlertas();
      setAlertas(all);
    } catch {}
  }, []);

  useEffect(() => {
    carregarAlertas();
  }, [carregarAlertas]);

  // Load fraudeReal setting from IndexedDB to initialize modo
  useEffect(() => {
    getRecord<{ key: string; value: boolean }>("configuracoes", "fraudeReal")
      .then((r) => {
        if (r?.value !== undefined) setModo(r.value ? "real" : "simulado");
      })
      .catch(() => {});
  }, []);

  const executar = async () => {
    setLoading(true);
    try {
      const novos = await executarAnalise(modo);
      await carregarAlertas();
      const altos = novos.filter((a) => a.nivel === "alto").length;
      const medios = novos.filter((a) => a.nivel === "medio").length;
      toast.success(
        `Análise concluída: ${novos.length} alertas (${altos} alto, ${medios} médio risco)`,
      );
      if (isActive && novos.length > 0) {
        // Send one message per high-risk alert (max 3)
        const altosAlertas = novos
          .filter((a) => a.nivel === "alto")
          .slice(0, 3);
        for (const a of altosAlertas) {
          addMessage({
            type: "warning",
            text: `🚨 Alerta Crítico detectado — ${a.descricao}. Cliente: ${
              a.clientNome ?? "N/D"
            }. Valor: ${
              a.entidadeValor !== undefined
                ? `R$ ${a.entidadeValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                : "N/D"
            }. Acesse Detecção de Fraudes para revisar e encaminhar ao workflow.`,
          });
        }
        // Summary message
        const baixos = novos.filter((a) => a.nivel === "baixo").length;
        addMessage({
          type: altos > 0 ? "warning" : "info",
          text: `🛡️ ARIA — Análise de fraudes concluída. ${novos.length} alertas gerados: ${
            altos > 0 ? `${altos} críticos, ` : ""
          }${medios > 0 ? `${medios} médios, ` : ""}${
            baixos > 0 ? `${baixos} baixos` : ""
          }. ${altos > 0 ? "Requer atenção imediata." : "Nenhum alerta crítico."}`,
        });
        setIsChatOpen(true);
      }
    } catch {
      toast.error("Erro ao executar análise de fraudes.");
    } finally {
      setLoading(false);
    }
  };

  const alertasFiltrados = alertas.filter((a) => {
    if (filtroNivel !== "todos" && a.nivel !== filtroNivel) return false;
    if (filtroStatus !== "todos" && a.status !== filtroStatus) return false;
    if (filtroCliente !== "todos" && a.clientId !== filtroCliente) return false;
    if (
      busca &&
      !a.descricao.toLowerCase().includes(busca.toLowerCase()) &&
      !(a.clientNome ?? "").toLowerCase().includes(busca.toLowerCase())
    )
      return false;
    return true;
  });

  const clientes = Array.from(
    new Map(alertas.map((a) => [a.clientId, a.clientNome ?? a.clientId])),
  );

  const countNivel = (n: NivelRisco) =>
    alertas.filter((a) => a.nivel === n && a.status === "aberto").length;
  const countAbertos = alertas.filter((a) => a.status === "aberto").length;

  const ariaAnalise = () => {
    const criticos = alertas.filter(
      (a) => a.nivel === "alto" && a.status === "aberto",
    );
    if (criticos.length === 0) {
      const total = alertas.length;
      if (total === 0)
        return 'Nenhuma análise executada ainda. Clique em "Executar Análise" para iniciar a detecção.';
      return `Análise concluída. Não há alertas de alto risco abertos no momento. ${alertas.filter((a) => a.nivel === "medio" && a.status === "aberto").length} alertas de médio risco aguardam revisão.`;
    }
    const primeiro = criticos[0];
    const economia = primeiro.entidadeValor
      ? ` Valor em risco: R$ ${primeiro.entidadeValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
      : "";
    return `Identifiquei ${criticos.length} alerta${criticos.length > 1 ? "s" : ""} de alto risco. O mais crítico: ${primeiro.descricao}.${economia} Recomendo revisão imediata e encaminhamento ao Workflow de Aprovação.`;
  };

  const handleResolver = async () => {
    if (!selectedAlerta) return;
    if (!justificativa.trim()) {
      toast.error("Justificativa é obrigatória.");
      return;
    }
    setSavingAction(true);
    try {
      await atualizarStatusAlerta(
        selectedAlerta.id,
        resolverStatus,
        justificativa,
        "Contador",
      );
      await carregarAlertas();
      toast.success(
        resolverStatus === "resolvido"
          ? "Alerta resolvido com sucesso!"
          : "Marcado como falso positivo.",
      );
      setShowResolverDialog(false);
      setShowDetalhes(false);
      setJustificativa("");
      setSelectedAlerta(null);
    } catch {
      toast.error("Erro ao atualizar alerta.");
    } finally {
      setSavingAction(false);
    }
  };

  const handleEncaminhar = async (alerta: FraudeAlerta) => {
    try {
      await encaminharParaWorkflow(alerta);
      await carregarAlertas();
      toast.success("Alerta encaminhado para o Workflow de Aprovação!");
    } catch {
      toast.error("Erro ao encaminhar alerta.");
    }
  };

  const openResolver = (alerta: FraudeAlerta, status: StatusAlerta) => {
    setSelectedAlerta(alerta);
    setResolverStatus(status);
    setJustificativa("");
    setShowResolverDialog(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Detecção de Fraudes
            </h1>
            <p className="text-sm text-muted-foreground">
              Análise automática de anomalias contábeis
            </p>
          </div>
          {countAbertos > 0 && (
            <Badge className="bg-red-500 text-white">
              {countAbertos} abertos
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Modo:</span>
            <Switch
              checked={modo === "real"}
              onCheckedChange={(v) => setModo(v ? "real" : "simulado")}
            />
            <span
              className={
                modo === "real"
                  ? "text-green-600 font-medium"
                  : "text-muted-foreground"
              }
            >
              {modo === "real" ? "Real" : "Simulado"}
            </span>
          </div>
          <Button onClick={executar} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {loading ? "Analisando..." : "Executar Análise"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Total de Alertas
                </p>
                <p className="text-2xl font-bold">{alertas.length}</p>
              </div>
              <ShieldAlert className="w-8 h-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600">Alto Risco</p>
                <p className="text-2xl font-bold text-red-600">
                  {countNivel("alto")}
                </p>
              </div>
              <ShieldX className="w-8 h-8 text-red-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600">Médio Risco</p>
                <p className="text-2xl font-bold text-amber-600">
                  {countNivel("medio")}
                </p>
              </div>
              <ShieldAlert className="w-8 h-8 text-amber-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600">Baixo Risco</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {countNivel("baixo")}
                </p>
              </div>
              <Shield className="w-8 h-8 text-emerald-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ARIA Analysis Panel */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-1">
                Análise da ARIA
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {ariaAnalise()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por descrição ou cliente..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filtroNivel} onValueChange={setFiltroNivel}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os níveis</SelectItem>
            <SelectItem value="alto">Alto Risco</SelectItem>
            <SelectItem value="medio">Médio Risco</SelectItem>
            <SelectItem value="baixo">Baixo Risco</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="em_analise">Em Análise</SelectItem>
            <SelectItem value="resolvido">Resolvido</SelectItem>
            <SelectItem value="falso_positivo">Falso Positivo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroCliente} onValueChange={setFiltroCliente}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os clientes</SelectItem>
            {clientes.map(([id, nome]) => (
              <SelectItem key={id} value={id}>
                {nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Alerts List */}
      {alertasFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {alertas.length === 0
                ? 'Nenhuma análise executada. Clique em "Executar Análise" para iniciar.'
                : "Nenhum alerta encontrado com os filtros selecionados."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alertasFiltrados.map((alerta) => {
            const nivelConf = NIVEL_CONFIG[alerta.nivel];
            const NivelIcon = nivelConf.icon;
            const statusConf = STATUS_CONFIG[alerta.status];
            const isResolved =
              alerta.status === "resolvido" ||
              alerta.status === "falso_positivo";

            return (
              <Card
                key={alerta.id}
                className={`${nivelBgClass(alerta.nivel)} ${
                  isResolved ? "opacity-60" : ""
                }`}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <NivelIcon
                        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          alerta.nivel === "alto"
                            ? "text-red-500"
                            : alerta.nivel === "medio"
                              ? "text-amber-500"
                              : "text-emerald-500"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                              nivelConf.color
                            }`}
                          >
                            {nivelConf.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {TIPO_LABEL[alerta.tipo]}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              statusConf.color
                            }`}
                          >
                            {statusConf.label}
                          </span>
                        </div>
                        <p className="font-medium text-sm text-foreground">
                          {alerta.descricao}
                        </p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {alerta.clientNome && (
                            <span className="text-xs text-muted-foreground">
                              🏢 {alerta.clientNome}
                            </span>
                          )}
                          {alerta.entidadeValor !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              R$
                              {alerta.entidadeValor.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          )}
                          {alerta.entidadeData && (
                            <span className="text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(alerta.entidadeData).toLocaleDateString(
                                "pt-BR",
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAlerta(alerta);
                          setShowDetalhes(true);
                        }}
                        className="gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Detalhes
                      </Button>
                      {!isResolved && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResolver(alerta, "resolvido")}
                            className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openResolver(alerta, "falso_positivo")
                            }
                            className="gap-1 text-gray-500 border-gray-200 hover:bg-gray-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Falso +
                          </Button>
                          {alerta.status !== "em_analise" && (
                            <Button
                              size="sm"
                              onClick={() => handleEncaminhar(alerta)}
                              className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Workflow
                            </Button>
                          )}
                        </>
                      )}
                      {alerta.status === "em_analise" && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          No Workflow
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detalhes Modal */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="max-w-lg">
          {selectedAlerta && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const conf = NIVEL_CONFIG[selectedAlerta.nivel];
                    const Icon = conf.icon;
                    return (
                      <Icon
                        className={`w-5 h-5 ${
                          selectedAlerta.nivel === "alto"
                            ? "text-red-500"
                            : selectedAlerta.nivel === "medio"
                              ? "text-amber-500"
                              : "text-emerald-500"
                        }`}
                      />
                    );
                  })()}
                  Detalhes do Alerta
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                      NIVEL_CONFIG[selectedAlerta.nivel].color
                    }`}
                  >
                    {NIVEL_CONFIG[selectedAlerta.nivel].label}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      STATUS_CONFIG[selectedAlerta.status].color
                    }`}
                  >
                    {STATUS_CONFIG[selectedAlerta.status].label}
                  </span>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                    {TIPO_LABEL[selectedAlerta.tipo]}
                  </span>
                </div>

                <div>
                  <p className="font-semibold text-foreground mb-1">
                    Descrição
                  </p>
                  <p className="text-muted-foreground">
                    {selectedAlerta.descricao}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-semibold text-foreground mb-1">
                    Detalhe da Anomalia
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedAlerta.detalhe}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="font-medium">
                      {selectedAlerta.clientNome ?? selectedAlerta.clientId}
                    </p>
                  </div>
                  {selectedAlerta.entidadeValor !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground">Valor</p>
                      <p className="font-medium">
                        R${" "}
                        {selectedAlerta.entidadeValor.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  )}
                  {selectedAlerta.entidadeData && (
                    <div>
                      <p className="text-xs text-muted-foreground">Data</p>
                      <p className="font-medium">
                        {new Date(
                          selectedAlerta.entidadeData,
                        ).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Detectado em
                    </p>
                    <p className="font-medium">
                      {new Date(selectedAlerta.criadoEm).toLocaleString(
                        "pt-BR",
                      )}
                    </p>
                  </div>
                </div>

                {selectedAlerta.justificativa && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-700 mb-1">
                      Resolução
                    </p>
                    <p className="text-green-800">
                      {selectedAlerta.justificativa}
                    </p>
                    {selectedAlerta.resolvidoPor && (
                      <p className="text-xs text-green-600 mt-1">
                        Por: {selectedAlerta.resolvidoPor}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDetalhes(false)}
                >
                  Fechar
                </Button>
                {selectedAlerta.status === "aberto" ||
                selectedAlerta.status === "em_analise" ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDetalhes(false);
                        openResolver(selectedAlerta, "resolvido");
                      }}
                      className="text-green-600 border-green-200"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Resolver
                    </Button>
                    {selectedAlerta.status !== "em_analise" && (
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          handleEncaminhar(selectedAlerta);
                          setShowDetalhes(false);
                        }}
                      >
                        <Send className="w-4 h-4 mr-1" /> Workflow
                      </Button>
                    )}
                  </>
                ) : null}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolver Dialog */}
      <Dialog open={showResolverDialog} onOpenChange={setShowResolverDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {resolverStatus === "resolvido"
                ? "Resolver Alerta"
                : "Marcar como Falso Positivo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedAlerta?.descricao}
            </p>
            <div className="space-y-2">
              <Label htmlFor="justificativa">
                Justificativa <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="justificativa"
                placeholder={
                  resolverStatus === "resolvido"
                    ? "Descreva como foi resolvido..."
                    : "Explique por que é falso positivo..."
                }
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResolverDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResolver}
              disabled={savingAction || !justificativa.trim()}
              className={
                resolverStatus === "resolvido"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : ""
              }
            >
              {savingAction ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {resolverStatus === "resolvido"
                ? "Confirmar Resolução"
                : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
