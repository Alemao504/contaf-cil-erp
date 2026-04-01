import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, BarChart3, Bot, Clock, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const rankingData = [
  {
    id: 1,
    nome: "Construtora Horizonte S.A.",
    cnpj: "23.456.789/0001-01",
    regime: "LR",
    documentos: 284,
    status: "Em dia",
    ultimaAtividade: "28/03/2026",
  },
  {
    id: 2,
    nome: "Metalúrgica Peças & Cia S.A.",
    cnpj: "90.123.456/0001-78",
    regime: "LR",
    documentos: 231,
    status: "Em dia",
    ultimaAtividade: "27/03/2026",
  },
  {
    id: 3,
    nome: "Agropecuária Vale Verde Ltda",
    cnpj: "56.789.012/0001-34",
    regime: "LR",
    documentos: 198,
    status: "Pendente",
    ultimaAtividade: "25/03/2026",
  },
  {
    id: 4,
    nome: "Distribuidora Norte Atacado Ltda",
    cnpj: "78.901.234/0001-56",
    regime: "LP",
    documentos: 167,
    status: "Pendente",
    ultimaAtividade: "20/03/2026",
  },
  {
    id: 5,
    nome: "Clínica Saúde & Vida Ltda",
    cnpj: "34.567.890/0001-12",
    regime: "LP",
    documentos: 143,
    status: "Em dia",
    ultimaAtividade: "28/03/2026",
  },
  {
    id: 6,
    nome: "Advocacia Martins & Associados",
    cnpj: "01.234.567/0001-89",
    regime: "LP",
    documentos: 98,
    status: "Atrasado",
    ultimaAtividade: "15/03/2026",
  },
  {
    id: 7,
    nome: "Tech Inovação Sistemas ME",
    cnpj: "45.678.901/0001-23",
    regime: "SN",
    documentos: 87,
    status: "Em dia",
    ultimaAtividade: "27/03/2026",
  },
  {
    id: 8,
    nome: "Panificadora Pão Quente Ltda",
    cnpj: "12.345.678/0001-90",
    regime: "SN",
    documentos: 76,
    status: "Em dia",
    ultimaAtividade: "26/03/2026",
  },
];

const monthlyData = [
  { mes: "Out", documentos: 284 },
  { mes: "Nov", documentos: 312 },
  { mes: "Dez", documentos: 398 },
  { mes: "Jan", documentos: 267 },
  { mes: "Fev", documentos: 341 },
  { mes: "Mar", documentos: 245 },
];

const pieData = [
  { name: "Simples Nacional", value: 112, color: "#22c55e" },
  { name: "Lucro Presumido", value: 58, color: "#3b82f6" },
  { name: "Lucro Real", value: 37, color: "#a855f7" },
];

const alertas = [
  {
    cliente: "Distribuidora Norte Atacado Ltda",
    pendencia: "SPED Fiscal EFD vence em 2 dias",
    urgencia: "crítico",
  },
  {
    cliente: "Advocacia Martins & Associados",
    pendencia: "DCTFWeb — pagamento atrasado 13 dias",
    urgencia: "atrasado",
  },
  {
    cliente: "Agropecuária Vale Verde Ltda",
    pendencia: "DAS Simples Nacional vence em 4 dias",
    urgencia: "urgente",
  },
  {
    cliente: "Escola Aprender Mais Eireli",
    pendencia: "Folha de pagamento — documentos faltando",
    urgencia: "urgente",
  },
  {
    cliente: "Restaurante Sabor Mineiro ME",
    pendencia: "IRPJ trimestral vence em 6 dias",
    urgencia: "alerta",
  },
];

const statusBadge = (status: string) => {
  if (status === "Em dia")
    return (
      <Badge className="bg-green-100 text-green-700 text-[10px]">Em dia</Badge>
    );
  if (status === "Pendente")
    return (
      <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">
        Pendente
      </Badge>
    );
  return (
    <Badge className="bg-red-100 text-red-700 text-[10px]">Atrasado</Badge>
  );
};

const urgenciaBadge = (u: string) => {
  if (u === "crítico")
    return (
      <Badge className="bg-red-100 text-red-700 text-[10px]">Crítico</Badge>
    );
  if (u === "atrasado")
    return (
      <Badge className="bg-red-50 text-red-600 text-[10px]">Atrasado</Badge>
    );
  if (u === "urgente")
    return (
      <Badge className="bg-orange-100 text-orange-700 text-[10px]">
        Urgente
      </Badge>
    );
  return (
    <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">Alerta</Badge>
  );
};

export default function RelatoriosGerenciais() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Relatórios Gerenciais
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visão executiva consolidada de todos os clientes
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-ocid="relatorios.total_clientes.card">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-3xl font-bold text-foreground">207</span>
            <p className="text-[10px] text-green-600 mt-1">+12 este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Docs Processados
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-3xl font-bold text-foreground">1.847</span>
            <p className="text-[10px] text-green-600 mt-1">Março 2026</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Prazos Críticos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-3xl font-bold text-red-600">5</span>
            <p className="text-[10px] text-red-500 mt-1">Vencendo em 7 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              Automação IA
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-3xl font-bold text-foreground">94%</span>
            <p className="text-[10px] text-muted-foreground mt-1">
              dos lançamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">
              Documentos Processados — Últimos 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 11 }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar
                  dataKey="documentos"
                  fill="oklch(0.55 0.18 240)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">
              Clientes por Regime
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name.split(" ")[1]} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  fontSize={10}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="border-orange-200">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Atenção Necessária — Clientes com Prazos Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {alertas.map((a, i) => (
              <div
                key={a.cliente}
                data-ocid={`relatorios.alerta.item.${i + 1}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-xs"
              >
                <div>
                  <p className="font-medium text-foreground">{a.cliente}</p>
                  <p className="text-muted-foreground mt-0.5">{a.pendencia}</p>
                </div>
                {urgenciaBadge(a.urgencia)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ranking Table */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">
            Ranking de Clientes por Volume de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table data-ocid="relatorios.ranking.table">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs pl-4">#</TableHead>
                <TableHead className="text-xs">Cliente</TableHead>
                <TableHead className="text-xs">CNPJ</TableHead>
                <TableHead className="text-xs">Regime</TableHead>
                <TableHead className="text-xs text-right">Documentos</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Última Atividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankingData.map((r, i) => (
                <TableRow
                  key={r.id}
                  data-ocid={`relatorios.ranking.item.${i + 1}`}
                  className="text-xs"
                >
                  <TableCell className="pl-4 text-muted-foreground font-mono">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell className="text-muted-foreground font-mono">
                    {r.cnpj}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {r.regime}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {r.documentos}
                  </TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.ultimaAtividade}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
