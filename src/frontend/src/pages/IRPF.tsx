import ARIATogglePanel from "@/components/ARIATogglePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  AlertTriangle,
  Download,
  FileDown,
  FileSearch,
  Lock,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAllRecords, putRecord } from "../lib/db";

const LIMITE_EDUCACAO = 3561.5;

interface Cliente {
  id: string;
  name: string;
  cnpj?: string;
}

interface RendimentoTributavel {
  id: string;
  fontePagadora: string;
  cnpj: string;
  rendimentoBruto: number;
  irRetido: number;
}

interface RendimentoIsento {
  id: string;
  descricao: string;
  tipo: "caderneta" | "dividendos" | "indenizacao" | "fgts" | "outros";
  valor: number;
}

interface DespesaMedica {
  id: string;
  tipo:
    | "medico"
    | "dentista"
    | "hospital"
    | "psicologo"
    | "fisioterapeuta"
    | "outros";
  nome: string;
  cpfCnpj: string;
  valor: number;
}

interface DespesaEducacao {
  id: string;
  tipo: "fundamental" | "medio" | "superior" | "pos" | "tecnico";
  nome: string;
  cpfCnpj: string;
  valor: number;
}

interface DespesaPrevidencia {
  id: string;
  tipo: "inss" | "inss_domestico" | "pgbl";
  valor: number;
}

interface Deducoes {
  medicas: DespesaMedica[];
  educacao: DespesaEducacao[];
  previdencia: DespesaPrevidencia[];
}

interface Dependente {
  id: string;
  nome: string;
  cpf: string;
  parentesco: string;
  dataNascimento: string;
  deficiencia: boolean;
}

interface BemDireito {
  id: string;
  codigo: string;
  discriminacao: string;
  situacaoAnterior: number;
  situacaoAtual: number;
}

interface DividaOnus {
  id: string;
  codigo: string;
  credor: string;
  cpfCnpj: string;
  valor: number;
}

interface IRPFDeclaracao {
  id: string;
  clienteId: string;
  ano: string;
  rendimentosTributaveis: RendimentoTributavel[];
  rendimentosIsentos: RendimentoIsento[];
  deducoes: Deducoes;
  dependentes: Dependente[];
  bens: BemDireito[];
  dividas: DividaOnus[];
  criadoEm: string;
  atualizadoEm: string;
}

const TIPOS_ISENTO = [
  { value: "caderneta", label: "Rendimento de Caderneta" },
  { value: "dividendos", label: "Lucros e Dividendos" },
  { value: "indenizacao", label: "Indenização" },
  { value: "fgts", label: "FGTS" },
  { value: "outros", label: "Outros" },
];

const TIPOS_MEDICO = [
  { value: "medico", label: "Médico" },
  { value: "dentista", label: "Dentista" },
  { value: "hospital", label: "Hospital" },
  { value: "psicologo", label: "Psicólogo" },
  { value: "fisioterapeuta", label: "Fisioterapeuta" },
  { value: "outros", label: "Outros" },
];

const TIPOS_EDUCACAO = [
  { value: "fundamental", label: "Ensino Fundamental" },
  { value: "medio", label: "Ensino Médio" },
  { value: "superior", label: "Ensino Superior" },
  { value: "pos", label: "Pós-graduação" },
  { value: "tecnico", label: "Curso Técnico" },
];

const TIPOS_PREVIDENCIA = [
  { value: "inss", label: "INSS" },
  { value: "inss_domestico", label: "INSS Doméstico" },
  { value: "pgbl", label: "Previdência Privada PGBL" },
];
const PARENTESCOS = [
  { value: "filho", label: "Filho(a)" },
  { value: "conjuge", label: "Cônjuge" },
  { value: "companheiro", label: "Companheiro(a)" },
  { value: "pai_mae", label: "Pai/Mãe" },
  { value: "outros", label: "Outros" },
];

const DEDUCAO_POR_DEPENDENTE = 2275.08;

const ANOS = ["2026", "2025", "2024", "2023"];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function newTributavel(): RendimentoTributavel {
  return {
    id: crypto.randomUUID(),
    fontePagadora: "",
    cnpj: "",
    rendimentoBruto: 0,
    irRetido: 0,
  };
}

function newIsento(): RendimentoIsento {
  return { id: crypto.randomUUID(), descricao: "", tipo: "outros", valor: 0 };
}

function newMedica(): DespesaMedica {
  return {
    id: crypto.randomUUID(),
    tipo: "medico",
    nome: "",
    cpfCnpj: "",
    valor: 0,
  };
}

function newEducacao(): DespesaEducacao {
  return {
    id: crypto.randomUUID(),
    tipo: "superior",
    nome: "",
    cpfCnpj: "",
    valor: 0,
  };
}

function newPrevidencia(): DespesaPrevidencia {
  return { id: crypto.randomUUID(), tipo: "inss", valor: 0 };
}

const CODIGOS_BENS = [
  { value: "11", label: "11 - Imóvel Urbano" },
  { value: "12", label: "12 - Imóvel Rural" },
  { value: "21", label: "21 - Veículo Automotivo" },
  { value: "22", label: "22 - Aeronave/Embarcação" },
  { value: "31", label: "31 - Aplicação Financeira" },
  { value: "32", label: "32 - Ações" },
  { value: "41", label: "41 - Móveis/Utensílios" },
  { value: "51", label: "51 - Participação Societária" },
  { value: "61", label: "61 - Depósito Bancário" },
  { value: "99", label: "99 - Outros" },
];

const CODIGOS_DIVIDAS = [
  { value: "11", label: "11 - Empréstimo Bancário" },
  { value: "12", label: "12 - Financiamento Imóvel" },
  { value: "13", label: "13 - Financiamento Veículo" },
  { value: "14", label: "14 - Cartão de Crédito" },
  { value: "15", label: "15 - Conta Garantida" },
  { value: "16", label: "16 - Crédito Consignado" },
  { value: "17", label: "17 - Dívida com Pessoa Física" },
  { value: "99", label: "99 - Outras Dívidas" },
];

const FAIXAS_IR = [
  { ate: 2259.2, aliquota: 0, parcela: 0, label: "Isento" },
  { ate: 2826.65, aliquota: 0.075, parcela: 169.44, label: "7,5%" },
  { ate: 3751.05, aliquota: 0.15, parcela: 381.44, label: "15%" },
  { ate: 4664.68, aliquota: 0.225, parcela: 662.77, label: "22,5%" },
  {
    ate: Number.POSITIVE_INFINITY,
    aliquota: 0.275,
    parcela: 896.0,
    label: "27,5%",
  },
];

function calcularIR(base: number): {
  aliquota: number;
  parcela: number;
  irDevido: number;
  label: string;
} {
  const faixa =
    FAIXAS_IR.find((f) => base <= f.ate) ?? FAIXAS_IR[FAIXAS_IR.length - 1];
  const irDevido = Math.max(0, base * faixa.aliquota - faixa.parcela);
  return {
    aliquota: faixa.aliquota,
    parcela: faixa.parcela,
    irDevido,
    label: faixa.label,
  };
}

function newBem(): BemDireito {
  return {
    id: crypto.randomUUID(),
    codigo: "99",
    discriminacao: "",
    situacaoAnterior: 0,
    situacaoAtual: 0,
  };
}

function newDivida(): DividaOnus {
  return {
    id: crypto.randomUUID(),
    codigo: "11",
    credor: "",
    cpfCnpj: "",
    valor: 0,
  };
}

function newDependente(): Dependente {
  return {
    id: crypto.randomUUID(),
    nome: "",
    cpf: "",
    parentesco: "filho",
    dataNascimento: "",
    deficiencia: false,
  };
}

const emptyDeducoes = (): Deducoes => ({
  medicas: [],
  educacao: [],
  previdencia: [],
});

