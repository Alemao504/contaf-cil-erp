import ARIATogglePanel from "@/components/ARIATogglePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CloudDownload,
  FileText,
  Search,
  Upload,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type NFStatus = "Autorizada" | "Cancelada" | "Pendente";

interface NotaFiscal {
  numero: string;
  empresa: string;
  cnpj: string;
  dataEmissao: string;
  valor: number;
  status: NFStatus;
}

const statusBadge = (status: NFStatus) => {
  if (status === "Autorizada")
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
        Autorizada
      </Badge>
    );
  if (status === "Cancelada")
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
        Cancelada
      </Badge>
    );
  return (
    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[10px]">
      Pendente
    </Badge>
  );
};

const emitidas: NotaFiscal[] = [
  {
    numero: "NF-000423",
    empresa: "Panificadora Pão Quente",
    cnpj: "12.345.678/0001-90",
    dataEmissao: "28/03/2026",
    valor: 4850.0,
    status: "Autorizada",
  },
  {
    numero: "NF-000422",
    empresa: "Clínica Saúde & Vida",
    cnpj: "34.567.890/0001-12",
    dataEmissao: "27/03/2026",
    valor: 12300.5,
    status: "Autorizada",
  },
  {
    numero: "NF-000421",
    empresa: "Tech Inovação Sistemas",
    cnpj: "45.678.901/0001-23",
    dataEmissao: "25/03/2026",
    valor: 7200.0,
    status: "Autorizada",
  },
  {
    numero: "NF-000420",
    empresa: "Escola Aprender Mais",
    cnpj: "89.012.345/0001-67",
    dataEmissao: "24/03/2026",
    valor: 2100.0,
    status: "Cancelada",
  },
  {
    numero: "NF-000419",
    empresa: "Restaurante Sabor Mineiro",
    cnpj: "67.890.123/0001-45",
    dataEmissao: "22/03/2026",
    valor: 1850.75,
    status: "Autorizada",
  },
  {
    numero: "NF-000418",
    empresa: "Advocacia Martins",
    cnpj: "01.234.567/0001-89",
    dataEmissao: "20/03/2026",
    valor: 9500.0,
    status: "Pendente",
  },
  {
    numero: "NF-000417",
    empresa: "Metalúrgica Peças & Cia",
    cnpj: "90.123.456/0001-78",
    dataEmissao: "18/03/2026",
    valor: 31200.0,
    status: "Autorizada",
  },
  {
    numero: "NF-000416",
    empresa: "Construtora Horizonte",
    cnpj: "23.456.789/0001-01",
    dataEmissao: "15/03/2026",
    valor: 87500.0,
    status: "Autorizada",
  },
  {
    numero: "NF-000415",
    empresa: "Agropecuária Vale Verde",
    cnpj: "56.789.012/0001-34",
    dataEmissao: "12/03/2026",
    valor: 44300.0,
    status: "Autorizada",
  },
  {
    numero: "NF-000414",
    empresa: "Distribuidora Norte Atacado",
    cnpj: "78.901.234/0001-56",
    dataEmissao: "10/03/2026",
    valor: 23000.0,
    status: "Pendente",
  },
];

