import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  FileSignature,
  FileText,
  Pencil,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import { useAppContext } from "../context/AppContext";
import { addRecord, deleteRecord, getAllRecords, putRecord } from "../lib/db";

export interface Contrato {
  id: string;
  clienteId: string;
  clienteNome: string;
  servico: string;
  valorMensal: number;
  dataInicio: string;
  dataRenovacao: string;
  status: "ativo" | "inativo" | "pendente";
  observacoes: string;
  criadoEm: string;
}

export interface ContratoFatura {
  id: string;
  contratoId: string;
  clienteNome: string;
  servico: string;
  valorMensal: number;
  mesReferencia: string;
  dataVencimento: string;
  status: "pendente" | "pago" | "cancelado";
  numeroBoleto: string;
  criadoEm: string;
}

const SAMPLE_CONTRATOS: Omit<Contrato, "id" | "criadoEm">[] = [
  {
    clienteId: "client-1",
    clienteNome: "Empresa Alfa Ltda",
    servico: "Contabilidade Mensal",
    valorMensal: 1800,
    dataInicio: "2025-01-01",
    dataRenovacao: "2026-04-15",
    status: "ativo",
    observacoes: "Inclui DAS, Folha e Relat\u00f3rios mensais.",
  },
  {
    clienteId: "client-2",
    clienteNome: "Tech Solutions SA",
    servico: "Folha de Pagamento",
    valorMensal: 950,
    dataInicio: "2024-07-01",
    dataRenovacao: "2026-07-01",
    status: "ativo",
    observacoes: "At\u00e9 10 funcion\u00e1rios. eSocial incluso.",
  },
  {
    clienteId: "client-3",
    clienteNome: "Construtora Beta Ltda",
    servico: "Assessoria Fiscal Completa",
    valorMensal: 3200,
    dataInicio: "2024-03-01",
    dataRenovacao: "2026-03-01",
    status: "ativo",
    observacoes: "Lucro Real, SPED, ECF e ECD inclusos.",
  },
  {
    clienteId: "client-4",
    clienteNome: "Comercial Gama ME",
    servico: "Contabilidade + Fiscal",
    valorMensal: 1200,
    dataInicio: "2025-05-01",
    dataRenovacao: "2026-05-01",
    status: "pendente",
    observacoes: "Aguardando assinatura do contrato renovado.",
  },
];

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function fmtDate(iso: string): string {
  if (!iso) return "\u2014";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function fmtBRL(val: number): string {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function generateBoleto(): string {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `BOL-${new Date().getFullYear()}-${n}`;
}

function StatusBadge({ status }: { status: Contrato["status"] }) {
  if (status === "ativo")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
        Ativo
      </Badge>
    );
  if (status === "inativo")
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200">Inativo</Badge>
    );
  return (
    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
      Pendente
    </Badge>
  );
}

function FaturaBadge({ status }: { status: ContratoFatura["status"] }) {
  if (status === "pago")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
        Pago
      </Badge>
    );
  if (status === "cancelado")
    return (
      <Badge className="bg-gray-100 text-gray-600 border-gray-200">
        Cancelado
      </Badge>
    );
  return (
    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
      Pendente
    </Badge>
  );
}

const EMPTY_FORM = {
  clienteId: "",
  clienteNome: "",
  servico: "",
  valorMensal: "",
  dataInicio: "",
  dataRenovacao: "",
  status: "ativo" as Contrato["status"],
  observacoes: "",
};

