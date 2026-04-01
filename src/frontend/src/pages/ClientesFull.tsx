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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Calculator,
  Eye,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SimuladorTabCliente } from "../components/SimuladorTabCliente";

type Regime = "SN" | "LP" | "LR";
type Status = "Ativo" | "Inativo";

interface Cliente {
  id: number;
  nome: string;
  cnpj: string;
  regime: Regime;
  responsavel: string;
  telefone: string;
  email: string;
  situacao: Status;
}

function maskCNPJ(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 1,
    nome: "Panificadora Pão Quente Ltda",
    cnpj: "12.345.678/0001-90",
    regime: "SN",
    responsavel: "Maria Silva",
    telefone: "(11) 98765-4321",
    email: "contato@paoquente.com.br",
    situacao: "Ativo",
  },
  {
    id: 2,
    nome: "Construtora Horizonte S.A.",
    cnpj: "23.456.789/0001-01",
    regime: "LR",
    responsavel: "João Mendes",
    telefone: "(11) 3344-5566",
    email: "financeiro@horizonte.com.br",
    situacao: "Ativo",
  },
  {
    id: 3,
    nome: "Clínica Saúde & Vida Ltda",
    cnpj: "34.567.890/0001-12",
    regime: "LP",
    responsavel: "Dra. Ana Costa",
    telefone: "(21) 99876-5432",
    email: "adm@saudeavida.med.br",
    situacao: "Ativo",
  },
  {
    id: 4,
    nome: "Tech Inovação Sistemas ME",
    cnpj: "45.678.901/0001-23",
    regime: "SN",
    responsavel: "Carlos Lima",
    telefone: "(41) 99123-4567",
    email: "carlos@techinova.dev",
    situacao: "Ativo",
  },
  {
    id: 5,
    nome: "Agropecuária Vale Verde Ltda",
    cnpj: "56.789.012/0001-34",
    regime: "LR",
    responsavel: "Roberto Campos",
    telefone: "(65) 98234-5678",
    email: "roberto@valeverde.agr.br",
    situacao: "Ativo",
  },
  {
    id: 6,
    nome: "Restaurante Sabor Mineiro ME",
    cnpj: "67.890.123/0001-45",
    regime: "SN",
    responsavel: "Fernanda Souza",
    telefone: "(31) 97654-3210",
    email: "fernanda@sabormineiro.com.br",
    situacao: "Ativo",
  },
  {
    id: 7,
    nome: "Distribuidora Norte Atacado Ltda",
    cnpj: "78.901.234/0001-56",
    regime: "LP",
    responsavel: "Paulo Neto",
    telefone: "(92) 98765-0001",
    email: "pneto@norteatacado.com.br",
    situacao: "Inativo",
  },
  {
    id: 8,
    nome: "Escola Aprender Mais Eireli",
    cnpj: "89.012.345/0001-67",
    regime: "SN",
    responsavel: "Luciana Torres",
    telefone: "(51) 96543-2109",
    email: "luciana@aprendermaisedu.com.br",
    situacao: "Ativo",
  },
  {
    id: 9,
    nome: "Metalúrgica Peças & Cia S.A.",
    cnpj: "90.123.456/0001-78",
    regime: "LR",
    responsavel: "Sandro Braga",
    telefone: "(47) 33221100",
    email: "sandro@pecasecia.ind.br",
    situacao: "Ativo",
  },
  {
    id: 10,
    nome: "Advocacia Martins & Associados",
    cnpj: "01.234.567/0001-89",
    regime: "LP",
    responsavel: "Dr. Henrique Martins",
    telefone: "(61) 98001-2345",
    email: "hmartins@martinsadv.com.br",
    situacao: "Ativo",
  },
];

const regimeBadge = (regime: Regime) => {
  if (regime === "SN")
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
        Simples Nacional
      </Badge>
    );
  if (regime === "LP")
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">
        Lucro Presumido
      </Badge>
    );
  return (
    <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]">
      Lucro Real
    </Badge>
  );
};

const regimeLabel = (regime: Regime) => {
  if (regime === "SN") return "Simples Nacional";
  if (regime === "LP") return "Lucro Presumido";
  return "Lucro Real";
};