const recebidas: NotaFiscal[] = [
  {
    numero: "NFE-009871",
    empresa: "Fornecedora Alpha Ltda",
    cnpj: "55.444.333/0001-22",
    dataEmissao: "29/03/2026",
    valor: 6750.0,
    status: "Autorizada",
  },
  {
    numero: "NFE-009870",
    empresa: "Distribuidora Beta S.A.",
    cnpj: "44.333.222/0001-11",
    dataEmissao: "28/03/2026",
    valor: 3400.0,
    status: "Autorizada",
  },
  {
    numero: "NFE-009869",
    empresa: "Atacado Gama Eireli",
    cnpj: "33.222.111/0001-00",
    dataEmissao: "26/03/2026",
    valor: 15200.0,
    status: "Autorizada",
  },
  {
    numero: "NFE-009868",
    empresa: "Importadora Delta ME",
    cnpj: "22.111.000/0001-99",
    dataEmissao: "24/03/2026",
    valor: 9800.0,
    status: "Cancelada",
  },
  {
    numero: "NFE-009867",
    empresa: "Serviços Épsilon Ltda",
    cnpj: "11.000.999/0001-88",
    dataEmissao: "22/03/2026",
    valor: 4500.0,
    status: "Autorizada",
  },
  {
    numero: "NFE-009866",
    empresa: "Produtos Zeta S.A.",
    cnpj: "00.999.888/0001-77",
    dataEmissao: "20/03/2026",
    valor: 18700.0,
    status: "Pendente",
  },
  {
    numero: "NFE-009865",
    empresa: "Tecnologia Eta ME",
    cnpj: "99.888.777/0001-66",
    dataEmissao: "17/03/2026",
    valor: 7200.0,
    status: "Autorizada",
  },
  {
    numero: "NFE-009864",
    empresa: "Materiais Theta Ltda",
    cnpj: "88.777.666/0001-55",
    dataEmissao: "14/03/2026",
    valor: 2900.0,
    status: "Autorizada",
  },
  {
    numero: "NFE-009863",
    empresa: "Logística Iota S.A.",
    cnpj: "77.666.555/0001-44",
    dataEmissao: "11/03/2026",
    valor: 5600.0,
    status: "Autorizada",
  },
  {
    numero: "NFE-009862",
    empresa: "Consultoria Kappa Ltda",
    cnpj: "66.555.444/0001-33",
    dataEmissao: "08/03/2026",
    valor: 12000.0,
    status: "Autorizada",
  },
];

const nfse: NotaFiscal[] = [
  {
    numero: "NFS-003201",
    empresa: "Clínica Saúde & Vida",
    cnpj: "34.567.890/0001-12",
    dataEmissao: "28/03/2026",
    valor: 5400.0,
    status: "Autorizada",
  },
  {
    numero: "NFS-003200",
    empresa: "Tech Inovação Sistemas",
    cnpj: "45.678.901/0001-23",
    dataEmissao: "26/03/2026",
    valor: 8900.0,
    status: "Autorizada",
  },
  {
    numero: "NFS-003199",
    empresa: "Advocacia Martins",
    cnpj: "01.234.567/0001-89",
    dataEmissao: "24/03/2026",
    valor: 15000.0,
    status: "Autorizada",
  },
  {
    numero: "NFS-003198",
    empresa: "Escola Aprender Mais",
    cnpj: "89.012.345/0001-67",
    dataEmissao: "21/03/2026",
    valor: 3200.0,
    status: "Pendente",
  },
  {
    numero: "NFS-003197",
    empresa: "Consultoria Inova",
    cnpj: "33.444.555/0001-66",
    dataEmissao: "18/03/2026",
    valor: 11500.0,
    status: "Autorizada",
  },
  {
    numero: "NFS-003196",
    empresa: "Treinamento Avante ME",
    cnpj: "44.555.666/0001-77",
    dataEmissao: "15/03/2026",
    valor: 4700.0,
    status: "Cancelada",
  },
];

