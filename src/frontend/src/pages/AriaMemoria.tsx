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
import { Slider } from "@/components/ui/slider";
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
  BookOpen,
  Brain,
  Building2,
  Check,
  CheckCircle2,
  Database,
  FileText,
  Globe,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { deleteRecord, getAllRecords, putRecord } from "../lib/db";

interface MemoriaRegra {
  id: string;
  descricao: string;
  categoria: string;
  confianca: number;
  fonte: "manual" | "auto-aprendizado" | "importado" | "governo";
  dataCriacao: string;
  aplicacoes: number;
}

interface PerfilCliente {
  id: string;
  clienteId: string;
  clienteNome: string;
  padroes: string[];
  regime: string;
  tipoDocPrincipal: string;
  diaPagamento?: number;
  ultimaAtualizacao: string;
}

interface BaseConhecimento {
  id: string;
  nome: string;
  dataImportacao: string;
  regrasExtraidas: number;
  tamanho: string;
}

interface GovernoAlerta {
  id: string;
  mensagem: string;
  status: "pendente" | "aceito" | "ignorado";
  data: string;
  tipo: string;
}

const INITIAL_REGRAS: MemoriaRegra[] = [
  {
    id: "mem-1",
    descricao: "Posto Ipiranga",
    categoria: "Combustível / Logística",
    confianca: 97,
    fonte: "auto-aprendizado",
    dataCriacao: "2026-01-15T09:00:00Z",
    aplicacoes: 34,
  },
  {
    id: "mem-2",
    descricao: "Folha março",
    categoria: "Recursos Humanos",
    confianca: 99,
    fonte: "manual",
    dataCriacao: "2026-02-10T14:00:00Z",
    aplicacoes: 12,
  },
  {
    id: "mem-3",
    descricao: "Fatura Internet",
    categoria: "Telecom / Tecnologia",
    confianca: 92,
    fonte: "auto-aprendizado",
    dataCriacao: "2026-01-22T11:30:00Z",
    aplicacoes: 18,
  },
  {
    id: "mem-4",
    descricao: "Supermercado Atacadão",
    categoria: "Insumos / Matéria-Prima",
    confianca: 85,
    fonte: "importado",
    dataCriacao: "2026-02-28T08:00:00Z",
    aplicacoes: 7,
  },
  {
    id: "mem-5",
    descricao: "DARF Simples Nacional",
    categoria: "Impostos / Fiscal",
    confianca: 99,
    fonte: "governo",
    dataCriacao: "2026-03-01T10:00:00Z",
    aplicacoes: 45,
  },
];

const INITIAL_PERFIS: PerfilCliente[] = [
  {
    id: "perf-1",
    clienteId: "client-1",
    clienteNome: "Padaria Pão de Mel",
    padroes: [
      "Pagamentos recorrentes no dia 5",
      "Compras de insumos toda 2ª e 5ª feira",
      "Volume de NF-e acima da média em dezembro",
    ],
    regime: "Simples Nacional",
    tipoDocPrincipal: "NF-e Entrada",
    diaPagamento: 5,
    ultimaAtualizacao: "2026-03-30T08:00:00Z",
  },
  {
    id: "perf-2",
    clienteId: "client-2",
    clienteNome: "Tech Solutions SA",
    padroes: [
      "Folha de pagamento processada todo dia 30",
      "Contratos de serviço com renovação anual",
      "Alto volume de NFS-e emitidas mensalmente",
    ],
    regime: "Lucro Presumido",
    tipoDocPrincipal: "NFS-e Saída",
    diaPagamento: 30,
    ultimaAtualizacao: "2026-03-28T14:00:00Z",
  },
  {
    id: "perf-3",
    clienteId: "client-3",
    clienteNome: "Construtora Beta",
    padroes: [
      "Picos de faturamento em março e setembro",
      "Despesas com combustível acima de 15% do total",
      "Retenção de ISS em 100% das notas emitidas",
    ],
    regime: "Lucro Real",
    tipoDocPrincipal: "NF-e Saída",
    diaPagamento: 15,
    ultimaAtualizacao: "2026-03-25T09:00:00Z",
  },
];