export default function ClientesFull() {
  const [clientes, setClientes] = useState<Cliente[]>(INITIAL_CLIENTES);
  const [search, setSearch] = useState("");
  const [filterRegime, setFilterRegime] = useState<"todos" | Regime>("todos");
  const [filterStatus, setFilterStatus] = useState<"todos" | Status>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [simuladorCliente, setSimuladorCliente] = useState<Cliente | null>(
    null,
  );
  const [newCliente, setNewCliente] = useState({
    nome: "",
    cnpj: "",
    regime: "SN" as Regime,
    responsavel: "",
    email: "",
    telefone: "",
    endereco: "",
    observacoes: "",
  });

  const filtered = clientes.filter((c) => {
    const matchSearch =
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj.includes(search);
    const matchRegime = filterRegime === "todos" || c.regime === filterRegime;
    const matchStatus = filterStatus === "todos" || c.situacao === filterStatus;
    return matchSearch && matchRegime && matchStatus;
  });

  const counts = {
    total: clientes.length,
    sn: clientes.filter((c) => c.regime === "SN").length,
    lp: clientes.filter((c) => c.regime === "LP").length,
    lr: clientes.filter((c) => c.regime === "LR").length,
  };

  const handleSave = () => {
    if (!newCliente.nome || !newCliente.cnpj || !newCliente.responsavel) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    const id = Math.max(...clientes.map((c) => c.id)) + 1;
    setClientes((prev) => [
      ...prev,
      {
        id,
        nome: newCliente.nome,
        cnpj: newCliente.cnpj,
        regime: newCliente.regime,
        responsavel: newCliente.responsavel,
        email: newCliente.email,
        telefone: newCliente.telefone,
        situacao: "Ativo",
      },
    ]);
    toast.success("Cliente cadastrado com sucesso!");
    setDialogOpen(false);
    setNewCliente({
      nome: "",
      cnpj: "",
      regime: "SN",
      responsavel: "",
      email: "",
      telefone: "",
      endereco: "",
      observacoes: "",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestão de Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie todos os clientes e empresas contábeis
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="clientes.open_modal_button" className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" data-ocid="clientes.dialog">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs">Nome / Razão Social *</Label>
                <Input
                  data-ocid="clientes.nome.input"
                  className="h-9 text-xs mt-1"
                  placeholder="Nome da empresa"
                  value={newCliente.nome}
                  onChange={(e) =>
                    setNewCliente((p) => ({ ...p, nome: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">CNPJ *</Label>
                  <Input
                    data-ocid="clientes.cnpj.input"
                    className="h-9 text-xs mt-1"
                    placeholder="00.000.000/0000-00"
                    value={newCliente.cnpj}
                    onChange={(e) =>
                      setNewCliente((p) => ({
                        ...p,
                        cnpj: maskCNPJ(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Regime Tributário *</Label>
                  <Select
                    value={newCliente.regime}
                    onValueChange={(v) =>
                      setNewCliente((p) => ({ ...p, regime: v as Regime }))
                    }
                  >
                    <SelectTrigger
                      data-ocid="clientes.regime.select"
                      className="h-9 text-xs mt-1"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SN">Simples Nacional</SelectItem>
                      <SelectItem value="LP">Lucro Presumido</SelectItem>
                      <SelectItem value="LR">Lucro Real</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Responsável *</Label>
                <Input
                  data-ocid="clientes.responsavel.input"
                  className="h-9 text-xs mt-1"
                  placeholder="Nome do responsável"
                  value={newCliente.responsavel}
                  onChange={(e) =>
                    setNewCliente((p) => ({
                      ...p,
                      responsavel: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">E-mail</Label>
                  <Input
                    data-ocid="clientes.email.input"
                    type="email"
                    className="h-9 text-xs mt-1"
                    placeholder="email@empresa.com"
                    value={newCliente.email}
                    onChange={(e) =>
                      setNewCliente((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Telefone</Label>
                  <Input
                    data-ocid="clientes.telefone.input"
                    className="h-9 text-xs mt-1"
                    placeholder="(00) 00000-0000"
                    value={newCliente.telefone}
                    onChange={(e) =>
                      setNewCliente((p) => ({ ...p, telefone: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Endereço</Label>
                <Input
                  data-ocid="clientes.endereco.input"
                  className="h-9 text-xs mt-1"
                  placeholder="Rua, número, cidade - UF"
                  value={newCliente.endereco}
                  onChange={(e) =>
                    setNewCliente((p) => ({ ...p, endereco: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Observações</Label>
                <Textarea
                  data-ocid="clientes.observacoes.textarea"
                  className="text-xs mt-1 resize-none"
                  rows={2}
                  placeholder="Observações adicionais..."
                  value={newCliente.observacoes}
                  onChange={(e) =>
                    setNewCliente((p) => ({
                      ...p,
                      observacoes: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                data-ocid="clientes.cancel_button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                data-ocid="clientes.submit_button"
                size="sm"
                onClick={handleSave}
              >
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total de Clientes",
            value: counts.total,
            icon: Users,
            color: "text-primary",
          },
          {
            label: "Simples Nacional",
            value: counts.sn,
            icon: Users,
            color: "text-green-600",
          },
          {
            label: "Lucro Presumido",
            value: counts.lp,
            icon: Users,
            color: "text-blue-600",
          },
          {
            label: "Lucro Real",
            value: counts.lr,
            icon: Users,
            color: "text-purple-600",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="clientes.search_input"
            className="h-9 pl-9 text-xs"
            placeholder="Buscar por nome ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filterRegime}
          onValueChange={(v) => setFilterRegime(v as "todos" | Regime)}
        >
          <SelectTrigger
            data-ocid="clientes.filter_regime.select"
            className="h-9 w-44 text-xs"
          >
            <SelectValue placeholder="Regime" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os regimes</SelectItem>
            <SelectItem value="SN">Simples Nacional</SelectItem>
            <SelectItem value="LP">Lucro Presumido</SelectItem>
            <SelectItem value="LR">Lucro Real</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as "todos" | Status)}
        >
          <SelectTrigger
            data-ocid="clientes.filter_status.select"
            className="h-9 w-36 text-xs"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table data-ocid="clientes.table">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Nome / Razão Social</TableHead>
                <TableHead className="text-xs">CNPJ</TableHead>
                <TableHead className="text-xs">Regime</TableHead>
                <TableHead className="text-xs">Responsável</TableHead>
                <TableHead className="text-xs">Telefone</TableHead>
                <TableHead className="text-xs">Situação</TableHead>
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-sm text-muted-foreground py-10"
                    data-ocid="clientes.empty_state"
                  >
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((c, i) => (
                <TableRow
                  key={c.id}
                  data-ocid={`clientes.item.${i + 1}`}
                  className="text-xs"
                >
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-muted-foreground font-mono">
                    {c.cnpj}
                  </TableCell>
                  <TableCell>{regimeBadge(c.regime)}</TableCell>
                  <TableCell>{c.responsavel}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.telefone}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={c.situacao === "Ativo" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {c.situacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        data-ocid={`clientes.edit_button.${i + 1}`}
                        onClick={() => toast.info(`Editando ${c.nome}`)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        data-ocid={`clientes.view_button.${i + 1}`}
                        onClick={() => toast.info(`Visualizando ${c.nome}`)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-primary hover:text-primary"
                        data-ocid={`clientes.simular.button.${i + 1}`}
                        onClick={() => setSimuladorCliente(c)}
                      >
                        <Calculator className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Simulador Dialog */}
      <Dialog
        open={simuladorCliente !== null}
        onOpenChange={(open) => {
          if (!open) setSimuladorCliente(null);
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="clientes.simulador.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Calculator className="w-4 h-4 text-primary" />
              Simular Regime Tributário
              {simuladorCliente && (
                <span className="text-muted-foreground font-normal text-sm ml-1">
                  — {simuladorCliente.nome}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {simuladorCliente && (
            <SimuladorTabCliente
              clienteNome={simuladorCliente.nome}
              clienteCnpj={simuladorCliente.cnpj}
              regimeAtual={regimeLabel(simuladorCliente.regime)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