function NFTable({ data }: { data: NotaFiscal[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"todos" | NFStatus>("todos");

  const filtered = data.filter((nf) => {
    const matchSearch =
      nf.numero.toLowerCase().includes(search.toLowerCase()) ||
      nf.cnpj.includes(search) ||
      nf.empresa.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "todos" || nf.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-xs"
            placeholder="Buscar por número, CNPJ ou empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as "todos" | NFStatus)}
        >
          <SelectTrigger className="h-9 w-40 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="Autorizada">Autorizada</SelectItem>
            <SelectItem value="Cancelada">Cancelada</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Número</TableHead>
                <TableHead className="text-xs">Empresa</TableHead>
                <TableHead className="text-xs">CNPJ</TableHead>
                <TableHead className="text-xs">Data Emissão</TableHead>
                <TableHead className="text-xs text-right">Valor</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-sm text-muted-foreground py-8"
                    data-ocid="notas.empty_state"
                  >
                    Nenhuma nota fiscal encontrada
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((nf, i) => (
                <TableRow
                  key={nf.numero}
                  data-ocid={`notas.item.${i + 1}`}
                  className="text-xs"
                >
                  <TableCell className="font-mono font-medium">
                    {nf.numero}
                  </TableCell>
                  <TableCell>{nf.empresa}</TableCell>
                  <TableCell className="text-muted-foreground font-mono">
                    {nf.cnpj}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {nf.dataEmissao}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {nf.valor.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </TableCell>
                  <TableCell>{statusBadge(nf.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NotasFiscais() {
  const [dragging, setDragging] = useState(false);

  const totais = {
    emitidas: emitidas.length,
    recebidas: recebidas.length,
    valorTotal: [...emitidas, ...recebidas]
      .filter((n) => n.status === "Autorizada")
      .reduce((a, b) => a + b.valor, 0),
    pendentes: [...emitidas, ...recebidas, ...nfse].filter(
      (n) => n.status === "Pendente",
    ).length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notas Fiscais</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerenciamento de NF-e, NF-e recebidas e NFS-e
        </p>
      </div>

      <ARIATogglePanel
        screenName="notas-fiscais"
        toggles={[
          { key: "nfe-emitidas", label: "NF-e Emitidas" },
          { key: "nfe-recebidas", label: "NF-e Recebidas" },
          { key: "nfse", label: "NFS-e" },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-ocid="notas.emitidas.card">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5">
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              NF-e Emitidas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-3xl font-bold">{totais.emitidas}</span>
            <p className="text-[10px] text-muted-foreground mt-1">Março 2026</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5">
              <ArrowDownToLine className="w-3.5 h-3.5" />
              NF-e Recebidas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-3xl font-bold">{totais.recebidas}</span>
            <p className="text-[10px] text-muted-foreground mt-1">Março 2026</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-xl font-bold">
              {totais.valorTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              })}
            </span>
            <p className="text-[10px] text-muted-foreground mt-1">
              Autorizadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-3xl font-bold text-yellow-600">
              {totais.pendentes}
            </span>
            <p className="text-[10px] text-yellow-600 mt-1">Aguardando ação</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="emitidas">
        <TabsList className="h-9">
          <TabsTrigger
            value="emitidas"
            data-ocid="notas.emitidas.tab"
            className="text-xs"
          >
            NF-e Emitidas
          </TabsTrigger>
          <TabsTrigger
            value="recebidas"
            data-ocid="notas.recebidas.tab"
            className="text-xs"
          >
            NF-e Recebidas
          </TabsTrigger>
          <TabsTrigger
            value="nfse"
            data-ocid="notas.nfse.tab"
            className="text-xs"
          >
            NFS-e
          </TabsTrigger>
          <TabsTrigger
            value="importar"
            data-ocid="notas.importar.tab"
            className="text-xs"
          >
            Importar XML
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emitidas" className="mt-4">
          <NFTable data={emitidas} />
        </TabsContent>
        <TabsContent value="recebidas" className="mt-4">
          <NFTable data={recebidas} />
        </TabsContent>
        <TabsContent value="nfse" className="mt-4">
          <NFTable data={nfse} />
        </TabsContent>
        <TabsContent value="importar" className="mt-4">
          <div className="space-y-4">
            <div
              data-ocid="notas.dropzone"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                toast.success(
                  `${e.dataTransfer.files.length} arquivo(s) recebido(s) para processamento`,
                );
              }}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-semibold text-foreground">
                Arraste arquivos XML aqui
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                ou clique para selecionar — NF-e, NFS-e, CT-e
              </p>
              <Button
                variant="outline"
                className="mt-4"
                data-ocid="notas.upload_button"
                onClick={() => toast.info("Selecione os arquivos XML")}
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivos
              </Button>
            </div>
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="gap-2"
                data-ocid="notas.sefaz.button"
                onClick={() =>
                  toast.info("Consultando SEFAZ... (requer certificado A1/A3)")
                }
              >
                <CloudDownload className="w-4 h-4" />
                Buscar na SEFAZ
              </Button>
            </div>
            <Card className="bg-muted/30">
              <CardContent className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    A busca na SEFAZ requer certificado digital A1 ou A3
                    configurado nas{" "}
                    <span className="font-medium">
                      Configurações → Certificado Digital
                    </span>
                    . Os XMLs importados serão classificados e vinculados
                    automaticamente ao cliente correspondente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
