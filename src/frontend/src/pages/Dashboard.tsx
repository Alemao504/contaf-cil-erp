import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  CloudUpload,
  Plus,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import ClientSelector from "../components/ClientSelector";
import LancamentoModal from "../components/LancamentoModal";
import { useAppContext } from "../context/AppContext";
import {
  useAddDocument,
  useBalanco,
  useDRE,
  useLivroDiario,
} from "../hooks/useQueries";
import { formatBRL, formatDate } from "../lib/formatters";

type AriaTarefaStatus = "pendente" | "concluido" | "erro" | "processando";
type AriaTarefa = {
  id: string;
  cliente: string;
  tipo: string;
  status: AriaTarefaStatus;
  dataHora?: string;
  erroDetalhe?: string;
  selecionado: boolean;
};

function gerarTarefasDemo(): AriaTarefa[] {
  return [
    {
      id: "1",
      cliente: "Empresa Alfa Ltda",
      tipo: "Imposto de Renda PF",
      status: "concluido",
      dataHora: "01/04/2026 09:12",
      selecionado: true,
    },
    {
      id: "2",
      cliente: "Comércio Beta ME",
      tipo: "Simples Nacional",
      status: "concluido",
      dataHora: "01/04/2026 09:45",
      selecionado: true,
    },
    {
      id: "3",
      cliente: "Construtora Horizonte",
      tipo: "Notas Fiscais NF-e",
      status: "erro",
      dataHora: "01/04/2026 10:03",
      erroDetalhe:
        "CNPJ inválido no arquivo NF_0034.xml. Verifique o campo emitente.",
      selecionado: true,
    },
    {
      id: "4",
      cliente: "Panificadora Pão Quente",
      tipo: "Folha de Pagamento",
      status: "pendente",
      selecionado: true,
    },
    {
      id: "5",
      cliente: "Clínica Saúde & Vida",
      tipo: "Declaração DCTF",
      status: "pendente",
      selecionado: true,
    },
    {
      id: "6",
      cliente: "Tech Inovação Sistemas",
      tipo: "Imposto de Renda PJ",
      status: "processando",
      dataHora: "01/04/2026 10:15",
      selecionado: true,
    },
    {
      id: "7",
      cliente: "Advocacia Martins",
      tipo: "Balancete Mensal",
      status: "pendente",
      selecionado: false,
    },
    {
      id: "8",
      cliente: "Metalúrgica Peças & Cia",
      tipo: "ECF / ECD",
      status: "pendente",
      selecionado: false,
    },
  ];
}