export default function GestaoContratos() {
  const { clients } = useAppContext();
  const { addMessage } = useARIA();

  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [faturas, setFaturas] = useState<ContratoFatura[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [filterCliente, setFilterCliente] = useState("");
  const [filterMes, setFilterMes] = useState("");

  // Load from DB
  useEffect(() => {
    async function load() {
      const [cs, fs] = await Promise.all([
        getAllRecords<Contrato>("contratos"),
        getAllRecords<ContratoFatura>("contrato_faturas"),
      ]);

      if (cs.length === 0) {
        const seeds: Contrato[] = SAMPLE_CONTRATOS.map((s, i) => ({
          ...s,
          id: `contrato-${Date.now()}-${i}`,
          criadoEm: new Date().toISOString(),
        }));
        await Promise.all(seeds.map((s) => addRecord("contratos", s)));
        setContratos(seeds);
      } else {
        setContratos(cs);
      }

      setFaturas(fs);
      setLoading(false);
    }
    load().catch(console.error);
  }, []);

  // ARIA warning for expiring contracts (once per session)
  useEffect(() => {
    if (contratos.length === 0) return;
    const key = "aria_contratos_warned";
    if (sessionStorage.getItem(key)) return;
    const expiring = contratos.filter(
      (c) => c.status === "ativo" && daysUntil(c.dataRenovacao) <= 30,
    );
    if (expiring.length > 0) {
      addMessage({
        type: "info",
        text: `\u26a0\ufe0f ${expiring.length} contrato(s) com renova\u00e7\u00e3o nos pr\u00f3ximos 30 dias: ${expiring.map((c) => c.clienteNome).join(", ")}.`,
      });
      sessionStorage.setItem(key, "1");
    }
  }, [contratos, addMessage]);

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  }

  function openEdit(c: Contrato) {
    setEditingId(c.id);
    setForm({
      clienteId: c.clienteId,
      clienteNome: c.clienteNome,
      servico: c.servico,
      valorMensal: String(c.valorMensal),
      dataInicio: c.dataInicio,
      dataRenovacao: c.dataRenovacao,
      status: c.status,
      observacoes: c.observacoes,
    });
    setDialogOpen(true);
  }

  async function saveContrato() {
    if (!form.clienteNome || !form.servico || !form.valorMensal) {
      toast.error("Preencha os campos obrigat\u00f3rios.");
      return;
    }
    const item: Contrato = {
      id: editingId ?? `contrato-${Date.now()}`,
      clienteId: form.clienteId,
      clienteNome: form.clienteNome,
      servico: form.servico,
      valorMensal: Number(form.valorMensal),
      dataInicio: form.dataInicio,
      dataRenovacao: form.dataRenovacao,
      status: form.status,
      observacoes: form.observacoes,
      criadoEm: editingId
        ? (contratos.find((c) => c.id === editingId)?.criadoEm ??
          new Date().toISOString())
        : new Date().toISOString(),
    };
    await putRecord("contratos", item);
    setContratos((prev) =>
      editingId
        ? prev.map((c) => (c.id === editingId ? item : c))
        : [...prev, item],
    );
    setDialogOpen(false);
    toast.success(editingId ? "Contrato atualizado." : "Contrato criado.");
    addMessage({
      type: "info",
      text: `\u2705 Contrato de ${item.clienteNome} (${item.servico}) ${editingId ? "atualizado" : "criado"} com sucesso.`,
    });
  }

  async function deleteContrato(id: string) {
    await deleteRecord("contratos", id);
    setContratos((prev) => prev.filter((c) => c.id !== id));
    toast.success("Contrato removido.");
  }

  async function gerarFatura(contrato: Contrato) {
    const mes = currentMonth();
    const alreadyExists = faturas.some(
      (f) => f.contratoId === contrato.id && f.mesReferencia === mes,
    );
    if (alreadyExists) {
      toast.error(
        "J\u00e1 existe fatura para esse contrato no m\u00eas atual.",
      );
      return;
    }
    const venc = new Date();
    venc.setDate(venc.getDate() + 10);
    const fatura: ContratoFatura = {
      id: `fatura-${Date.now()}`,
      contratoId: contrato.id,
      clienteNome: contrato.clienteNome,
      servico: contrato.servico,
      valorMensal: contrato.valorMensal,
      mesReferencia: mes,
      dataVencimento: venc.toISOString().split("T")[0],
      status: "pendente",
      numeroBoleto: generateBoleto(),
      criadoEm: new Date().toISOString(),
    };
    await addRecord("contrato_faturas", fatura);
    setFaturas((prev) => [...prev, fatura]);
    toast.success(`Fatura ${fatura.numeroBoleto} gerada.`);
    addMessage({
      type: "info",
      text: `\ud83e\uddfe Fatura gerada para ${contrato.clienteNome} \u2014 ${fatura.numeroBoleto} | ${fmtBRL(contrato.valorMensal)} | Vence ${fmtDate(fatura.dataVencimento)}.`,
    });
  }

  async function marcarPago(fatura: ContratoFatura) {
    const updated = { ...fatura, status: "pago" as const };
    await putRecord("contrato_faturas", updated);
    setFaturas((prev) => prev.map((f) => (f.id === fatura.id ? updated : f)));
    toast.success("Fatura marcada como paga.");
  }

  const faturasFiltered = faturas.filter((f) => {
    const clienteOk =
      !filterCliente ||
      f.clienteNome.toLowerCase().includes(filterCliente.toLowerCase());
    const mesOk = !filterMes || f.mesReferencia === filterMes;
    return clienteOk && mesOk;
  });

  const meses = [...new Set(faturas.map((f) => f.mesReferencia))]
    .sort()
    .reverse();
  const gruposHistorico = meses
    .map((m) => ({
      mes: m,
      itens: faturasFiltered.filter((f) => f.mesReferencia === m),
    }))
    .filter((g) => g.itens.length > 0);

  const totalFaturado = faturasFiltered.reduce((a, f) => a + f.valorMensal, 0);
  const totalRecebido = faturasFiltered
    .filter((f) => f.status === "pago")
    .reduce((a, f) => a + f.valorMensal, 0);
  const totalPendente = faturasFiltered
    .filter((f) => f.status === "pendente")
    .reduce((a, f) => a + f.valorMensal, 0);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-full"
        data-ocid="gestao-contratos.loading_state"
      >
        <p className="text-muted-foreground">Carregando contratos...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileSignature className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Gest\u00e3o de Contratos
            </h1>
            <p className="text-sm text-muted-foreground">
              Contratos, faturamento recorrente e hist\u00f3rico de pagamentos
            </p>
          </div>
        </div>
        <Button data-ocid="gestao-contratos.primary_button" onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Contrato
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">
              Contratos Ativos
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {contratos.filter((c) => c.status === "ativo").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">
              Faturamento Mensal
            </p>
            <p className="text-2xl font-bold text-primary">
              {fmtBRL(
                contratos
                  .filter((c) => c.status === "ativo")
                  .reduce((a, c) => a + c.valorMensal, 0),
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">
              Renova\u00e7\u00f5es \u226430 dias
            </p>
            <p className="text-2xl font-bold text-yellow-600">
              {
                contratos.filter(
                  (c) =>
                    c.status === "ativo" && daysUntil(c.dataRenovacao) <= 30,
                ).length
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contratos">
        <TabsList>
          <TabsTrigger value="contratos" data-ocid="gestao-contratos.tab">
            <FileText className="w-4 h-4 mr-2" /> Contratos
          </TabsTrigger>
          <TabsTrigger value="faturamento" data-ocid="gestao-contratos.tab">
            <Receipt className="w-4 h-4 mr-2" /> Faturamento
          </TabsTrigger>
          <TabsTrigger value="historico" data-ocid="gestao-contratos.tab">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Hist\u00f3rico
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Contratos */}
        <TabsContent value="contratos">
          <Card>
            <CardContent className="p-0">
              <Table data-ocid="gestao-contratos.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Servi\u00e7o</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Data In\u00edcio</TableHead>
                    <TableHead>Renova\u00e7\u00e3o</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">
                      A\u00e7\u00f5es
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratos.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-10"
                        data-ocid="gestao-contratos.empty_state"
                      >
                        Nenhum contrato cadastrado.
                      </TableCell>
                    </TableRow>
                  )}
                  {contratos.map((c, idx) => {
                    const dias = daysUntil(c.dataRenovacao);
                    const expiring = c.status === "ativo" && dias <= 30;
                    return (
                      <TableRow
                        key={c.id}
                        data-ocid={`gestao-contratos.row.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {c.clienteNome}
                          {expiring && (
                            <Badge className="ml-2 bg-orange-100 text-orange-700 border-orange-200 text-[10px]">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {dias <= 0 ? "Vencido" : `${dias}d`}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{c.servico}</TableCell>
                        <TableCell>{fmtBRL(c.valorMensal)}</TableCell>
                        <TableCell>{fmtDate(c.dataInicio)}</TableCell>
                        <TableCell>{fmtDate(c.dataRenovacao)}</TableCell>
                        <TableCell>
                          <StatusBadge status={c.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              data-ocid={`gestao-contratos.edit_button.${idx + 1}`}
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              data-ocid={`gestao-contratos.delete_button.${idx + 1}`}
                              onClick={() => deleteContrato(c.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Faturamento */}
        <TabsContent value="faturamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Contratos Ativos \u2014 Gerar Fatura
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Servi\u00e7o</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead className="text-right">A\u00e7\u00e3o</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratos
                    .filter((c) => c.status === "ativo")
                    .map((c, idx) => (
                      <TableRow
                        key={c.id}
                        data-ocid={`gestao-contratos.faturamento.row.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {c.clienteNome}
                        </TableCell>
                        <TableCell>{c.servico}</TableCell>
                        <TableCell>{fmtBRL(c.valorMensal)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`gestao-contratos.faturamento.button.${idx + 1}`}
                            onClick={() => gerarFatura(c)}
                          >
                            <Receipt className="w-4 h-4 mr-1" /> Gerar Fatura
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {faturas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Faturas Geradas</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Servi\u00e7o</TableHead>
                      <TableHead>M\u00eas Ref.</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>N\u00ba Boleto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">
                        A\u00e7\u00e3o
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...faturas].reverse().map((f, idx) => (
                      <TableRow
                        key={f.id}
                        data-ocid={`gestao-contratos.faturas.row.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {f.clienteNome}
                        </TableCell>
                        <TableCell>{f.servico}</TableCell>
                        <TableCell>{f.mesReferencia}</TableCell>
                        <TableCell>{fmtBRL(f.valorMensal)}</TableCell>
                        <TableCell>{fmtDate(f.dataVencimento)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {f.numeroBoleto}
                        </TableCell>
                        <TableCell>
                          <FaturaBadge status={f.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {f.status === "pendente" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              data-ocid={`gestao-contratos.faturas.save_button.${idx + 1}`}
                              onClick={() => marcarPago(f)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Marcar
                              Pago
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: Hist\u00f3rico */}
        <TabsContent value="historico" className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Filtrar por cliente..."
              value={filterCliente}
              onChange={(e) => setFilterCliente(e.target.value)}
              className="max-w-xs"
              data-ocid="gestao-contratos.search_input"
            />
            <Select value={filterMes} onValueChange={setFilterMes}>
              <SelectTrigger
                className="w-40"
                data-ocid="gestao-contratos.select"
              >
                <SelectValue placeholder="Todos os meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os meses</SelectItem>
                {meses.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Faturado
                </p>
                <p className="text-xl font-bold text-foreground">
                  {fmtBRL(totalFaturado)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Recebido
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  {fmtBRL(totalRecebido)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Pendente
                </p>
                <p className="text-xl font-bold text-yellow-600">
                  {fmtBRL(totalPendente)}
                </p>
              </CardContent>
            </Card>
          </div>

          {gruposHistorico.length === 0 && (
            <Card>
              <CardContent
                className="py-12 text-center text-muted-foreground"
                data-ocid="gestao-contratos.historico.empty_state"
              >
                Nenhuma fatura gerada ainda.
              </CardContent>
            </Card>
          )}

          {gruposHistorico.map((grupo) => (
            <Card key={grupo.mes}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {grupo.mes}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Servi\u00e7o</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>N\u00ba Boleto</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grupo.itens.map((f, idx) => (
                      <TableRow
                        key={f.id}
                        data-ocid={`gestao-contratos.historico.row.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {f.clienteNome}
                        </TableCell>
                        <TableCell>{f.servico}</TableCell>
                        <TableCell>{fmtBRL(f.valorMensal)}</TableCell>
                        <TableCell>{fmtDate(f.dataVencimento)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {f.numeroBoleto}
                        </TableCell>
                        <TableCell>
                          <FaturaBadge status={f.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Dialog: Novo / Editar Contrato */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" data-ocid="gestao-contratos.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Contrato" : "Novo Contrato"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="gc-cliente">Cliente *</Label>
              {clients.length > 0 ? (
                <Select
                  value={form.clienteId}
                  onValueChange={(v) => {
                    const cl = clients.find((c) => c.id === v);
                    setForm((f) => ({
                      ...f,
                      clienteId: v,
                      clienteNome: cl?.name ?? v,
                    }));
                  }}
                >
                  <SelectTrigger
                    id="gc-cliente"
                    data-ocid="gestao-contratos.select"
                  >
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="gc-cliente"
                  value={form.clienteNome}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clienteNome: e.target.value }))
                  }
                  placeholder="Nome do cliente"
                  data-ocid="gestao-contratos.input"
                />
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="gc-servico">Servi\u00e7o *</Label>
              <Input
                id="gc-servico"
                value={form.servico}
                onChange={(e) =>
                  setForm((f) => ({ ...f, servico: e.target.value }))
                }
                placeholder="Ex: Contabilidade Mensal"
                data-ocid="gestao-contratos.input"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="gc-valor">Valor Mensal (R$) *</Label>
              <Input
                id="gc-valor"
                type="number"
                min="0"
                step="0.01"
                value={form.valorMensal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, valorMensal: e.target.value }))
                }
                placeholder="0,00"
                data-ocid="gestao-contratos.input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="gc-inicio">Data In\u00edcio</Label>
                <Input
                  id="gc-inicio"
                  type="date"
                  value={form.dataInicio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dataInicio: e.target.value }))
                  }
                  data-ocid="gestao-contratos.input"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gc-renovacao">Data Renova\u00e7\u00e3o</Label>
                <Input
                  id="gc-renovacao"
                  type="date"
                  value={form.dataRenovacao}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dataRenovacao: e.target.value }))
                  }
                  data-ocid="gestao-contratos.input"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as Contrato["status"] }))
                }
              >
                <SelectTrigger data-ocid="gestao-contratos.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="gc-obs">Observa\u00e7\u00f5es</Label>
              <Textarea
                id="gc-obs"
                value={form.observacoes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, observacoes: e.target.value }))
                }
                rows={3}
                placeholder="Notas adicionais..."
                data-ocid="gestao-contratos.textarea"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                data-ocid="gestao-contratos.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                data-ocid="gestao-contratos.submit_button"
                onClick={saveContrato}
              >
                {editingId ? "Salvar Altera\u00e7\u00f5es" : "Criar Contrato"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
