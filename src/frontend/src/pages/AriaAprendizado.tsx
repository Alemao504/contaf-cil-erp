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
import {
  BookOpen,
  Bot,
  Brain,
  Database,
  Download,
  Loader2,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import { useAppContext } from "../context/AppContext";
import { clearStore, getAllRecords, getRecord, putRecord } from "../lib/db";

export interface AriaAprendizadoRecord {
  id: string;
  tipo: string;
  descricao: string;
  confianca: number;
  aplicacoes: number;
  dataAprendizado: string;
  clienteId?: string;
  clienteNome?: string;
}

const SIMULATED_PATTERNS: AriaAprendizadoRecord[] = [
  {
    id: "ap-1",
    tipo: "Folha de Pagamento",
    descricao:
      "Lançamentos de Folha de Pagamento da TechCorp recorrentes no dia 5 de cada mês, valor médio R$ 48.200",
    confianca: 97,
    aplicacoes: 12,
    dataAprendizado: "2026-03-28T10:00:00Z",
    clienteId: "client-2",
    clienteNome: "Tech Solutions SA",
  },
  {
    id: "ap-2",
    tipo: "NF-e Entrada",
    descricao:
      "Padrão de NF-e do fornecedor CNPJ 12.345.678/0001-99 reconhecido — sempre Anexo III Simples Nacional",
    confianca: 94,
    aplicacoes: 8,
    dataAprendizado: "2026-03-27T14:30:00Z",
    clienteId: "client-1",
    clienteNome: "Empresa Alfa Ltda",
  },
  {
    id: "ap-3",
    tipo: "DARF / Guia",
    descricao:
      "DARF IRPJ da Construtora Beta sempre gerado no último dia útil do mês, valor base ~R$ 9.100",
    confianca: 91,
    aplicacoes: 6,
    dataAprendizado: "2026-03-26T09:15:00Z",
    clienteId: "client-3",
    clienteNome: "Construtora Beta Ltda",
  },
  {
    id: "ap-4",
    tipo: "Conciliação Bancária",
    descricao:
      "Extrato Banco do Brasil recebido toda segunda-feira; saldo médio R$ 125.000 para Tech Solutions",
    confianca: 89,
    aplicacoes: 16,
    dataAprendizado: "2026-03-25T11:00:00Z",
    clienteId: "client-2",
    clienteNome: "Tech Solutions SA",
  },
  {
    id: "ap-5",
    tipo: "NF-e Saída",
    descricao:
      "NF-e de serviços da Comercial Gama — ISS 5% retido na fonte; CNPJ tomador recorrente identificado",
    confianca: 86,
    aplicacoes: 5,
    dataAprendizado: "2026-03-24T16:45:00Z",
    clienteId: "client-4",
    clienteNome: "Comercial Gama ME",
  },
  {
    id: "ap-6",
    tipo: "Lançamento Contábil",
    descricao:
      "Depreciação mensal de imobilizado da Construtora Beta: R$ 3.200 / mês; conta 123.01 → 612.01",
    confianca: 98,
    aplicacoes: 14,
    dataAprendizado: "2026-03-23T08:00:00Z",
    clienteId: "client-3",
    clienteNome: "Construtora Beta Ltda",
  },
  {
    id: "ap-7",
    tipo: "XML / SPED",
    descricao:
      "SPED Fiscal da Empresa Alfa sempre contém Registro 0200 com 47 produtos; validação automática habilitada",
    confianca: 83,
    aplicacoes: 4,
    dataAprendizado: "2026-03-22T13:20:00Z",
    clienteId: "client-1",
    clienteNome: "Empresa Alfa Ltda",
  },
  {
    id: "ap-8",
    tipo: "Pró-labore",
    descricao:
      "Pró-labore dos sócios da Serviços Delta sempre no dia 28, valor fixo R$ 8.500 por sócio (2 sócios)",
    confianca: 95,
    aplicacoes: 10,
    dataAprendizado: "2026-03-21T10:30:00Z",
    clienteId: "client-5",
    clienteNome: "Serviços Delta EPP",
  },
  {
    id: "ap-9",
    tipo: "Regime Tributário",
    descricao:
      "Simples Nacional Anexo II mais vantajoso para Empresa Alfa vs Lucro Presumido: economia anual ~R$ 18.400",
    confianca: 92,
    aplicacoes: 3,
    dataAprendizado: "2026-03-20T09:00:00Z",
    clienteId: "client-1",
    clienteNome: "Empresa Alfa Ltda",
  },
  {
    id: "ap-10",
    tipo: "Detecção de Padrão",
    descricao:
      "Lançamentos acima de R$ 50.000 para Construtora Beta sempre acompanham contrato ou medição física",
    confianca: 88,
    aplicacoes: 7,
    dataAprendizado: "2026-03-19T15:10:00Z",
    clienteId: "client-3",
    clienteNome: "Construtora Beta Ltda",
  },
];

const LEARNING_EVENTS = [
  {
    id: "ev-1",
    icon: "📚",
    text: "ARIA aprendeu que lançamentos de Folha de Pagamento da Tech Solutions SA têm valor médio de R$ 48.200",
    time: "há 2 horas",
    tipo: "novo_padrao",
  },
  {
    id: "ev-2",
    icon: "🔁",
    text: "Padrão de NF-e do fornecedor CNPJ 12.345.678/0001-99 reconhecido com 94% de confiança após 8 confirmações",
    time: "há 5 horas",
    tipo: "confirmacao",
  },
  {
    id: "ev-3",
    icon: "✅",
    text: "Lançamento de depreciação aprovado pelo Contador → padrão reforçado (98% → 98.4% confiança)",
    time: "ontem, 14:30",
    tipo: "aprovacao",
  },
  {
    id: "ev-4",
    icon: "❌",
    text: "Lançamento de ICMS rejeitado pelo Sócio → ARIA ajustou alíquota padrão de 12% → 18% para Construtora Beta",
    time: "ontem, 11:15",
    tipo: "rejeicao",
  },
  {
    id: "ev-5",
    icon: "🧠",
    text: "Novo padrão de Pró-labore identificado para Serviços Delta EPP: dia 28, R$ 8.500/sócio",
    time: "2 dias atrás",
    tipo: "novo_padrao",
  },
  {
    id: "ev-6",
    icon: "📊",
    text: "Simulação tributária confirmada 3x: Simples Nacional Anexo II é mais vantajoso para Empresa Alfa",
    time: "3 dias atrás",
    tipo: "confirmacao",
  },
];

function confiancaBadge(confianca: number) {
  if (confianca >= 90)
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
        Alta
      </Badge>
    );
  if (confianca >= 75)
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
        Média
      </Badge>
    );
  return (
    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
      Baixa
    </Badge>
  );
}