const INITIAL_BASE: BaseConhecimento[] = [
  {
    id: "base-1",
    nome: "Tabela IRPF 2024.pdf",
    dataImportacao: "2026-01-10T08:00:00Z",
    regrasExtraidas: 12,
    tamanho: "245 KB",
  },
  {
    id: "base-2",
    nome: "NBC TG 1000.pdf",
    dataImportacao: "2026-01-15T10:00:00Z",
    regrasExtraidas: 8,
    tamanho: "1.2 MB",
  },
  {
    id: "base-3",
    nome: "CLT Atualizada 2024.pdf",
    dataImportacao: "2026-02-01T09:00:00Z",
    regrasExtraidas: 15,
    tamanho: "3.4 MB",
  },
];

const INITIAL_ALERTAS: GovernoAlerta[] = [
  {
    id: "gov-1",
    mensagem:
      "Salário mínimo 2026 alterado para R$ 1.518,00 — deseja atualizar base de conhecimento da ARIA?",
    status: "pendente",
    data: "2026-01-01T00:00:00Z",
    tipo: "Trabalhista",
  },
  {
    id: "gov-2",
    mensagem:
      "Tabela progressiva IRPF 2024 atualizada — nova faixa de isenção R$ 2.824,00",
    status: "pendente",
    data: "2026-02-15T00:00:00Z",
    tipo: "IRPF",
  },
  {
    id: "gov-3",
    mensagem: "CNPJ: novo modelo de consulta disponível via BrasilAPI v2",
    status: "pendente",
    data: "2026-03-01T00:00:00Z",
    tipo: "Infraestrutura",
  },
  {
    id: "gov-4",
    mensagem:
      "Alíquota Simples Nacional Anexo I revisada para 2026 — tabela atualizada",
    status: "pendente",
    data: "2026-03-10T00:00:00Z",
    tipo: "Simples Nacional",
  },
];

function confiancaBadge(confianca: number) {
  if (confianca >= 90)
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        {confianca}%
      </Badge>
    );
  if (confianca >= 70)
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        {confianca}%
      </Badge>
    );
  return (
    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
      {confianca}%
    </Badge>
  );
}

function fonteBadge(fonte: MemoriaRegra["fonte"]) {
  const map = {
    manual: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "auto-aprendizado": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    importado: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    governo: "bg-green-500/20 text-green-400 border-green-500/30",
  };
  const labels = {
    manual: "Manual",
    "auto-aprendizado": "Auto-aprendizado",
    importado: "Importado",
    governo: "Governo",
  };
  return <Badge className={map[fonte]}>{labels[fonte]}</Badge>;
}