export default function Dashboard() {
  const { selectedClientId, userProfile, setCurrentPage } = useAppContext();
  const { data: entries = [], isLoading: loadingDiario } =
    useLivroDiario(selectedClientId);
  const { data: balanco, isLoading: loadingBalanco } =
    useBalanco(selectedClientId);
  const { data: dre, isLoading: loadingDRE } = useDRE(selectedClientId);
  const addDocument = useAddDocument();
  const [dragging, setDragging] = useState(false);
  const [showLancamento, setShowLancamento] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ariaTarefas, setAriaTarefas] = useState<AriaTarefa[]>(
    gerarTarefasDemo(),
  );
  const [errorDetail, setErrorDetail] = useState<AriaTarefa | null>(null);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthEntries = useMemo(() => {
    return entries.filter((e) => {
      const d = new Date(e.entryDate);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
  }, [entries, thisMonth, thisYear]);

  const totalIn = useMemo(
    () =>
      monthEntries
        .filter((e) => e.creditCode.startsWith("4"))
        .reduce((s, e) => s + Number(e.valueInCents), 0),
    [monthEntries],
  );
  const totalOut = useMemo(
    () =>
      monthEntries
        .filter((e) => e.debitCode.startsWith("5"))
        .reduce((s, e) => s + Number(e.valueInCents), 0),
    [monthEntries],
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files || !selectedClientId) return;
    for (const file of Array.from(files)) {
      try {
        const buffer = await file.arrayBuffer();
        const blob = ExternalBlob.fromBytes(new Uint8Array(buffer));
        const doc = {
          id: crypto.randomUUID(),
          clientId: selectedClientId,
          year: BigInt(new Date().getFullYear()),
          filename: file.name,
          blob,
          status: "Processado",
          extractedText: "",
          docType: "",
        };
        await addDocument.mutateAsync(doc);
        toast.success(`Documento "${file.name}" enviado com sucesso!`);
      } catch {
        toast.error(`Erro ao enviar "${file.name}"`);
      }
    }
  };

  const last10 = entries.slice(-10).reverse();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="no-print flex items-center justify-between px-6 py-4 bg-white border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Olá, {userProfile?.name ?? "Contador"} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {now.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ClientSelector />
          <Button
            type="button"
            data-ocid="dashboard.lancamento.primary_button"
            size="sm"
            className="bg-primary text-white hover:bg-primary/90 text-xs gap-1.5"
            onClick={() => setShowLancamento(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Novo Lançamento
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card
            data-ocid="dashboard.balanco.card"
            className="rounded-xl border-border shadow-sm"
          >
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Balanço Patrimonial
                </CardTitle>
                <Building2 className="w-4 h-4 text-primary/50" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {loadingBalanco ? (
                <div className="space-y-1.5">
                  {["a", "b", "c"].map((k) => (
                    <Skeleton key={k} className="h-4 w-24" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Ativo</span>
                    <span className="font-semibold">
                      {(balanco?.assets ?? []).length} contas
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Passivo</span>
                    <span className="font-semibold">
                      {(balanco?.liabilities ?? []).length} contas
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">PL</span>
                    <span className="font-semibold">
                      {(balanco?.patrimonio ?? []).length} contas
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            data-ocid="dashboard.dre.card"
            className="rounded-xl border-border shadow-sm"
          >
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  DRE
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-primary/50" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {loadingDRE ? (
                <div className="space-y-1.5">
                  {["a", "b", "c"].map((k) => (
                    <Skeleton key={k} className="h-4 w-24" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Receitas</span>
                    <span
                      className="font-semibold"
                      style={{ color: "oklch(var(--success))" }}
                    >
                      {(dre?.receitas ?? []).length} contas
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Despesas</span>
                    <span className="font-semibold text-destructive">
                      {(dre?.despesas ?? []).length} contas
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Resultado</span>
                    <span
                      className={`font-semibold ${
                        (dre?.receitas ?? []).length >=
                        (dre?.despesas ?? []).length
                          ? "text-green-600"
                          : "text-destructive"
                      }`}
                    >
                      {(dre?.receitas ?? []).length >=
                      (dre?.despesas ?? []).length
                        ? "Lucro"
                        : "Prejuízo"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            data-ocid="dashboard.resumo.card"
            className="rounded-xl border-border shadow-sm"
          >
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Resumo do Mês
                </CardTitle>
                <TrendingDown className="w-4 h-4 text-primary/50" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Entradas</span>
                  <span
                    className="font-semibold"
                    style={{ color: "oklch(var(--success))" }}
                  >
                    {formatBRL(totalIn)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Saídas</span>
                  <span className="font-semibold text-destructive">
                    {formatBRL(totalOut)}
                  </span>
                </div>
                <div className="flex justify-between text-xs border-t border-border pt-1.5">
                  <span className="text-muted-foreground font-semibold">
                    Saldo
                  </span>
                  <span
                    className={`font-bold text-sm ${
                      totalIn - totalOut >= 0
                        ? "text-green-600"
                        : "text-destructive"
                    }`}
                  >
                    {formatBRL(totalIn - totalOut)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <Card
            data-ocid="dashboard.lancamentos.card"
            className="col-span-3 rounded-xl border-border shadow-sm"
          >
            <CardHeader className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Últimos Lançamentos Contábeis
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary"
                  onClick={() => setCurrentPage("lancamentos")}
                  data-ocid="dashboard.ver_mais.link"
                >
                  Ver todos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingDiario ? (
                <div className="p-4 space-y-2">
                  {["a", "b", "c", "d", "e"].map((k) => (
                    <Skeleton key={k} className="h-8 w-full" />
                  ))}
                </div>
              ) : last10.length === 0 ? (
                <div
                  data-ocid="dashboard.lancamentos.empty_state"
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum lançamento encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-semibold px-4">
                          Data
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Descrição
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Débito
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Crédito
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right pr-4">
                          Valor
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {last10.map((e, i) => (
                        <TableRow
                          key={e.id}
                          data-ocid={`dashboard.lancamentos.item.${i + 1}`}
                        >
                          <TableCell className="text-xs px-4 py-2">
                            {formatDate(e.entryDate)}
                          </TableCell>
                          <TableCell className="text-xs py-2 max-w-[140px] truncate">
                            {e.description}
                          </TableCell>
                          <TableCell className="text-xs py-2 font-mono">
                            {e.debitCode}
                          </TableCell>
                          <TableCell className="text-xs py-2 font-mono">
                            {e.creditCode}
                          </TableCell>
                          <TableCell className="text-xs py-2 text-right pr-4 font-semibold">
                            {formatBRL(e.valueInCents)}
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge
                              className="text-[10px] px-1.5 py-0.5"
                              style={{
                                background: "oklch(0.95 0.05 150)",
                                color: "oklch(0.4 0.12 150)",
                              }}
                            >
                              Conciliado
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            data-ocid="dashboard.upload.card"
            className="col-span-2 rounded-xl border-border shadow-sm"
          >
            <CardHeader className="px-5 py-4 border-b border-border">
              <CardTitle className="text-sm font-semibold">
                Enviar Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <label
                htmlFor="dashboard-file-input"
                data-ocid="dashboard.upload.dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                className={`flex flex-col items-center justify-center gap-3 py-10 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <CloudUpload className="w-10 h-10 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">
                    Arraste arquivos aqui
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    PDF, DOC, DOCX, JPG, PNG
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md bg-white hover:bg-muted/30 transition-colors mt-1">
                  <Upload className="w-3 h-3" /> Selecionar Arquivo
                </span>
              </label>
              <input
                id="dashboard-file-input"
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <p className="text-[11px] text-muted-foreground mt-3 text-center">
                O sistema identifica automaticamente o tipo e classifica o
                documento
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ARIA Tasks Table */}
        <Card
          data-ocid="dashboard.aria_tarefas.card"
          className="rounded-xl border-border shadow-sm"
        >
          <CardHeader className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-sm font-semibold">
                  Tarefas da ARIA — Processamento por Cliente
                </CardTitle>
                <div className="flex items-center gap-3 ml-3">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />{" "}
                    Pendente
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />{" "}
                    Concluído
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />{" "}
                    Erro
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />{" "}
                    Processando
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2"
                  data-ocid="dashboard.aria_tarefas.secondary_button"
                  onClick={() =>
                    setAriaTarefas((t) =>
                      t.map((x) => ({ ...x, selecionado: true })),
                    )
                  }
                >
                  Sel. Todos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2"
                  data-ocid="dashboard.aria_tarefas.toggle"
                  onClick={() =>
                    setAriaTarefas((t) =>
                      t.map((x) => ({ ...x, selecionado: false })),
                    )
                  }
                >
                  Desmarcar
                </Button>
                <Button
                  size="sm"
                  className="text-xs h-7 px-3 bg-primary text-white"
                  data-ocid="dashboard.aria_tarefas.primary_button"
                  onClick={() => {
                    setAriaTarefas((t) =>
                      t.map((x) =>
                        x.selecionado && x.status === "pendente"
                          ? { ...x, status: "processando" as AriaTarefaStatus }
                          : x,
                      ),
                    );
                    toast.success("ARIA ativada para tarefas selecionadas!");
                  }}
                >
                  ▶ Ativar ARIA
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-semibold w-10 px-4">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 cursor-pointer"
                      onChange={(e) =>
                        setAriaTarefas((t) =>
                          t.map((x) => ({
                            ...x,
                            selecionado: e.target.checked,
                          })),
                        )
                      }
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Cliente
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Tipo de Tarefa
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Data/Hora
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-4">
                    Ação
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ariaTarefas.map((tarefa, i) => (
                  <TableRow
                    key={tarefa.id}
                    data-ocid={`dashboard.aria_tarefas.item.${i + 1}`}
                    className={tarefa.selecionado ? "" : "opacity-50"}
                  >
                    <TableCell className="px-4 py-2">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 cursor-pointer"
                        checked={tarefa.selecionado}
                        onChange={(e) =>
                          setAriaTarefas((t) =>
                            t.map((x) =>
                              x.id === tarefa.id
                                ? { ...x, selecionado: e.target.checked }
                                : x,
                            ),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-xs py-2 font-medium">
                      {tarefa.cliente}
                    </TableCell>
                    <TableCell className="text-xs py-2 text-muted-foreground">
                      {tarefa.tipo}
                    </TableCell>
                    <TableCell className="py-2">
                      {tarefa.status === "concluido" && (
                        <Badge className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 border-green-200 border">
                          ✓ Concluído
                        </Badge>
                      )}
                      {tarefa.status === "pendente" && (
                        <Badge className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 border-blue-200 border">
                          ● Pendente
                        </Badge>
                      )}
                      {tarefa.status === "erro" && (
                        <button
                          type="button"
                          onClick={() => setErrorDetail(tarefa)}
                          className="inline-flex items-center gap-1"
                        >
                          <Badge className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 border-red-200 border cursor-pointer hover:bg-red-200 transition-colors">
                            ✕ Erro — clique
                          </Badge>
                        </button>
                      )}
                      {tarefa.status === "processando" && (
                        <Badge className="text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-700 border-yellow-200 border animate-pulse">
                          ⟳ Processando...
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs py-2 text-muted-foreground">
                      {tarefa.dataHora ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs py-2 text-right pr-4">
                      {(tarefa.status === "pendente" ||
                        tarefa.status === "erro") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          data-ocid={`dashboard.aria_tarefas.edit_button.${i + 1}`}
                          onClick={() => {
                            const tarefaId = tarefa.id;
                            setAriaTarefas((t) =>
                              t.map((x) =>
                                x.id === tarefaId
                                  ? {
                                      ...x,
                                      status: "processando" as AriaTarefaStatus,
                                      dataHora: new Date().toLocaleString(
                                        "pt-BR",
                                      ),
                                    }
                                  : x,
                              ),
                            );
                            setTimeout(
                              () =>
                                setAriaTarefas((t) =>
                                  t.map((x) =>
                                    x.id === tarefaId
                                      ? {
                                          ...x,
                                          status:
                                            "concluido" as AriaTarefaStatus,
                                        }
                                      : x,
                                  ),
                                ),
                              3000,
                            );
                          }}
                        >
                          Ativar IA
                        </Button>
                      )}
                      {tarefa.status === "processando" && (
                        <span className="text-[10px] text-yellow-600 font-medium">
                          Em andamento...
                        </span>
                      )}
                      {tarefa.status === "concluido" && (
                        <span className="text-[10px] text-green-600 font-medium">
                          Feito
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {showLancamento && (
        <LancamentoModal
          open={showLancamento}
          onClose={() => setShowLancamento(false)}
        />
      )}

      {/* Error detail modal */}
      {errorDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="Fechar modal"
            className="absolute inset-0 bg-black/40 cursor-default"
            onClick={() => setErrorDetail(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-red-700">
                Detalhes do Erro
              </h3>
              <button
                type="button"
                onClick={() => setErrorDetail(null)}
                className="text-muted-foreground hover:text-foreground text-lg leading-none"
                data-ocid="dashboard.aria_error.close_button"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">Cliente:</span>{" "}
                <span className="font-medium">{errorDetail.cliente}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tarefa:</span>{" "}
                <span className="font-medium">{errorDetail.tipo}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Data/Hora:</span>{" "}
                <span className="font-medium">{errorDetail.dataHora}</span>
              </div>
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium mb-1">
                  Descrição do erro:
                </p>
                <p className="text-red-600">{errorDetail.erroDetalhe}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                data-ocid="dashboard.aria_error.cancel_button"
                onClick={() => setErrorDetail(null)}
              >
                Fechar
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs bg-primary text-white"
                data-ocid="dashboard.aria_error.confirm_button"
                onClick={() => {
                  const detailId = errorDetail.id;
                  setAriaTarefas((t) =>
                    t.map((x) =>
                      x.id === detailId
                        ? {
                            ...x,
                            status: "processando" as AriaTarefaStatus,
                            dataHora: new Date().toLocaleString("pt-BR"),
                            erroDetalhe: undefined,
                          }
                        : x,
                    ),
                  );
                  setErrorDetail(null);
                  setTimeout(
                    () =>
                      setAriaTarefas((t) =>
                        t.map((x) =>
                          x.id === detailId
                            ? { ...x, status: "concluido" as AriaTarefaStatus }
                            : x,
                        ),
                      ),
                    3000,
                  );
                  toast.success("Reprocessando tarefa...");
                }}
              >
                Reprocessar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