function eventColor(tipo: string) {
  if (tipo === "aprovacao") return "border-l-emerald-400";
  if (tipo === "rejeicao") return "border-l-red-400";
  if (tipo === "novo_padrao") return "border-l-blue-400";
  return "border-l-violet-400";
}

export default function AriaAprendizado() {
  const { addMessage, setIsChatOpen, isActive } = useARIA();
  const { setCurrentPage } = useAppContext();
  const [patterns, setPatterns] = useState<AriaAprendizadoRecord[]>([]);
  const [isSimulado, setIsSimulado] = useState(true);
  const [autoAprender, setAutoAprender] = useState(true);
  const [notificarNovo, setNotificarNovo] = useState(true);
  const [training, setTraining] = useState(false);
  const [precision, setPrecision] = useState(93.2);
  const [totalAcoes, setTotalAcoes] = useState(87);
  const [melhoriaVsSemana, setMelhoriaVsSemana] = useState(2.8);

  const loadPatterns = useCallback(async () => {
    try {
      const records =
        await getAllRecords<AriaAprendizadoRecord>("aria_aprendizado");
      if (records.length === 0) {
        // Seed simulated data
        for (const p of SIMULATED_PATTERNS) {
          await putRecord("aria_aprendizado", p);
        }
        setPatterns(SIMULATED_PATTERNS);
      } else {
        setPatterns(records);
      }
    } catch {
      setPatterns(SIMULATED_PATTERNS);
    }
  }, []);

  useEffect(() => {
    loadPatterns();
    // Load settings
    getRecord<{ key: string; value: boolean }>(
      "configuracoes",
      "ariaAprendizadoReal",
    )
      .then((r) => {
        if (r) setIsSimulado(!r.value);
      })
      .catch(() => {});
    getRecord<{ key: string; value: boolean }>(
      "configuracoes",
      "ariaAutoAprender",
    )
      .then((r) => {
        if (r?.value !== undefined) setAutoAprender(r.value);
      })
      .catch(() => {});
    getRecord<{ key: string; value: boolean }>(
      "configuracoes",
      "ariaNotificarNovo",
    )
      .then((r) => {
        if (r?.value !== undefined) setNotificarNovo(r.value);
      })
      .catch(() => {});
  }, [loadPatterns]);

  const saveSetting = async (key: string, value: boolean) => {
    try {
      await putRecord("configuracoes", { key, value });
    } catch {}
  };

  const handleTreinar = async () => {
    setTraining(true);
    await new Promise((r) => setTimeout(r, 2200));

    const novosAprendidos = Math.floor(Math.random() * 3) + 2;
    const novaPrecision = Math.min(99.9, precision + Math.random() * 0.8 + 0.2);
    setPrecision(Math.round(novaPrecision * 10) / 10);
    setTotalAcoes((prev) => prev + novosAprendidos * 3);
    setMelhoriaVsSemana((prev) => Math.round((prev + 0.3) * 10) / 10);

    // Add new learned patterns
    const novosPadroes: AriaAprendizadoRecord[] = [
      {
        id: `ap-new-${Date.now()}-1`,
        tipo: "Aprendizado Automático",
        descricao: `Novo padrão identificado a partir de ${novosAprendidos} aprovações recentes no Workflow`,
        confianca: Math.floor(Math.random() * 10) + 80,
        aplicacoes: 1,
        dataAprendizado: new Date().toISOString(),
      },
    ];

    for (const p of novosPadroes) {
      await putRecord("aria_aprendizado", p);
    }
    await loadPatterns();

    toast.success(
      `Treinamento concluído! ${novosAprendidos} novos padrões aprendidos.`,
    );
    setTraining(false);

    if (isActive) {
      addMessage({
        type: "success",
        text: `📚 Aprendi ${novosAprendidos} novos padrões hoje! Minha precisão subiu para ${novaPrecision.toFixed(1)}%. Padrão mais relevante: lançamentos de Folha de Pagamento da TechCorp recorrentes no dia 5 de cada mês.`,
      });
      if (notificarNovo) setIsChatOpen(true);
    }
  };

  const handleLimpar = async () => {
    if (
      !window.confirm(
        "Limpar todos os dados de aprendizado da ARIA? Isso não pode ser desfeito.",
      )
    )
      return;
    try {
      await clearStore("aria_aprendizado");
      setPatterns([]);
      setPrecision(70.0);
      setTotalAcoes(0);
      setMelhoriaVsSemana(0);
      toast.success("Dados de aprendizado limpos.");
    } catch {
      toast.error("Erro ao limpar dados.");
    }
  };

  const handleExportar = () => {
    const csv = [
      "Tipo,Descrição,Confiança (%),Aplicações,Data Aprendizado,Cliente",
      ...patterns.map(
        (p) =>
          `"${p.tipo}","${p.descricao}",${p.confianca},${p.aplicacoes},"${new Date(p.dataAprendizado).toLocaleDateString("pt-BR")}","${p.clienteNome ?? ""}"`,
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aria_padroes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  const avgConfianca =
    patterns.length > 0
      ? Math.round(
          patterns.reduce((s, p) => s + p.confianca, 0) / patterns.length,
        )
      : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Brain className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Aprendizado Contínuo — ARIA
            </h1>
            <p className="text-sm text-muted-foreground">
              Padrões aprendidos e evolução da inteligência contábil
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage("aria-memoria")}
            className="gap-2"
            data-ocid="aria_aprendizado.link"
          >
            <Database className="w-4 h-4" />
            Ver Memória da ARIA →
          </Button>
          <Button variant="outline" onClick={handleExportar} className="gap-2">
            <Download className="w-4 h-4" />
            Exportar Relatório
          </Button>
          <Button
            onClick={handleTreinar}
            disabled={training}
            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            data-ocid="aria.treinar.primary_button"
          >
            {training ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {training ? "Treinando..." : "Treinar Agora"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Padrões Aprendidos
                </p>
                <p className="text-2xl font-bold">{patterns.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-violet-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-violet-600">Precisão Atual</p>
                <p className="text-2xl font-bold text-violet-600">
                  {precision}%
                </p>
              </div>
              <Brain className="w-8 h-8 text-violet-200" />
            </div>
            <Progress value={precision} className="h-1 mt-2" />
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600">Ações Registradas</p>
                <p className="text-2xl font-bold text-blue-600">{totalAcoes}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600">Melhoria (7 dias)</p>
                <p className="text-2xl font-bold text-emerald-600">
                  +{melhoriaVsSemana}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ARIA Panel */}
      <Card className="border-violet-200 bg-violet-50/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-violet-600 mb-1">
                ARIA — Status de Aprendizado
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {patterns.length === 0
                  ? 'Nenhum padrão aprendido ainda. Clique em "Treinar Agora" para inicializar.'
                  : `Tenho ${patterns.length} padrões ativos com confiança média de ${avgConfianca}%. Precisão geral: ${precision}% (+${melhoriaVsSemana}% vs semana anterior). Padrão mais confiável: "${patterns.sort((a, b) => b.confianca - a.confianca)[0]?.tipo ?? ""}". Recomendo aprovar lançamentos recorrentes automaticamente para acelerar meu aprendizado.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-500" />
              Feed de Aprendizado Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {LEARNING_EVENTS.map((ev) => (
              <div
                key={ev.id}
                className={`border-l-4 ${eventColor(ev.tipo)} pl-3 py-1.5 bg-muted/30 rounded-r-lg`}
              >
                <p className="text-sm text-foreground leading-relaxed">
                  {ev.icon} {ev.text}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ev.time}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Config Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-500" />
              Configurações de Aprendizado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Modo</p>
                <p className="text-xs text-muted-foreground">
                  Simulado usa dados de demonstração
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!isSimulado}
                  onCheckedChange={(v) => {
                    setIsSimulado(!v);
                    saveSetting("ariaAprendizadoReal", v);
                  }}
                  data-ocid="aria.modo.switch"
                />
                <span
                  className={`text-xs font-medium ${!isSimulado ? "text-green-600" : "text-muted-foreground"}`}
                >
                  {isSimulado ? "Simulado" : "Real"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Aprender de aprovações</p>
                <p className="text-xs text-muted-foreground">
                  ARIA aprende automaticamente ao aprovar lançamentos
                </p>
              </div>
              <Switch
                checked={autoAprender}
                onCheckedChange={(v) => {
                  setAutoAprender(v);
                  saveSetting("ariaAutoAprender", v);
                }}
                data-ocid="aria.auto_aprender.switch"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Notificar novo padrão</p>
                <p className="text-xs text-muted-foreground">
                  ARIA avisa no chat quando aprende algo novo
                </p>
              </div>
              <Switch
                checked={notificarNovo}
                onCheckedChange={(v) => {
                  setNotificarNovo(v);
                  saveSetting("ariaNotificarNovo", v);
                }}
                data-ocid="aria.notificar.switch"
              />
            </div>

            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLimpar}
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
                data-ocid="aria.limpar.delete_button"
              >
                Limpar dados de aprendizado
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Esta ação não pode ser desfeita
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pattern Library */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-500" />
            Biblioteca de Padrões ({patterns.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {patterns.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum padrão aprendido ainda.</p>
              <p className="text-sm mt-1">
                Clique em "Treinar Agora" para iniciar.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Confiança</TableHead>
                  <TableHead className="text-center">Aplicações</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Atualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patterns
                  .sort((a, b) => b.confianca - a.confianca)
                  .map((p, idx) => (
                    <TableRow
                      key={p.id}
                      data-ocid={`aria.pattern.item.${idx + 1}`}
                    >
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs font-medium"
                        >
                          {p.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm leading-relaxed line-clamp-2">
                          {p.descricao}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          {confiancaBadge(p.confianca)}
                          <span className="text-xs text-muted-foreground">
                            {p.confianca}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{p.aplicacoes}x</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {p.clienteNome ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.dataAprendizado).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