export default function AriaMemoria() {
  const [regras, setRegras] = useState<MemoriaRegra[]>(INITIAL_REGRAS);
  const [perfis] = useState<PerfilCliente[]>(INITIAL_PERFIS);
  const [base, setBase] = useState<BaseConhecimento[]>(INITIAL_BASE);
  const [alertas, setAlertas] = useState<GovernoAlerta[]>(INITIAL_ALERTAS);
  const [expandedPerfil, setExpandedPerfil] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<MemoriaRegra | null>(null);
  const [form, setForm] = useState({
    descricao: "",
    categoria: "",
    confianca: 80,
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load from DB on mount
  useEffect(() => {
    getAllRecords<MemoriaRegra>("aria_memoria").then((data) => {
      if (data.length > 0) setRegras(data);
    });
  }, []);

  const salvarRegra = useCallback(async () => {
    if (!form.descricao || !form.categoria) {
      toast.error("Preencha descrição e categoria");
      return;
    }
    const regra: MemoriaRegra = editando
      ? { ...editando, ...form }
      : {
          id: `mem-${Date.now()}`,
          descricao: form.descricao,
          categoria: form.categoria,
          confianca: form.confianca,
          fonte: "manual",
          dataCriacao: new Date().toISOString(),
          aplicacoes: 0,
        };
    await putRecord("aria_memoria", regra);
    setRegras((prev) =>
      editando
        ? prev.map((r) => (r.id === regra.id ? regra : r))
        : [...prev, regra],
    );
    setDialogOpen(false);
    setEditando(null);
    setForm({ descricao: "", categoria: "", confianca: 80 });
    toast.success(
      editando ? "Regra atualizada" : "Regra adicionada à memória da ARIA",
    );
  }, [form, editando]);

  const excluirRegra = useCallback(async (id: string) => {
    await deleteRecord("aria_memoria", id);
    setRegras((prev) => prev.filter((r) => r.id !== id));
    toast.success("Regra removida da memória");
  }, []);

  const abrirEdicao = (regra: MemoriaRegra) => {
    setEditando(regra);
    setForm({
      descricao: regra.descricao,
      categoria: regra.categoria,
      confianca: regra.confianca,
    });
    setDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1800));
    const regrasCount = Math.floor(Math.random() * 15) + 3;
    const novoDoc: BaseConhecimento = {
      id: `base-${Date.now()}`,
      nome: file.name,
      dataImportacao: new Date().toISOString(),
      regrasExtraidas: regrasCount,
      tamanho:
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${(file.size / 1024).toFixed(0)} KB`,
    };
    setBase((prev) => [novoDoc, ...prev]);
    // Add simulated rules to memory
    const novaRegra: MemoriaRegra = {
      id: `mem-imp-${Date.now()}`,
      descricao: `Regras extraídas de ${file.name}`,
      categoria: "Base de Conhecimento Importada",
      confianca: 88,
      fonte: "importado",
      dataCriacao: new Date().toISOString(),
      aplicacoes: 0,
    };
    await putRecord("aria_memoria", novaRegra);
    setRegras((prev) => [novaRegra, ...prev]);
    setUploading(false);
    toast.success(
      `ARIA leu "${file.name}" e extraiu ${regrasCount} regras para a memória`,
    );
    if (fileRef.current) fileRef.current.value = "";
  };

  const aceitarAlerta = async (id: string) => {
    setAlertas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "aceito" as const } : a)),
    );
    const alerta = alertas.find((a) => a.id === id);
    if (alerta) {
      const regra: MemoriaRegra = {
        id: `mem-gov-${Date.now()}`,
        descricao: alerta.mensagem.split(" — ")[0],
        categoria: `Governo / ${alerta.tipo}`,
        confianca: 99,
        fonte: "governo",
        dataCriacao: new Date().toISOString(),
        aplicacoes: 0,
      };
      await putRecord("aria_memoria", regra);
      setRegras((prev) => [regra, ...prev]);
    }
    toast.success("ARIA atualizou sua base de conhecimento");
  };

  const ignorarAlerta = (id: string) => {
    setAlertas((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "ignorado" as const } : a,
      ),
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <Brain className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Memória da ARIA
          </h1>
          <p className="text-muted-foreground text-sm">
            Base de conhecimento, regras aprendidas e perfis de clientes
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <Sparkles className="h-3 w-3 mr-1" />
            {regras.length} regras
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Database className="h-3 w-3 mr-1" />
            {base.length} docs importados
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="memoria">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="memoria" data-ocid="aria_memoria.tab">
            <Brain className="h-4 w-4 mr-2" />
            Memória
          </TabsTrigger>
          <TabsTrigger value="perfis" data-ocid="aria_perfis.tab">
            <Building2 className="h-4 w-4 mr-2" />
            Perfil de Clientes
          </TabsTrigger>
          <TabsTrigger value="base" data-ocid="aria_base.tab">
            <BookOpen className="h-4 w-4 mr-2" />
            Base de Conhecimento
          </TabsTrigger>
          <TabsTrigger value="governo" data-ocid="aria_governo.tab">
            <Globe className="h-4 w-4 mr-2" />
            Atualizações do Governo
          </TabsTrigger>
        </TabsList>

        {/* Tab: Memória */}
        <TabsContent value="memoria" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Regras de classificação aprendidas pela ARIA
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditando(null);
                    setForm({ descricao: "", categoria: "", confianca: 80 });
                  }}
                  data-ocid="aria_memoria.open_modal_button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Regra
                </Button>
              </DialogTrigger>
              <DialogContent data-ocid="aria_memoria.dialog">
                <DialogHeader>
                  <DialogTitle>
                    {editando ? "Editar Regra" : "Nova Regra de Classificação"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <Label>Descrição (termo/padrão detectado)</Label>
                    <Input
                      placeholder="Ex: Posto Ipiranga"
                      value={form.descricao}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, descricao: e.target.value }))
                      }
                      data-ocid="aria_memoria.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Categoria contábil</Label>
                    <Input
                      placeholder="Ex: Combustível / Logística"
                      value={form.categoria}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, categoria: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confiança: {form.confianca}%</Label>
                    <Slider
                      min={50}
                      max={100}
                      step={1}
                      value={[form.confianca]}
                      onValueChange={([v]) =>
                        setForm((f) => ({ ...f, confianca: v }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-ocid="aria_memoria.cancel_button"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={salvarRegra}
                    data-ocid="aria_memoria.save_button"
                  >
                    {editando ? "Salvar Alterações" : "Adicionar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table data-ocid="aria_memoria.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Confiança</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Aplicações</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regras.map((r, i) => (
                    <TableRow
                      key={r.id}
                      data-ocid={`aria_memoria.item.${i + 1}`}
                    >
                      <TableCell className="font-medium">
                        {r.descricao}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.categoria}
                      </TableCell>
                      <TableCell>{confiancaBadge(r.confianca)}</TableCell>
                      <TableCell>{fonteBadge(r.fonte)}</TableCell>
                      <TableCell>{r.aplicacoes}x</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(r.dataCriacao).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirEdicao(r)}
                            data-ocid={`aria_memoria.edit_button.${i + 1}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => excluirRegra(r.id)}
                            data-ocid={`aria_memoria.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Perfil de Clientes */}
        <TabsContent value="perfis" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {perfis.map((p, i) => (
              <Card
                key={p.id}
                className="border-border/50"
                data-ocid={`aria_perfis.item.${i + 1}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {p.clienteNome}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.regime}
                      </p>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                      {p.tipoDocPrincipal}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    {p.padroes
                      .slice(0, expandedPerfil === p.id ? undefined : 2)
                      .map((padrao) => (
                        <div
                          key={padrao}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-400 shrink-0" />
                          {padrao}
                        </div>
                      ))}
                  </div>
                  {p.padroes.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-7"
                      onClick={() =>
                        setExpandedPerfil(expandedPerfil === p.id ? null : p.id)
                      }
                      data-ocid={`aria_perfis.toggle.${i + 1}`}
                    >
                      {expandedPerfil === p.id
                        ? "Mostrar menos"
                        : `+${p.padroes.length - 2} padrões`}
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground/60">
                    Atualizado em{" "}
                    {new Date(p.ultimaAtualizacao).toLocaleDateString("pt-BR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Base de Conhecimento */}
        <TabsContent value="base" className="mt-4 space-y-4">
          {/* Upload area */}
          <Card
            className="border-dashed border-2 border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}
            data-ocid="aria_base.dropzone"
          >
            <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
              {uploading ? (
                <>
                  <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    ARIA está lendo o documento...
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground/50" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Importar lei, norma ou tabela
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF ou Word — ARIA extrai regras automaticamente
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    data-ocid="aria_base.upload_button"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar arquivo
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Imported docs list */}
          <div className="space-y-2">
            {base.map((doc, i) => (
              <Card key={doc.id} data-ocid={`aria_base.item.${i + 1}`}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <FileText className="h-8 w-8 text-orange-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Importado em{" "}
                      {new Date(doc.dataImportacao).toLocaleDateString("pt-BR")}{" "}
                      • {doc.tamanho}
                    </p>
                  </div>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 shrink-0">
                    {doc.regrasExtraidas} regras
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Atualizações do Governo */}
        <TabsContent value="governo" className="mt-4 space-y-3">
          {alertas.map((alerta, i) => (
            <Card
              key={alerta.id}
              className={`border-border/50 ${
                alerta.status === "aceito"
                  ? "opacity-70"
                  : alerta.status === "ignorado"
                    ? "opacity-40"
                    : ""
              }`}
              data-ocid={`aria_governo.item.${i + 1}`}
            >
              <CardContent className="py-4 px-4 flex items-start gap-3">
                <Globe className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                      {alerta.tipo}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alerta.data).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm">{alerta.mensagem}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {alerta.status === "pendente" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-400 border-green-500/30 hover:bg-green-500/10 h-7"
                        onClick={() => aceitarAlerta(alerta.id)}
                        data-ocid={`aria_governo.confirm_button.${i + 1}`}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7"
                        onClick={() => ignorarAlerta(alerta.id)}
                        data-ocid={`aria_governo.cancel_button.${i + 1}`}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Ignorar
                      </Button>
                    </>
                  ) : alerta.status === "aceito" ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <Check className="h-3 w-3 mr-1" /> Aplicado
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Ignorado</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