export default function IRPF() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<string>("none");
  const [ano, setAno] = useState<string>("2025");
  const [tributaveis, setTributaveis] = useState<RendimentoTributavel[]>([]);
  const [isentos, setIsentos] = useState<RendimentoIsento[]>([]);
  const [deducoes, setDeducoes] = useState<Deducoes>(emptyDeducoes());
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [depForm, setDepForm] = useState<Dependente>(newDependente());
  const [showDepForm, setShowDepForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bens, setBens] = useState<BemDireito[]>([]);
  const [dividas, setDividas] = useState<DividaOnus[]>([]);
  const [irRetidoFonte, setIrRetidoFonte] = useState<number>(0);
  const [inconsistencias, setInconsistencias] = useState<
    { msg: string; nivel: "alerta" | "critico" }[]
  >([]);
  const [showInconsistencias, setShowInconsistencias] = useState(false);

  useEffect(() => {
    getAllRecords<Cliente>("clients")
      .then((list) => {
        setClientes(list);
        if (list.length > 0) setClienteId(list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!clienteId || clienteId === "none") return;
    const key = `${clienteId}_${ano}`;
    getAllRecords<IRPFDeclaracao>("irpf_declaracoes")
      .then((recs) => {
        const found = recs.find((r) => r.id === key);
        if (found) {
          setTributaveis(found.rendimentosTributaveis);
          setIsentos(found.rendimentosIsentos);
          setDeducoes(found.deducoes ?? emptyDeducoes());
          setDependentes(found.dependentes ?? []);
          setBens(found.bens ?? []);
          setDividas(found.dividas ?? []);
        } else {
          setTributaveis([]);
          setIsentos([]);
          setDeducoes(emptyDeducoes());
          setDependentes([]);
          setBens([]);
          setDividas([]);
        }
      })
      .catch(() => {
        setTributaveis([]);
        setIsentos([]);
        setDeducoes(emptyDeducoes());
        setDependentes([]);
        setBens([]);
        setDividas([]);
      });
  }, [clienteId, ano]);

  const totalTributavel = tributaveis.reduce(
    (acc, r) => ({
      bruto: acc.bruto + r.rendimentoBruto,
      ir: acc.ir + r.irRetido,
    }),
    { bruto: 0, ir: 0 },
  );
  const totalIsento = isentos.reduce((acc, r) => acc + r.valor, 0);

  const totalMedicas = deducoes.medicas.reduce((s, r) => s + r.valor, 0);
  const totalEducacao = deducoes.educacao.reduce((s, r) => s + r.valor, 0);
  const totalEducacaoLimitado = Math.min(totalEducacao, LIMITE_EDUCACAO);
  const totalPrevidencia = deducoes.previdencia.reduce(
    (s, r) => s + r.valor,
    0,
  );
  const totalDependentes = dependentes.length * DEDUCAO_POR_DEPENDENTE;
  const totalDeducoes =
    totalMedicas + totalEducacaoLimitado + totalPrevidencia + totalDependentes;
  const educacaoExcedeu = totalEducacao > LIMITE_EDUCACAO;

  const handleSave = async () => {
    if (!clienteId || clienteId === "none") {
      toast.error("Selecione um cliente antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      const key = `${clienteId}_${ano}`;
      const decl: IRPFDeclaracao = {
        id: key,
        clienteId,
        ano,
        rendimentosTributaveis: tributaveis,
        rendimentosIsentos: isentos,
        deducoes,
        dependentes,
        bens,
        dividas,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
      await putRecord("irpf_declaracoes", decl);
      toast.success("Declaração salva com sucesso!");
    } catch {
      toast.error("Erro ao salvar declaração.");
    } finally {
      setSaving(false);
    }
  };

  // ---- Tributáveis handlers ----
  const updateTributavel = (
    id: string,
    field: keyof RendimentoTributavel,
    value: string | number,
  ) => {
    setTributaveis((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };
  const removeTributavel = (id: string) =>
    setTributaveis((prev) => prev.filter((r) => r.id !== id));

  // ---- Isentos handlers ----
  const updateIsento = (
    id: string,
    field: keyof RendimentoIsento,
    value: string | number,
  ) => {
    setIsentos((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };
  const removeIsento = (id: string) =>
    setIsentos((prev) => prev.filter((r) => r.id !== id));

  // ---- Deduções handlers ----
  const updateMedica = (
    id: string,
    field: keyof DespesaMedica,
    value: string | number,
  ) => {
    setDeducoes((prev) => ({
      ...prev,
      medicas: prev.medicas.map((r) =>
        r.id === id ? { ...r, [field]: value } : r,
      ),
    }));
  };
  const removeMedica = (id: string) =>
    setDeducoes((prev) => ({
      ...prev,
      medicas: prev.medicas.filter((r) => r.id !== id),
    }));

  const updateEducacao = (
    id: string,
    field: keyof DespesaEducacao,
    value: string | number,
  ) => {
    setDeducoes((prev) => ({
      ...prev,
      educacao: prev.educacao.map((r) =>
        r.id === id ? { ...r, [field]: value } : r,
      ),
    }));
  };
  const removeEducacao = (id: string) =>
    setDeducoes((prev) => ({
      ...prev,
      educacao: prev.educacao.filter((r) => r.id !== id),
    }));

  const updatePrevidencia = (
    id: string,
    field: keyof DespesaPrevidencia,
    value: string | number,
  ) => {
    setDeducoes((prev) => ({
      ...prev,
      previdencia: prev.previdencia.map((r) =>
        r.id === id ? { ...r, [field]: value } : r,
      ),
    }));
  };
  const removePrevidencia = (id: string) =>
    setDeducoes((prev) => ({
      ...prev,
      previdencia: prev.previdencia.filter((r) => r.id !== id),
    }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <FileSearch className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">
                Declaração de IRPF
              </h1>
              <Badge
                className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] font-semibold uppercase tracking-wide"
                variant="outline"
                data-ocid="irpf.simulado.badge"
              >
                SIMULADO
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Imposto de Renda — Pessoa Física · Fichas de rendimentos
            </p>
          </div>
        </div>

        <ARIATogglePanel
          screenName="irpf"
          toggles={[
            { key: "rendimentos", label: "Rendimentos" },
            { key: "deducoes", label: "Deduções" },
            { key: "calculo", label: "Cálculo" },
            { key: "exportacao", label: "Exportação" },
          ]}
        />

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
              Cliente
            </span>
            {clientes.length > 0 ? (
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger
                  className="w-52 h-8 text-xs"
                  data-ocid="irpf.cliente.select"
                >
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                className="w-52 h-8 text-xs"
                placeholder="Nome do cliente"
                value={clienteId === "none" ? "" : clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                data-ocid="irpf.cliente.input"
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
              Ano-Calendário
            </span>
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger
                className="w-28 h-8 text-xs"
                data-ocid="irpf.ano.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANOS.map((a) => (
                  <SelectItem key={a} value={a} className="text-xs">
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            className="h-8 gap-1.5 mt-4"
            onClick={handleSave}
            disabled={saving}
            data-ocid="irpf.save.button"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Salvando..." : "Salvar Declaração"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="tributaveis"
        className="space-y-4"
        data-ocid="irpf.tabs.panel"
      >
        <TabsList className="h-9 bg-card border border-border">
          <TabsTrigger
            value="tributaveis"
            className="text-xs"
            data-ocid="irpf.tributaveis.tab"
          >
            Rendimentos Tributáveis
          </TabsTrigger>
          <TabsTrigger
            value="isentos"
            className="text-xs"
            data-ocid="irpf.isentos.tab"
          >
            Rendimentos Isentos
          </TabsTrigger>
          <TabsTrigger
            value="deducoes"
            className="text-xs"
            data-ocid="irpf.deducoes.tab"
          >
            Deduções
          </TabsTrigger>
          <TabsTrigger
            value="dependentes"
            className="text-xs"
            data-ocid="irpf.dependentes.tab"
          >
            <Users className="w-3 h-3 mr-1" />
            Dependentes
          </TabsTrigger>
          <TabsTrigger
            value="bens"
            className="text-xs"
            data-ocid="irpf.bens.tab"
          >
            Bens e Dívidas
          </TabsTrigger>
          <TabsTrigger
            value="dividas"
            className="text-xs"
            data-ocid="irpf.dividas.tab"
          >
            Dívidas e Ônus
          </TabsTrigger>
          <TabsTrigger
            value="calculo"
            className="text-xs"
            data-ocid="irpf.calculo.tab"
          >
            Cálculo IR
          </TabsTrigger>
          <TabsTrigger
            value="exportar"
            className="text-xs h-7 px-3"
            data-ocid="irpf.exportar.tab"
          >
            <Download className="w-3 h-3 mr-1" />
            Exportar
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Rendimentos Tributáveis ── */}
        <TabsContent value="tributaveis">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Rendimentos Tributáveis
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Salários, pró-labore, aluguéis, honorários e demais
                  rendimentos sujeitos ao IRPF
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setTributaveis((p) => [...p, newTributavel()])}
                data-ocid="irpf.add_tributavel.button"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Linha
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table data-ocid="irpf.tributaveis.table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-xs font-semibold text-muted-foreground w-56">
                      Fonte Pagadora
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-40">
                      CNPJ
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right w-40">
                      Rendimento Bruto (R$)
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right w-40">
                      IR Retido na Fonte (R$)
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-16 text-center">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tributaveis.length === 0 ? (
                    <TableRow data-ocid="irpf.tributaveis.empty_state">
                      <TableCell
                        colSpan={5}
                        className="text-center text-xs text-muted-foreground py-10"
                      >
                        Nenhum rendimento tributável informado. Clique em
                        "Adicionar Linha" para começar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tributaveis.map((r, idx) => (
                      <TableRow
                        key={r.id}
                        className="border-border hover:bg-muted/30"
                        data-ocid={`irpf.tributaveis.row.${idx + 1}`}
                      >
                        <TableCell className="py-2">
                          <Input
                            className="h-7 text-xs bg-background/50"
                            value={r.fontePagadora}
                            onChange={(e) =>
                              updateTributavel(
                                r.id,
                                "fontePagadora",
                                e.target.value,
                              )
                            }
                            placeholder="Ex: Empresa ABC Ltda"
                            data-ocid={`irpf.fonte.input.${idx + 1}`}
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            className="h-7 text-xs bg-background/50"
                            value={r.cnpj}
                            onChange={(e) =>
                              updateTributavel(r.id, "cnpj", e.target.value)
                            }
                            placeholder="00.000.000/0001-00"
                            data-ocid={`irpf.cnpj.input.${idx + 1}`}
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            className="h-7 text-xs bg-background/50 text-right"
                            type="number"
                            min={0}
                            step={0.01}
                            value={r.rendimentoBruto || ""}
                            onChange={(e) =>
                              updateTributavel(
                                r.id,
                                "rendimentoBruto",
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                            placeholder="0,00"
                            data-ocid={`irpf.bruto.input.${idx + 1}`}
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            className="h-7 text-xs bg-background/50 text-right"
                            type="number"
                            min={0}
                            step={0.01}
                            value={r.irRetido || ""}
                            onChange={(e) =>
                              updateTributavel(
                                r.id,
                                "irRetido",
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                            placeholder="0,00"
                            data-ocid={`irpf.ir_retido.input.${idx + 1}`}
                          />
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 hover:text-destructive"
                            onClick={() => removeTributavel(r.id)}
                            data-ocid={`irpf.tributaveis.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {tributaveis.length > 0 && (
              <div className="flex justify-end gap-8 px-5 py-3 bg-muted/20 border-t border-border">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Total Rendimento Bruto
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {fmt(totalTributavel.bruto)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Total IR Retido
                  </p>
                  <p className="text-sm font-semibold text-accent">
                    {fmt(totalTributavel.ir)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 2: Rendimentos Isentos ── */}
        <TabsContent value="isentos">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Rendimentos Isentos e Não Tributáveis
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Caderneta de poupança, dividendos, FGTS, indenizações e demais
                  rendimentos isentos
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setIsentos((p) => [...p, newIsento()])}
                data-ocid="irpf.add_isento.button"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Linha
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table data-ocid="irpf.isentos.table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Descrição
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-52">
                      Tipo
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right w-40">
                      Valor (R$)
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-16 text-center">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isentos.length === 0 ? (
                    <TableRow data-ocid="irpf.isentos.empty_state">
                      <TableCell
                        colSpan={4}
                        className="text-center text-xs text-muted-foreground py-10"
                      >
                        Nenhum rendimento isento informado. Clique em "Adicionar
                        Linha" para começar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    isentos.map((r, idx) => (
                      <TableRow
                        key={r.id}
                        className="border-border hover:bg-muted/30"
                        data-ocid={`irpf.isentos.row.${idx + 1}`}
                      >
                        <TableCell className="py-2">
                          <Input
                            className="h-7 text-xs bg-background/50"
                            value={r.descricao}
                            onChange={(e) =>
                              updateIsento(r.id, "descricao", e.target.value)
                            }
                            placeholder="Ex: Rendimento Poupança BB"
                            data-ocid={`irpf.isento_desc.input.${idx + 1}`}
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Select
                            value={r.tipo}
                            onValueChange={(v) =>
                              updateIsento(
                                r.id,
                                "tipo",
                                v as RendimentoIsento["tipo"],
                              )
                            }
                          >
                            <SelectTrigger
                              className="h-7 text-xs"
                              data-ocid={`irpf.isento_tipo.select.${idx + 1}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIPOS_ISENTO.map((t) => (
                                <SelectItem
                                  key={t.value}
                                  value={t.value}
                                  className="text-xs"
                                >
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            className="h-7 text-xs bg-background/50 text-right"
                            type="number"
                            min={0}
                            step={0.01}
                            value={r.valor || ""}
                            onChange={(e) =>
                              updateIsento(
                                r.id,
                                "valor",
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                            placeholder="0,00"
                            data-ocid={`irpf.isento_valor.input.${idx + 1}`}
                          />
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 hover:text-destructive"
                            onClick={() => removeIsento(r.id)}
                            data-ocid={`irpf.isentos.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {isentos.length > 0 && (
              <div className="flex justify-end px-5 py-3 bg-muted/20 border-t border-border">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Total Rendimentos Isentos
                  </p>
                  <p className="text-sm font-semibold text-green-400">
                    {fmt(totalIsento)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 3: Deduções ── */}
        <TabsContent value="deducoes">
          <div className="space-y-4">
            {/* ── Despesas Médicas ── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Despesas Médicas
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Médico, dentista, hospital, psicólogo, fisioterapeuta — sem
                    limite de dedução
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() =>
                    setDeducoes((p) => ({
                      ...p,
                      medicas: [...p.medicas, newMedica()],
                    }))
                  }
                  data-ocid="irpf.add_medica.button"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Linha
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table data-ocid="irpf.medicas.table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-xs font-semibold text-muted-foreground w-44">
                        Tipo
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Nome / Estabelecimento
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-44">
                        CPF / CNPJ
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right w-36">
                        Valor (R$)
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-16 text-center">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deducoes.medicas.length === 0 ? (
                      <TableRow data-ocid="irpf.medicas.empty_state">
                        <TableCell
                          colSpan={5}
                          className="text-center text-xs text-muted-foreground py-8"
                        >
                          Nenhuma despesa médica informada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      deducoes.medicas.map((r, idx) => (
                        <TableRow
                          key={r.id}
                          className="border-border hover:bg-muted/30"
                          data-ocid={`irpf.medicas.row.${idx + 1}`}
                        >
                          <TableCell className="py-2">
                            <Select
                              value={r.tipo}
                              onValueChange={(v) =>
                                updateMedica(
                                  r.id,
                                  "tipo",
                                  v as DespesaMedica["tipo"],
                                )
                              }
                            >
                              <SelectTrigger
                                className="h-7 text-xs"
                                data-ocid={`irpf.medica_tipo.select.${idx + 1}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIPOS_MEDICO.map((t) => (
                                  <SelectItem
                                    key={t.value}
                                    value={t.value}
                                    className="text-xs"
                                  >
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              className="h-7 text-xs bg-background/50"
                              value={r.nome}
                              onChange={(e) =>
                                updateMedica(r.id, "nome", e.target.value)
                              }
                              placeholder="Ex: Dr. João Silva"
                              data-ocid={`irpf.medica_nome.input.${idx + 1}`}
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              className="h-7 text-xs bg-background/50"
                              value={r.cpfCnpj}
                              onChange={(e) =>
                                updateMedica(r.id, "cpfCnpj", e.target.value)
                              }
                              placeholder="000.000.000-00"
                              data-ocid={`irpf.medica_cpfcnpj.input.${idx + 1}`}
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              className="h-7 text-xs bg-background/50 text-right"
                              type="number"
                              min={0}
                              step={0.01}
                              value={r.valor || ""}
                              onChange={(e) =>
                                updateMedica(
                                  r.id,
                                  "valor",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="0,00"
                              data-ocid={`irpf.medica_valor.input.${idx + 1}`}
                            />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 hover:text-destructive"
                              onClick={() => removeMedica(r.id)}
                              data-ocid={`irpf.medicas.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {deducoes.medicas.length > 0 && (
                <div className="flex justify-end px-5 py-3 bg-muted/20 border-t border-border">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Total Despesas Médicas
                    </p>
                    <p className="text-sm font-semibold text-blue-400">
                      {fmt(totalMedicas)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Despesas com Educação ── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">
                      Despesas com Educação
                    </h2>
                    {educacaoExcedeu && (
                      <Badge
                        className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] font-semibold gap-1"
                        variant="outline"
                        data-ocid="irpf.educacao_limite.badge"
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Limite excedido — deduz até {fmt(LIMITE_EDUCACAO)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Limite anual de dedução: {fmt(LIMITE_EDUCACAO)} por
                    declarante
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() =>
                    setDeducoes((p) => ({
                      ...p,
                      educacao: [...p.educacao, newEducacao()],
                    }))
                  }
                  data-ocid="irpf.add_educacao.button"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Linha
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table data-ocid="irpf.educacao.table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-xs font-semibold text-muted-foreground w-44">
                        Tipo
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Nome da Instituição
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-44">
                        CPF / CNPJ
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right w-36">
                        Valor (R$)
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-16 text-center">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deducoes.educacao.length === 0 ? (
                      <TableRow data-ocid="irpf.educacao.empty_state">
                        <TableCell
                          colSpan={5}
                          className="text-center text-xs text-muted-foreground py-8"
                        >
                          Nenhuma despesa com educação informada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      deducoes.educacao.map((r, idx) => (
                        <TableRow
                          key={r.id}
                          className="border-border hover:bg-muted/30"
                          data-ocid={`irpf.educacao.row.${idx + 1}`}
                        >
                          <TableCell className="py-2">
                            <Select
                              value={r.tipo}
                              onValueChange={(v) =>
                                updateEducacao(
                                  r.id,
                                  "tipo",
                                  v as DespesaEducacao["tipo"],
                                )
                              }
                            >
                              <SelectTrigger
                                className="h-7 text-xs"
                                data-ocid={`irpf.educacao_tipo.select.${idx + 1}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIPOS_EDUCACAO.map((t) => (
                                  <SelectItem
                                    key={t.value}
                                    value={t.value}
                                    className="text-xs"
                                  >
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              className="h-7 text-xs bg-background/50"
                              value={r.nome}
                              onChange={(e) =>
                                updateEducacao(r.id, "nome", e.target.value)
                              }
                              placeholder="Ex: Universidade Federal"
                              data-ocid={`irpf.educacao_nome.input.${idx + 1}`}
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              className="h-7 text-xs bg-background/50"
                              value={r.cpfCnpj}
                              onChange={(e) =>
                                updateEducacao(r.id, "cpfCnpj", e.target.value)
                              }
                              placeholder="00.000.000/0001-00"
                              data-ocid={`irpf.educacao_cpfcnpj.input.${idx + 1}`}
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              className="h-7 text-xs bg-background/50 text-right"
                              type="number"
                              min={0}
                              step={0.01}
                              value={r.valor || ""}
                              onChange={(e) =>
                                updateEducacao(
                                  r.id,
                                  "valor",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="0,00"
                              data-ocid={`irpf.educacao_valor.input.${idx + 1}`}
                            />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 hover:text-destructive"
                              onClick={() => removeEducacao(r.id)}
                              data-ocid={`irpf.educacao.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {deducoes.educacao.length > 0 && (
                <div className="flex justify-end gap-6 px-5 py-3 bg-muted/20 border-t border-border">
                  {educacaoExcedeu && (
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Valor Informado
                      </p>
                      <p className="text-sm font-semibold text-orange-400 line-through">
                        {fmt(totalEducacao)}
                      </p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {educacaoExcedeu
                        ? "Valor Dedutível (Limitado)"
                        : "Total Educação"}
                    </p>
                    <p className="text-sm font-semibold text-blue-400">
                      {fmt(totalEducacaoLimitado)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Previdência ── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Previdência
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    INSS, INSS Doméstico e Previdência Privada PGBL — dedutíveis
                    integralmente
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() =>
                    setDeducoes((p) => ({
                      ...p,
                      previdencia: [...p.previdencia, newPrevidencia()],
                    }))
                  }
                  data-ocid="irpf.add_previdencia.button"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Linha
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table data-ocid="irpf.previdencia.table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Tipo
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right w-40">
                        Valor (R$)
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-16 text-center">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deducoes.previdencia.length === 0 ? (
                      <TableRow data-ocid="irpf.previdencia.empty_state">
                        <TableCell
                          colSpan={3}
                          className="text-center text-xs text-muted-foreground py-8"
                        >
                          Nenhuma contribuição previdenciária informada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      deducoes.previdencia.map((r, idx) => (
                        <TableRow
                          key={r.id}
                          className="border-border hover:bg-muted/30"
                          data-ocid={`irpf.previdencia.row.${idx + 1}`}
                        >
                          <TableCell className="py-2">
                            <Select
                              value={r.tipo}
                              onValueChange={(v) =>
                                updatePrevidencia(
                                  r.id,
                                  "tipo",
                                  v as DespesaPrevidencia["tipo"],
                                )
                              }
                            >
                              <SelectTrigger
                                className="h-7 text-xs w-64"
                                data-ocid={`irpf.prev_tipo.select.${idx + 1}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIPOS_PREVIDENCIA.map((t) => (
                                  <SelectItem
                                    key={t.value}
                                    value={t.value}
                                    className="text-xs"
                                  >
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              className="h-7 text-xs bg-background/50 text-right"
                              type="number"
                              min={0}
                              step={0.01}
                              value={r.valor || ""}
                              onChange={(e) =>
                                updatePrevidencia(
                                  r.id,
                                  "valor",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="0,00"
                              data-ocid={`irpf.prev_valor.input.${idx + 1}`}
                            />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 hover:text-destructive"
                              onClick={() => removePrevidencia(r.id)}
                              data-ocid={`irpf.previdencia.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {deducoes.previdencia.length > 0 && (
                <div className="flex justify-end px-5 py-3 bg-muted/20 border-t border-border">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Total Previdência
                    </p>
                    <p className="text-sm font-semibold text-blue-400">
                      {fmt(totalPrevidencia)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Summary Card ── */}
            <div
              className="bg-card border border-border rounded-xl overflow-hidden"
              data-ocid="irpf.deducoes.card"
            >
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">
                  Resumo das Deduções
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Consolidado de todas as deduções da ficha
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y sm:divide-y-0 divide-border">
                <div className="px-5 py-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                    Despesas Médicas
                  </p>
                  <p className="text-lg font-bold text-blue-400 mt-1">
                    {fmt(totalMedicas)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Sem limite
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                    Educação
                  </p>
                  <p
                    className={`text-lg font-bold mt-1 ${educacaoExcedeu ? "text-orange-400" : "text-blue-400"}`}
                  >
                    {fmt(totalEducacaoLimitado)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Limite: {fmt(LIMITE_EDUCACAO)}
                    {educacaoExcedeu && (
                      <span className="text-orange-400 ml-1">• Limitado</span>
                    )}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                    Previdência
                  </p>
                  <p className="text-lg font-bold text-blue-400 mt-1">
                    {fmt(totalPrevidencia)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    INSS + PGBL
                  </p>
                </div>
                <div className="px-5 py-4 bg-accent/5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                    Total Deduções
                  </p>
                  <p className="text-lg font-bold text-accent mt-1">
                    {fmt(totalDeducoes)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Base de cálculo reduzida
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 4: Dependentes ── */}
        <TabsContent value="dependentes">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Dependentes
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cada dependente deduz R$ 2.275,08 da base de cálculo
                </p>
              </div>
              <Button
                size="sm"
                variant={showDepForm ? "secondary" : "default"}
                className="h-8 text-xs gap-1.5"
                onClick={() => {
                  setShowDepForm((v) => !v);
                  setDepForm(newDependente());
                }}
                data-ocid="irpf.dependentes.open_modal_button"
              >
                <Plus className="w-3.5 h-3.5" />
                {showDepForm ? "Cancelar" : "Adicionar Dependente"}
              </Button>
            </div>

            {/* Inline add form */}
            {showDepForm && (
              <div
                className="px-5 py-4 border-b border-border bg-accent/5"
                data-ocid="irpf.dependentes.panel"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Nome Completo *
                    </Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="Nome do dependente"
                      value={depForm.nome}
                      onChange={(e) =>
                        setDepForm((p) => ({ ...p, nome: e.target.value }))
                      }
                      data-ocid="irpf.dependentes.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">CPF</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      value={depForm.cpf}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 11);
                        if (v.length > 9)
                          v = v.replace(
                            /(\d{3})(\d{3})(\d{3})(\d{1,2})/,
                            "$1.$2.$3-$4",
                          );
                        else if (v.length > 6)
                          v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
                        else if (v.length > 3)
                          v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
                        setDepForm((p) => ({ ...p, cpf: v }));
                      }}
                      data-ocid="irpf.dependentes.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Parentesco *</Label>
                    <Select
                      value={depForm.parentesco}
                      onValueChange={(v) =>
                        setDepForm((p) => ({ ...p, parentesco: v }))
                      }
                    >
                      <SelectTrigger
                        className="h-8 text-xs"
                        data-ocid="irpf.dependentes.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PARENTESCOS.map((p) => (
                          <SelectItem
                            key={p.value}
                            value={p.value}
                            className="text-xs"
                          >
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Data de Nascimento *
                    </Label>
                    <Input
                      type="date"
                      className="h-8 text-xs"
                      value={depForm.dataNascimento}
                      onChange={(e) =>
                        setDepForm((p) => ({
                          ...p,
                          dataNascimento: e.target.value,
                        }))
                      }
                      data-ocid="irpf.dependentes.input"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Checkbox
                      id="dep-deficiencia"
                      checked={depForm.deficiencia}
                      onCheckedChange={(v) =>
                        setDepForm((p) => ({ ...p, deficiencia: !!v }))
                      }
                      data-ocid="irpf.dependentes.checkbox"
                    />
                    <Label
                      htmlFor="dep-deficiencia"
                      className="text-xs font-medium cursor-pointer"
                    >
                      Deficiência física ou mental
                    </Label>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    if (!depForm.nome.trim()) {
                      toast.error("Informe o nome do dependente.");
                      return;
                    }
                    if (!depForm.dataNascimento) {
                      toast.error("Informe a data de nascimento.");
                      return;
                    }
                    setDependentes((prev) => [
                      ...prev,
                      { ...depForm, id: crypto.randomUUID() },
                    ]);
                    setDepForm(newDependente());
                    setShowDepForm(false);
                    toast.success("Dependente adicionado.");
                  }}
                  data-ocid="irpf.dependentes.submit_button"
                >
                  Confirmar Dependente
                </Button>
              </div>
            )}

            {/* Table */}
            <Table data-ocid="irpf.dependentes.table">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Nome
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    CPF
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Parentesco
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Nascimento
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-center">
                    Def.
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                    Dedução
                  </TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {dependentes.length === 0 ? (
                  <TableRow data-ocid="irpf.dependentes.empty_state">
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-xs text-muted-foreground"
                    >
                      <Users className="w-6 h-6 mx-auto mb-2 opacity-30" />
                      Nenhum dependente cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  dependentes.map((dep, idx) => (
                    <TableRow
                      key={dep.id}
                      data-ocid={`irpf.dependentes.row.${idx + 1}`}
                      className="hover:bg-accent/5 border-border"
                    >
                      <TableCell className="py-2 text-xs font-medium">
                        {dep.nome}
                      </TableCell>
                      <TableCell className="py-2 text-xs font-mono text-muted-foreground">
                        {dep.cpf
                          ? dep.cpf.replace(
                              /(\d{3})\.?(\d{3})\.?(\d{3})-?(\d{2})/,
                              "***.$2.$3-**",
                            )
                          : "—"}
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        <Badge variant="secondary" className="text-[10px]">
                          {PARENTESCOS.find((p) => p.value === dep.parentesco)
                            ?.label ?? dep.parentesco}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        {dep.dataNascimento
                          ? new Date(
                              `${dep.dataNascimento}T12:00:00`,
                            ).toLocaleDateString("pt-BR")
                          : "—"}
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        {dep.deficiencia ? (
                          <Badge variant="outline" className="text-[10px]">
                            Sim
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-right font-semibold text-green-400">
                        {fmt(DEDUCAO_POR_DEPENDENTE)}
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setDependentes((prev) =>
                              prev.filter((d) => d.id !== dep.id),
                            );
                            toast.success("Dependente removido.");
                          }}
                          data-ocid={`irpf.dependentes.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Summary */}
            {dependentes.length > 0 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-accent/5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  <span className="text-xs font-medium text-foreground">
                    {dependentes.length} dependente
                    {dependentes.length > 1 ? "s" : ""} cadastrado
                    {dependentes.length > 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    × {fmt(DEDUCAO_POR_DEPENDENTE)} cada
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                    Dedução Total
                  </p>
                  <p className="text-base font-bold text-accent">
                    {fmt(totalDependentes)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 5: Bens e Direitos ── */}
        <TabsContent value="bens">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Bens e Direitos
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Declare os bens possuídos em 31/12 do ano anterior e atual
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setBens((p) => [...p, newBem()])}
                data-ocid="irpf.bens.add_button"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Bem
              </Button>
            </div>
            <Table data-ocid="irpf.bens.table">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-xs font-semibold text-muted-foreground w-52">
                    Código
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Discriminação
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right w-40">
                    Situação 31/12 Anterior
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right w-40">
                    Situação 31/12 Atual
                  </TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bens.length === 0 && (
                  <TableRow data-ocid="irpf.bens.empty_state">
                    <TableCell
                      colSpan={5}
                      className="text-center text-xs text-muted-foreground py-10"
                    >
                      Nenhum bem cadastrado. Clique em "Adicionar Bem" para
                      começar.
                    </TableCell>
                  </TableRow>
                )}
                {bens.map((b, idx) => (
                  <TableRow
                    key={b.id}
                    className="border-border"
                    data-ocid={`irpf.bens.item.${idx + 1}`}
                  >
                    <TableCell className="py-2">
                      <Select
                        value={b.codigo}
                        onValueChange={(v) =>
                          setBens((p) =>
                            p.map((x) =>
                              x.id === b.id ? { ...x, codigo: v } : x,
                            ),
                          )
                        }
                      >
                        <SelectTrigger className="h-7 text-xs w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CODIGOS_BENS.map((c) => (
                            <SelectItem
                              key={c.value}
                              value={c.value}
                              className="text-xs"
                            >
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        className="h-7 text-xs"
                        placeholder="Ex: Apartamento 3 quartos em São Paulo"
                        value={b.discriminacao}
                        onChange={(e) =>
                          setBens((p) =>
                            p.map((x) =>
                              x.id === b.id
                                ? { ...x, discriminacao: e.target.value }
                                : x,
                            ),
                          )
                        }
                        data-ocid="irpf.bens.discriminacao.input"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        className="h-7 text-xs text-right"
                        type="number"
                        min={0}
                        step={0.01}
                        value={b.situacaoAnterior || ""}
                        onChange={(e) =>
                          setBens((p) =>
                            p.map((x) =>
                              x.id === b.id
                                ? {
                                    ...x,
                                    situacaoAnterior:
                                      Number.parseFloat(e.target.value) || 0,
                                  }
                                : x,
                            ),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        className="h-7 text-xs text-right"
                        type="number"
                        min={0}
                        step={0.01}
                        value={b.situacaoAtual || ""}
                        onChange={(e) =>
                          setBens((p) =>
                            p.map((x) =>
                              x.id === b.id
                                ? {
                                    ...x,
                                    situacaoAtual:
                                      Number.parseFloat(e.target.value) || 0,
                                  }
                                : x,
                            ),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() =>
                          setBens((p) => p.filter((x) => x.id !== b.id))
                        }
                        data-ocid={`irpf.bens.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {bens.length > 0 && (
                  <TableRow className="bg-muted/20 border-border font-semibold">
                    <TableCell
                      colSpan={2}
                      className="text-xs text-muted-foreground py-2"
                    >
                      Total de Bens
                    </TableCell>
                    <TableCell className="text-xs text-right py-2">
                      {fmt(bens.reduce((s, b) => s + b.situacaoAnterior, 0))}
                    </TableCell>
                    <TableCell className="text-xs text-right py-2">
                      {fmt(bens.reduce((s, b) => s + b.situacaoAtual, 0))}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Tab 6: Dívidas e Ônus ── */}
        <TabsContent value="dividas">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Dívidas e Ônus Reais
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Declare dívidas e ônus com valor superior a R$ 5.000,00
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setDividas((p) => [...p, newDivida()])}
                data-ocid="irpf.dividas.add_button"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Dívida
              </Button>
            </div>
            <Table data-ocid="irpf.dividas.table">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-xs font-semibold text-muted-foreground w-48">
                    Código
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Credor
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground w-40">
                    CPF/CNPJ do Credor
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right w-36">
                    Valor (R$)
                  </TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {dividas.length === 0 && (
                  <TableRow data-ocid="irpf.dividas.empty_state">
                    <TableCell
                      colSpan={5}
                      className="text-center text-xs text-muted-foreground py-10"
                    >
                      Nenhuma dívida cadastrada. Clique em "Adicionar Dívida"
                      para começar.
                    </TableCell>
                  </TableRow>
                )}
                {dividas.map((d, idx) => (
                  <TableRow
                    key={d.id}
                    className="border-border"
                    data-ocid={`irpf.dividas.item.${idx + 1}`}
                  >
                    <TableCell className="py-2">
                      <Select
                        value={d.codigo}
                        onValueChange={(v) =>
                          setDividas((p) =>
                            p.map((x) =>
                              x.id === d.id ? { ...x, codigo: v } : x,
                            ),
                          )
                        }
                      >
                        <SelectTrigger className="h-7 text-xs w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CODIGOS_DIVIDAS.map((c) => (
                            <SelectItem
                              key={c.value}
                              value={c.value}
                              className="text-xs"
                            >
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        className="h-7 text-xs"
                        placeholder="Nome do credor"
                        value={d.credor}
                        onChange={(e) =>
                          setDividas((p) =>
                            p.map((x) =>
                              x.id === d.id
                                ? { ...x, credor: e.target.value }
                                : x,
                            ),
                          )
                        }
                        data-ocid="irpf.dividas.credor.input"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        className="h-7 text-xs"
                        placeholder="000.000.000-00"
                        value={d.cpfCnpj}
                        onChange={(e) =>
                          setDividas((p) =>
                            p.map((x) =>
                              x.id === d.id
                                ? { ...x, cpfCnpj: e.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        className="h-7 text-xs text-right"
                        type="number"
                        min={0}
                        step={0.01}
                        value={d.valor || ""}
                        onChange={(e) =>
                          setDividas((p) =>
                            p.map((x) =>
                              x.id === d.id
                                ? {
                                    ...x,
                                    valor:
                                      Number.parseFloat(e.target.value) || 0,
                                  }
                                : x,
                            ),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() =>
                          setDividas((p) => p.filter((x) => x.id !== d.id))
                        }
                        data-ocid={`irpf.dividas.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {dividas.length > 0 && (
                  <TableRow className="bg-muted/20 border-border font-semibold">
                    <TableCell
                      colSpan={3}
                      className="text-xs text-muted-foreground py-2"
                    >
                      Total de Dívidas
                    </TableCell>
                    <TableCell className="text-xs text-right py-2 text-destructive">
                      {fmt(dividas.reduce((s, d) => s + d.valor, 0))}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Tab 7: Cálculo IR ── */}
        <TabsContent value="calculo">
          {(() => {
            const baseCalculo = Math.max(
              0,
              totalTributavel.bruto - totalDeducoes,
            );
            const {
              aliquota,
              parcela,
              irDevido,
              label: faixaLabel,
            } = calcularIR(baseCalculo);
            const saldo = irDevido - irRetidoFonte;
            const isRestituicao = saldo < 0;
            const issues: { msg: string; nivel: "alerta" | "critico" }[] = [];
            if (tributaveis.length === 0 && totalDeducoes > 0)
              issues.push({
                msg: "Deduções preenchidas mas rendimentos tributáveis estão zerados.",
                nivel: "critico",
              });
            if (irRetidoFonte > irDevido && irDevido > 0)
              issues.push({
                msg: `IR retido na fonte (${fmt(irRetidoFonte)}) maior que IR devido (${fmt(irDevido)}) — verifique os valores.`,
                nivel: "alerta",
              });
            for (const b of bens) {
              if (!b.discriminacao.trim())
                issues.push({
                  msg: `Bem com código ${b.codigo} sem discriminação preenchida.`,
                  nivel: "alerta",
                });
            }
            if (
              totalTributavel.bruto > 0 &&
              totalTributavel.ir > 0 &&
              Math.abs(irRetidoFonte - totalTributavel.ir) > 1
            )
              issues.push({
                msg: `IR retido informado (${fmt(irRetidoFonte)}) difere do total retido nos rendimentos (${fmt(totalTributavel.ir)}). Verifique.`,
                nivel: "alerta",
              });
            return (
              <div className="space-y-4">
                {/* Summary Card */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">
                      Resumo do Cálculo
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Com base nas fichas preenchidas — ano-calendário {ano}
                    </p>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">
                        Rendimentos Tributáveis (bruto)
                      </span>
                      <span className="text-sm font-medium">
                        {fmt(totalTributavel.bruto)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <div>
                        <span className="text-sm text-muted-foreground">
                          (-) Total de Deduções
                        </span>
                        <div className="text-xs text-muted-foreground/60 mt-0.5 space-y-0.5">
                          <div>
                            Médicas: {fmt(totalMedicas)} · Educação:{" "}
                            {fmt(totalEducacaoLimitado)}
                            {educacaoExcedeu ? " (limitado)" : ""} ·
                            Previdência: {fmt(totalPrevidencia)} · Dependentes (
                            {dependentes.length}×): {fmt(totalDependentes)}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-red-400">
                        - {fmt(totalDeducoes)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/50 bg-muted/10 px-3 rounded-lg">
                      <span className="text-sm font-semibold text-foreground">
                        (=) Base de Cálculo
                      </span>
                      <span className="text-sm font-bold">
                        {fmt(baseCalculo)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Alíquota Aplicável
                        </span>
                        <p className="text-xs text-muted-foreground/60">
                          Faixa: {faixaLabel} · Parcela a deduzir:{" "}
                          {fmt(parcela)}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        {(aliquota * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">
                        IR Devido (Base × Alíquota − Parcela)
                      </span>
                      <span className="text-sm font-medium">
                        {fmt(irDevido)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          (-) IR Retido na Fonte
                        </span>
                        <Input
                          className="h-7 w-36 text-xs text-right"
                          type="number"
                          min={0}
                          step={0.01}
                          value={irRetidoFonte || ""}
                          placeholder="0,00"
                          onChange={(e) =>
                            setIrRetidoFonte(
                              Number.parseFloat(e.target.value) || 0,
                            )
                          }
                          data-ocid="irpf.ir_retido.input"
                        />
                      </div>
                      <span className="text-sm font-medium text-red-400">
                        - {fmt(irRetidoFonte)}
                      </span>
                    </div>
                    <div
                      className={`flex items-center justify-between py-3 px-4 rounded-xl border-2 ${isRestituicao ? "border-green-500/40 bg-green-500/10" : saldo > 0 ? "border-red-500/40 bg-red-500/10" : "border-border bg-muted/20"}`}
                      data-ocid="irpf.saldo_final.card"
                    >
                      <span
                        className={`text-base font-bold ${isRestituicao ? "text-green-400" : saldo > 0 ? "text-red-400" : "text-muted-foreground"}`}
                      >
                        {isRestituicao
                          ? "✓ IR a RESTITUIR"
                          : saldo > 0
                            ? "⚠ IR a PAGAR"
                            : "Sem imposto a pagar"}
                      </span>
                      <span
                        className={`text-xl font-extrabold ${isRestituicao ? "text-green-400" : saldo > 0 ? "text-red-400" : "text-foreground"}`}
                      >
                        {fmt(Math.abs(saldo))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabela IR 2024 */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Tabela Progressiva IRPF 2024
                    </h4>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="text-xs font-semibold text-muted-foreground">
                          Base de Cálculo (mensal)
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                          Alíquota
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                          Parcela a Deduzir
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        {
                          faixa: "Até R$ 2.259,20",
                          aliquota: "Isento",
                          parcela: "-",
                        },
                        {
                          faixa: "R$ 2.259,21 a R$ 2.826,65",
                          aliquota: "7,5%",
                          parcela: "R$ 169,44",
                        },
                        {
                          faixa: "R$ 2.826,66 a R$ 3.751,05",
                          aliquota: "15%",
                          parcela: "R$ 381,44",
                        },
                        {
                          faixa: "R$ 3.751,06 a R$ 4.664,68",
                          aliquota: "22,5%",
                          parcela: "R$ 662,77",
                        },
                        {
                          faixa: "Acima de R$ 4.664,68",
                          aliquota: "27,5%",
                          parcela: "R$ 896,00",
                        },
                      ].map((row, i) => (
                        <TableRow
                          key={row.faixa}
                          className={`border-border ${baseCalculo > 0 && FAIXAS_IR[i].aliquota === aliquota ? "bg-accent/10" : ""}`}
                        >
                          <TableCell className="text-xs py-2">
                            {row.faixa}
                          </TableCell>
                          <TableCell className="text-xs py-2 text-right font-medium">
                            {row.aliquota}
                          </TableCell>
                          <TableCell className="text-xs py-2 text-right">
                            {row.parcela}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Inconsistências */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Verificação de Inconsistências
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Analisa a declaração em busca de inconsistências e
                        alertas
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => {
                        setInconsistencias(issues);
                        setShowInconsistencias(true);
                      }}
                      data-ocid="irpf.verificar.button"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Detectar
                      Inconsistências
                    </Button>
                  </div>
                  {showInconsistencias && (
                    <div
                      className="p-5 space-y-2"
                      data-ocid="irpf.inconsistencias.panel"
                    >
                      {inconsistencias.length === 0 ? (
                        <div
                          className="flex items-center gap-2 text-green-400 text-sm py-2"
                          data-ocid="irpf.inconsistencias.success_state"
                        >
                          <span className="text-lg">✓</span>
                          <span>
                            Nenhuma inconsistência encontrada. Declaração
                            aparenta estar correta.
                          </span>
                        </div>
                      ) : (
                        inconsistencias.map((inc, i) => (
                          <div
                            key={inc.msg}
                            className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${inc.nivel === "critico" ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"}`}
                            data-ocid={`irpf.inconsistencia.item.${i + 1}`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-semibold uppercase tracking-wide mr-1">
                                [{inc.nivel}]
                              </span>
                              {inc.msg}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </TabsContent>
        <TabsContent value="exportar">
          {(() => {
            const baseCalculo = Math.max(
              0,
              totalTributavel.bruto - totalDeducoes,
            );
            const { irDevido } = calcularIR(baseCalculo / 12);
            const saldo = irDevido * 12 - irRetidoFonte;
            const isRestituicao = saldo < 0;
            const clienteAtual = clientes.find((c) => c.id === clienteId);

            async function gerarHashConteudo(texto: string): Promise<string> {
              const encoder = new TextEncoder();
              const data = encoder.encode(texto);
              const hashBuffer = await crypto.subtle.digest("SHA-256", data);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              return hashArray
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
            }

            function maskCpf(cpf: string) {
              if (!cpf) return "***.***.***/****";
              return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "***..-**");
            }

            async function exportarPDF() {
              const hash = await gerarHashConteudo(
                JSON.stringify({
                  clienteId,
                  ano,
                  tributaveis,
                  isentos,
                  deducoes,
                  dependentes,
                  bens,
                  dividas,
                }),
              );

              const printDiv = document.createElement("div");
              printDiv.style.cssText =
                "position:fixed;top:-9999px;left:-9999px;width:210mm;padding:20mm;background:white;color:black;font-family:Arial,sans-serif;font-size:11pt;";
              printDiv.innerHTML = `
                <h1 style="text-align:center;font-size:16pt;margin-bottom:4px">DECLARAÇÃO DE IMPOSTO DE RENDA - PESSOA FÍSICA</h1>
                <p style="text-align:center;font-size:10pt;color:#555;margin-bottom:20px">Ano-Calendário: ${ano} | Gerado em: ${new Date().toLocaleString("pt-BR")}</p>
                <hr style="border:1px solid #ccc;margin-bottom:16px"/>
                <h2 style="font-size:12pt;margin-bottom:8px">IDENTIFICAÇÃO DO DECLARANTE</h2>
                <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
                  <tr><td style="padding:4px;width:40%;font-weight:bold">Nome:</td><td style="padding:4px">${clienteAtual?.name ?? "Não identificado"}</td></tr>
                  <tr><td style="padding:4px;font-weight:bold">CPF:</td><td style="padding:4px">${maskCpf(clienteAtual?.cnpj ?? "")}</td></tr>
                  <tr><td style="padding:4px;font-weight:bold">Ano-Calendário:</td><td style="padding:4px">${ano}</td></tr>
                </table>
                <h2 style="font-size:12pt;margin-bottom:8px">RENDIMENTOS TRIBUTÁVEIS</h2>
                <table style="width:100%;border-collapse:collapse;border:1px solid #ccc;margin-bottom:16px">
                  <thead><tr style="background:#f0f0f0"><th style="padding:6px;border:1px solid #ccc;text-align:left">Fonte Pagadora</th><th style="padding:6px;border:1px solid #ccc;text-align:right">Rendimento Bruto</th><th style="padding:6px;border:1px solid #ccc;text-align:right">IR Retido</th></tr></thead>
                  <tbody>${tributaveis.map((r) => `<tr><td style="padding:6px;border:1px solid #ccc">${r.fontePagadora}</td><td style="padding:6px;border:1px solid #ccc;text-align:right">${fmt(r.rendimentoBruto)}</td><td style="padding:6px;border:1px solid #ccc;text-align:right">${fmt(r.irRetido)}</td></tr>`).join("")}</tbody>
                  <tfoot><tr style="background:#f5f5f5;font-weight:bold"><td style="padding:6px;border:1px solid #ccc">TOTAL</td><td style="padding:6px;border:1px solid #ccc;text-align:right">${fmt(totalTributavel.bruto)}</td><td style="padding:6px;border:1px solid #ccc;text-align:right">${fmt(totalTributavel.ir)}</td></tr></tfoot>
                </table>
                <h2 style="font-size:12pt;margin-bottom:8px">DEDUÇÕES</h2>
                <table style="width:100%;border-collapse:collapse;border:1px solid #ccc;margin-bottom:16px">
                  <tbody>
                    <tr><td style="padding:6px;border:1px solid #ccc">Despesas Médicas</td><td style="padding:6px;border:1px solid #ccc;text-align:right">${fmt(totalMedicas)}</td></tr>
                    <tr><td style="padding:6px;border:1px solid #ccc">Educação (limitado)</td><td style="padding:6px;border:1px solid #ccc;text-align:right">${fmt(totalEducacaoLimitado)}</td></tr>
                    <tr><td style="padding:6px;border:1px solid #ccc">Previdência</td><td style="padding:6px;border:1px solid #ccc;text-align:right">${fmt(totalPrevidencia)}</td></tr>
                    <tr><td style="padding:6px;border:1px solid #ccc">Dependentes (${dependentes.length} × R$ 2.275,08)</td><td style="padding:6px;border:1px solid #ccc;text-align:right">${fmt(totalDependentes)}</td></tr>
                    <tr style="font-weight:bold"><td style="padding:6px;border:1px solid #ccc">TOTAL DEDUÇÕES</td><td style="padding:6px;border:1px solid #ccc;text-align:right">${fmt(totalDeducoes)}</td></tr>
                  </tbody>
                </table>
                <h2 style="font-size:12pt;margin-bottom:8px">RESULTADO FINAL</h2>
                <table style="width:100%;border-collapse:collapse;border:1px solid #ccc;margin-bottom:24px">
                  <tbody>
                    <tr><td style="padding:6px;border:1px solid #ccc">Rendimentos Tributáveis</td><td style="padding:6px;border:1px solid #ccc;text-align:right">${fmt(totalTributavel.bruto)}</td></tr>
                    <tr><td style="padding:6px;border:1px solid #ccc">(-) Total de Deduções</td><td style="padding:6px;border:1px solid #ccc;text-align:right">${fmt(totalDeducoes)}</td></tr>
                    <tr><td style="padding:6px;border:1px solid #ccc">Base de Cálculo Anual</td><td style="padding:6px;border:1px solid #ccc;text-align:right">${fmt(baseCalculo)}</td></tr>
                    <tr><td style="padding:6px;border:1px solid #ccc">IR Devido</td><td style="padding:6px;border:1px solid #ccc;text-align:right">${fmt(irDevido * 12)}</td></tr>
                    <tr><td style="padding:6px;border:1px solid #ccc">(-) IR Retido na Fonte</td><td style="padding:6px;border:1px solid #ccc;text-align:right">${fmt(irRetidoFonte)}</td></tr>
                    <tr style="font-weight:bold;background:${isRestituicao ? "#e8f5e9" : "#ffebee"}"><td style="padding:8px;border:1px solid #ccc">${isRestituicao ? "IR A RESTITUIR" : "IR A PAGAR"}</td><td style="padding:8px;border:1px solid #ccc;text-align:right">${fmt(Math.abs(saldo))}</td></tr>
                  </tbody>
                </table>
                <hr style="border:1px solid #ccc;margin-bottom:12px"/>
                <p style="font-size:8pt;color:#888;font-family:monospace">🔒 HASH DE INTEGRIDADE SHA-256: ${hash}</p>
                <p style="font-size:8pt;color:#888">Documento gerado pelo ContaFácil ERP — www.contafacil.com.br</p>
              `;
              document.body.appendChild(printDiv);
              window.print();
              document.body.removeChild(printDiv);
            }

            function exportarWord() {
              const clienteAtual2 = clientes.find((c) => c.id === clienteId);
              const linhas: string[] = [];
              linhas.push("DECLARAÇÃO DE IMPOSTO DE RENDA - PESSOA FÍSICA");
              linhas.push(`Ano-Calendário: ${ano}`);
              linhas.push(`Gerado em: ${new Date().toLocaleString("pt-BR")}`);
              linhas.push("");
              linhas.push("=== IDENTIFICAÇÃO DO DECLARANTE ===");
              linhas.push(`Nome: ${clienteAtual2?.name ?? "Não identificado"}`);
              linhas.push(`CPF: ${maskCpf(clienteAtual2?.cnpj ?? "")}`);
              linhas.push("");
              linhas.push("=== RENDIMENTOS TRIBUTÁVEIS ===");
              for (const r of tributaveis) {
                linhas.push(
                  `  ${r.fontePagadora}: ${fmt(r.rendimentoBruto)} (IR Retido: ${fmt(r.irRetido)})`,
                );
              }
              linhas.push(
                `  Total Bruto: ${fmt(totalTributavel.bruto)} | Total IR Retido: ${fmt(totalTributavel.ir)}`,
              );
              linhas.push("");
              linhas.push("=== RENDIMENTOS ISENTOS ===");
              for (const r of isentos) {
                linhas.push(`  ${r.descricao}: ${fmt(r.valor)}`);
              }
              linhas.push(`  Total Isentos: ${fmt(totalIsento)}`);
              linhas.push("");
              linhas.push("=== DEDUÇÕES ===");
              linhas.push(`  Despesas Médicas: ${fmt(totalMedicas)}`);
              linhas.push(
                `  Educação (limitado R$ 3.561,50): ${fmt(totalEducacaoLimitado)}`,
              );
              linhas.push(`  Previdência: ${fmt(totalPrevidencia)}`);
              linhas.push(
                `  Dependentes (${dependentes.length}): ${fmt(totalDependentes)}`,
              );
              linhas.push(`  TOTAL DEDUÇÕES: ${fmt(totalDeducoes)}`);
              linhas.push("");
              linhas.push("=== BENS E DIREITOS ===");
              for (const b of bens) {
                linhas.push(
                  `  [${b.codigo}] ${b.discriminacao}: Anterior ${fmt(b.situacaoAnterior)} | Atual ${fmt(b.situacaoAtual)}`,
                );
              }
              linhas.push("");
              linhas.push("=== DÍVIDAS E ÔNUS ===");
              for (const d of dividas) {
                linhas.push(
                  `  [${d.codigo}] ${d.credor} (${d.cpfCnpj}): ${fmt(d.valor)}`,
                );
              }
              linhas.push("");
              linhas.push("=== RESULTADO FINAL ===");
              linhas.push(
                `  Rendimentos Tributáveis: ${fmt(totalTributavel.bruto)}`,
              );
              linhas.push(`  (-) Deduções: ${fmt(totalDeducoes)}`);
              linhas.push(`  Base de Cálculo Anual: ${fmt(baseCalculo)}`);
              linhas.push(`  IR Devido: ${fmt(irDevido * 12)}`);
              linhas.push(`  (-) IR Retido na Fonte: ${fmt(irRetidoFonte)}`);
              linhas.push(
                `  ${isRestituicao ? "IR A RESTITUIR" : "IR A PAGAR"}: ${fmt(Math.abs(saldo))}`,
              );
              linhas.push("");
              linhas.push("------ VERIFICAÇÃO DE INTEGRIDADE ------");
              linhas.push("Hash SHA-256 disponível na versão PDF.");
              linhas.push("Documento gerado pelo ContaFácil ERP.");

              const blob = new Blob([linhas.join("\n")], {
                type: "application/msword",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `IRPF_${clienteAtual2?.name?.replace(/\s+/g, "_") ?? "declaracao"}_${ano}.doc`;
              a.click();
              URL.revokeObjectURL(url);
            }

            const issues: { msg: string; nivel: "alerta" | "critico" }[] = [];
            if (totalTributavel.bruto > 0 && totalTributavel.ir === 0) {
              issues.push({
                msg: "Rendimentos tributáveis declarados sem IR retido na fonte.",
                nivel: "alerta",
              });
            }
            if (
              totalDeducoes > totalTributavel.bruto &&
              totalTributavel.bruto > 0
            ) {
              issues.push({
                msg: "Deduções excedem os rendimentos tributáveis — verifique os valores.",
                nivel: "critico",
              });
            }
            if (dependentes.length > 0 && totalDependentes === 0) {
              issues.push({
                msg: "Dependentes cadastrados sem dedução por dependente calculada.",
                nivel: "alerta",
              });
            }
            if (tributaveis.length === 0 && isentos.length === 0) {
              issues.push({
                msg: "Nenhum rendimento declarado. A declaração pode estar incompleta.",
                nivel: "alerta",
              });
            }

            return (
              <div className="space-y-6">
                {/* Summary Card */}
                <div
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  data-ocid="irpf.exportar.section"
                >
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Rendimentos Tributáveis
                    </p>
                    <p className="text-base font-bold text-foreground mt-1">
                      {fmt(totalTributavel.bruto)}
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Total de Deduções
                    </p>
                    <p className="text-base font-bold text-blue-400 mt-1">
                      {fmt(totalDeducoes)}
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Base de Cálculo Anual
                    </p>
                    <p className="text-base font-bold text-foreground mt-1">
                      {fmt(baseCalculo)}
                    </p>
                  </div>
                  <div
                    className={`bg-card border rounded-xl p-4 text-center ${isRestituicao ? "border-green-500/40" : saldo > 0 ? "border-red-500/40" : "border-border"}`}
                  >
                    <p className="text-xs text-muted-foreground">
                      {isRestituicao
                        ? "IR a Restituir"
                        : saldo > 0
                          ? "IR a Pagar"
                          : "Resultado"}
                    </p>
                    <p
                      className={`text-base font-bold mt-1 ${isRestituicao ? "text-green-400" : saldo > 0 ? "text-red-400" : "text-muted-foreground"}`}
                    >
                      {fmt(Math.abs(saldo))}
                    </p>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">
                      Exportar Declaração
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Gera relatório completo com todas as fichas e hash de
                      integridade SHA-256
                    </p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={exportarPDF}
                        className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                        data-ocid="irpf.exportar_pdf.button"
                      >
                        <FileDown className="w-4 h-4" /> Exportar PDF
                      </Button>
                      <Button
                        onClick={exportarWord}
                        variant="outline"
                        className="gap-2"
                        data-ocid="irpf.exportar_word.button"
                      >
                        <Download className="w-4 h-4" /> Exportar Word (.doc)
                      </Button>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-foreground">
                          Hash SHA-256 incluído:
                        </span>{" "}
                        O PDF gerado contém um hash criptográfico único da
                        declaração, permitindo verificar a autenticidade do
                        documento.
                      </div>
                    </div>
                  </div>
                </div>

                {/* What's included */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">
                      O que está incluído no documento
                    </h3>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        {
                          label: "Identificação do Declarante",
                          count: "Nome, CPF (mascarado), Ano",
                        },
                        {
                          label: "Rendimentos Tributáveis",
                          count: `${tributaveis.length} registro(s)`,
                        },
                        {
                          label: "Rendimentos Isentos",
                          count: `${isentos.length} registro(s)`,
                        },
                        {
                          label: "Deduções",
                          count: "Médicas, Educação, Previdência",
                        },
                        {
                          label: "Dependentes",
                          count: `${dependentes.length} dependente(s)`,
                        },
                        {
                          label: "Bens e Direitos",
                          count: `${bens.length} bem(ns)`,
                        },
                        {
                          label: "Dívidas e Ônus",
                          count: `${dividas.length} dívida(s)`,
                        },
                        {
                          label: "Resultado Final",
                          count: isRestituicao
                            ? "Restituição"
                            : saldo > 0
                              ? "Imposto a pagar"
                              : "Sem imposto",
                        },
                        {
                          label: "Hash SHA-256",
                          count: "Verificação de integridade",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-start gap-2 p-3 rounded-lg bg-muted/20 border border-border/50"
                        >
                          <span className="text-green-400 text-sm">✓</span>
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              {item.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.count}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Inconsistency check */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Verificação Final antes de Exportar
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Detecta inconsistências na declaração
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => {
                        setInconsistencias(issues);
                        setShowInconsistencias(true);
                      }}
                      data-ocid="irpf.exportar_verificar.button"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Verificar Agora
                    </Button>
                  </div>
                  {issues.length > 0 && (
                    <div
                      className="p-4"
                      data-ocid="irpf.exportar.inconsistencias.panel"
                    >
                      <p className="text-xs font-semibold text-yellow-400 mb-3">
                        ⚠ {issues.length} alerta(s) encontrado(s) — revise antes
                        de exportar
                      </p>
                      <div className="space-y-2">
                        {issues.map((inc, i) => (
                          <div
                            key={inc.msg}
                            className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${inc.nivel === "critico" ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"}`}
                            data-ocid={`irpf.exportar.inconsistencia.item.${i + 1}`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>{inc.msg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {issues.length === 0 && (
                    <div
                      className="p-4 flex items-center gap-2 text-green-400 text-sm"
                      data-ocid="irpf.exportar.success_state"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        Declaração sem inconsistências detectadas. Pronta para
                        exportar.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
