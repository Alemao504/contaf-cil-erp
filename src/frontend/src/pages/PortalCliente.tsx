import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  Check,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Globe,
  ImageIcon,
  Link2,
  Monitor,
  Plus,
  RefreshCw,
  Settings,
  Smartphone,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Client = {
  id: string;
  name: string;
  cnpj: string;
  portalActive: boolean;
  lastAccess: string;
  color: string;
};

type SharedDoc = {
  id: string;
  name: string;
  type: "Relatório" | "Boleto" | "DRE" | "Balancete" | "NF";
  uploadDate: string;
  viewed: boolean;
};

type AccessLog = {
  id: string;
  dateTime: string;
  document: string;
  ip: string;
  device: "Desktop" | "Mobile";
};

const INITIAL_CLIENTS: Client[] = [
  {
    id: "abc",
    name: "Empresa ABC Ltda",
    cnpj: "12.345.678/0001-90",
    portalActive: true,
    lastAccess: "30/03/2026 às 14:32",
    color: "bg-blue-600",
  },
  {
    id: "mei",
    name: "João Silva MEI",
    cnpj: "98.765.432/0001-10",
    portalActive: true,
    lastAccess: "29/03/2026 às 09:15",
    color: "bg-emerald-600",
  },
  {
    id: "xyz",
    name: "Comércio XYZ S.A.",
    cnpj: "55.444.333/0001-22",
    portalActive: false,
    lastAccess: "15/03/2026 às 16:48",
    color: "bg-violet-600",
  },
  {
    id: "nobre",
    name: "Construções Nobre",
    cnpj: "77.888.999/0001-77",
    portalActive: true,
    lastAccess: "28/03/2026 às 11:07",
    color: "bg-orange-600",
  },
];

const DOCS_BY_CLIENT: Record<string, SharedDoc[]> = {
  abc: [
    {
      id: "1",
      name: "Balancete Março/2026",
      type: "Balancete",
      uploadDate: "28/03/2026",
      viewed: true,
    },
    {
      id: "2",
      name: "DRE Fevereiro/2026",
      type: "DRE",
      uploadDate: "15/03/2026",
      viewed: true,
    },
    {
      id: "3",
      name: "Boleto FGTS Abril/2026",
      type: "Boleto",
      uploadDate: "05/03/2026",
      viewed: false,
    },
    {
      id: "4",
      name: "Relatório Fiscal Q1/2026",
      type: "Relatório",
      uploadDate: "01/04/2026",
      viewed: false,
    },
    {
      id: "5",
      name: "NF-e Compra Equipamento",
      type: "NF",
      uploadDate: "20/03/2026",
      viewed: true,
    },
    {
      id: "6",
      name: "Balanço Patrimonial 2025",
      type: "Relatório",
      uploadDate: "10/02/2026",
      viewed: true,
    },
  ],
  mei: [
    {
      id: "1",
      name: "DAS Março/2026",
      type: "Boleto",
      uploadDate: "10/03/2026",
      viewed: true,
    },
    {
      id: "2",
      name: "DRE Anual 2025",
      type: "DRE",
      uploadDate: "20/01/2026",
      viewed: false,
    },
    {
      id: "3",
      name: "Relatório Simples Nacional",
      type: "Relatório",
      uploadDate: "15/03/2026",
      viewed: false,
    },
    {
      id: "4",
      name: "Balancete Fevereiro/2026",
      type: "Balancete",
      uploadDate: "05/03/2026",
      viewed: true,
    },
    {
      id: "5",
      name: "NF-e Prestação de Serviço",
      type: "NF",
      uploadDate: "25/03/2026",
      viewed: true,
    },
  ],
  xyz: [
    {
      id: "1",
      name: "Balanço Patrimonial 2025",
      type: "Relatório",
      uploadDate: "28/01/2026",
      viewed: false,
    },
    {
      id: "2",
      name: "Boleto DARF Março/2026",
      type: "Boleto",
      uploadDate: "12/03/2026",
      viewed: false,
    },
    {
      id: "3",
      name: "DRE Março/2026",
      type: "DRE",
      uploadDate: "30/03/2026",
      viewed: false,
    },
    {
      id: "4",
      name: "Balancete Trimestral",
      type: "Balancete",
      uploadDate: "05/04/2026",
      viewed: false,
    },
    {
      id: "5",
      name: "Relatório de Auditoria",
      type: "Relatório",
      uploadDate: "20/02/2026",
      viewed: false,
    },
    {
      id: "6",
      name: "NF-e Importação",
      type: "NF",
      uploadDate: "18/03/2026",
      viewed: false,
    },
  ],
  nobre: [
    {
      id: "1",
      name: "Relatório de Obras 2026",
      type: "Relatório",
      uploadDate: "02/04/2026",
      viewed: true,
    },
    {
      id: "2",
      name: "Boleto INSS Abril/2026",
      type: "Boleto",
      uploadDate: "01/04/2026",
      viewed: false,
    },
    {
      id: "3",
      name: "DRE Primeiro Trimestre",
      type: "DRE",
      uploadDate: "30/03/2026",
      viewed: true,
    },
    {
      id: "4",
      name: "Balancete Março/2026",
      type: "Balancete",
      uploadDate: "28/03/2026",
      viewed: true,
    },
    {
      id: "5",
      name: "NF-e Venda Apartamento",
      type: "NF",
      uploadDate: "15/03/2026",
      viewed: false,
    },
  ],
};

const LOGS_BY_CLIENT: Record<string, AccessLog[]> = {
  abc: [
    {
      id: "1",
      dateTime: "30/03/2026 14:32",
      document: "Balancete Março/2026",
      ip: "189.34.21.100",
      device: "Desktop",
    },
    {
      id: "2",
      dateTime: "30/03/2026 14:28",
      document: "DRE Fevereiro/2026",
      ip: "189.34.21.100",
      device: "Desktop",
    },
    {
      id: "3",
      dateTime: "28/03/2026 09:41",
      document: "NF-e Compra Equipamento",
      ip: "177.45.98.12",
      device: "Mobile",
    },
    {
      id: "4",
      dateTime: "25/03/2026 16:15",
      document: "Balanço Patrimonial 2025",
      ip: "177.45.98.12",
      device: "Mobile",
    },
    {
      id: "5",
      dateTime: "20/03/2026 10:03",
      document: "DRE Fevereiro/2026",
      ip: "189.34.21.100",
      device: "Desktop",
    },
  ],
  mei: [
    {
      id: "1",
      dateTime: "29/03/2026 09:15",
      document: "DAS Março/2026",
      ip: "200.131.55.8",
      device: "Mobile",
    },
    {
      id: "2",
      dateTime: "29/03/2026 09:12",
      document: "Balancete Fevereiro/2026",
      ip: "200.131.55.8",
      device: "Mobile",
    },
    {
      id: "3",
      dateTime: "15/03/2026 11:30",
      document: "NF-e Prestação de Serviço",
      ip: "187.10.44.22",
      device: "Desktop",
    },
    {
      id: "4",
      dateTime: "10/03/2026 08:55",
      document: "DAS Março/2026",
      ip: "187.10.44.22",
      device: "Desktop",
    },
  ],
  xyz: [
    {
      id: "1",
      dateTime: "15/03/2026 16:48",
      document: "Balanço Patrimonial 2025",
      ip: "201.76.90.5",
      device: "Desktop",
    },
    {
      id: "2",
      dateTime: "10/03/2026 14:20",
      document: "Balanço Patrimonial 2025",
      ip: "201.76.90.5",
      device: "Desktop",
    },
  ],
  nobre: [
    {
      id: "1",
      dateTime: "28/03/2026 11:07",
      document: "Relatório de Obras 2026",
      ip: "189.22.100.44",
      device: "Desktop",
    },
    {
      id: "2",
      dateTime: "28/03/2026 11:02",
      document: "DRE Primeiro Trimestre",
      ip: "189.22.100.44",
      device: "Desktop",
    },
    {
      id: "3",
      dateTime: "27/03/2026 17:35",
      document: "Balancete Março/2026",
      ip: "177.99.12.88",
      device: "Mobile",
    },
    {
      id: "4",
      dateTime: "20/03/2026 09:15",
      document: "Relatório de Obras 2026",
      ip: "177.99.12.88",
      device: "Mobile",
    },
    {
      id: "5",
      dateTime: "15/03/2026 13:40",
      document: "Balancete Março/2026",
      ip: "189.22.100.44",
      device: "Desktop",
    },
  ],
};

const TYPE_BADGE: Record<string, string> = {
  Relatório: "bg-blue-100 text-blue-700 border-blue-200",
  Boleto: "bg-orange-100 text-orange-700 border-orange-200",
  DRE: "bg-purple-100 text-purple-700 border-purple-200",
  Balancete: "bg-teal-100 text-teal-700 border-teal-200",
  NF: "bg-pink-100 text-pink-700 border-pink-200",
};

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
  return Array.from(
    { length: 10 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

export default function PortalCliente() {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [selectedId, setSelectedId] = useState("abc");
  const [docs, setDocs] = useState(DOCS_BY_CLIENT);
  const [passwords, setPasswords] = useState<Record<string, string>>({
    abc: "Ax7@kL2!Rp",
    mei: "Bn3#mQ8$Wz",
    xyz: "Cp5%nR9^Vx",
    nobre: "Dq6&oS0*Uy",
  });
  const [showPass, setShowPass] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Add doc modal
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState<string>("Relatório");

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState(
    "Olá! Aqui você encontra seus documentos contábeis. Qualquer dúvida, entre em contato.",
  );
  const [settingsChecks, setSettingsChecks] = useState({
    relatorios: true,
    boletos: true,
    dre: true,
    balancete: true,
    nf: true,
    gerais: false,
  });

  const client = clients.find((c) => c.id === selectedId) ?? clients[0];
  const clientDocs = docs[selectedId] ?? [];
  const clientLogs = LOGS_BY_CLIENT[selectedId] ?? [];
  const portalLink = `https://contafacil.app/portal/${selectedId}`;

  const totalDocs = clientDocs.length;
  const viewedDocs = clientDocs.filter((d) => d.viewed).length;

  function dispatchAria(message: string) {
    window.dispatchEvent(
      new CustomEvent("aria-message", { detail: { message } }),
    );
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(portalLink).catch(() => {});
    setCopiedLink(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleCopyPass() {
    navigator.clipboard.writeText(passwords[selectedId] ?? "").catch(() => {});
    setCopiedPass(true);
    toast.success("Senha copiada!");
    setTimeout(() => setCopiedPass(false), 2000);
  }

  function handleGenerateLink() {
    const newPass = generatePassword();
    setPasswords((prev) => ({ ...prev, [selectedId]: newPass }));
    navigator.clipboard
      .writeText(`${portalLink} | Senha: ${newPass}`)
      .catch(() => {});
    toast.success("Novo link gerado e copiado!");
    dispatchAria(
      `Link de acesso gerado para ${client.name}. Senha temporária copiada para a área de transferência.`,
    );
  }

  function handleTogglePortal(active: boolean) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, portalActive: active } : c,
      ),
    );
    toast.success(active ? "Portal ativado" : "Portal desativado");
  }

  function handleRemoveDoc(docId: string) {
    setDocs((prev) => ({
      ...prev,
      [selectedId]: (prev[selectedId] ?? []).filter((d) => d.id !== docId),
    }));
    toast.success("Acesso removido");
  }

  function handleAddDoc() {
    if (!newDocName.trim()) return;
    const newDoc: SharedDoc = {
      id: String(Date.now()),
      name: newDocName.trim(),
      type: newDocType as SharedDoc["type"],
      uploadDate: new Date().toLocaleDateString("pt-BR"),
      viewed: false,
    };
    setDocs((prev) => ({
      ...prev,
      [selectedId]: [newDoc, ...(prev[selectedId] ?? [])],
    }));
    setNewDocName("");
    setNewDocType("Relatório");
    setShowAddDoc(false);
    toast.success("Documento adicionado ao portal");
  }

  function handleSaveSettings() {
    setShowSettings(false);
    toast.success("Configurações salvas");
    dispatchAria("Configurações do portal do cliente atualizadas com sucesso.");
  }

  return (
    <div
      className="flex flex-col h-full bg-gray-50"
      data-ocid="portal-cliente.page"
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Portal do Cliente
            </h1>
            <p className="text-xs text-gray-500">
              Compartilhe relatórios e documentos com seus clientes
            </p>
          </div>
        </div>
        <Button
          data-ocid="portal-cliente.settings.open_modal_button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="w-4 h-4" />
          Configurações do Portal
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Client Selector Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Clientes
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {clients.map((c, i) => (
              <button
                key={c.id}
                type="button"
                data-ocid={`portal-cliente.client.item.${i + 1}`}
                onClick={() => setSelectedId(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  selectedId === c.id
                    ? "bg-blue-50 border-r-2 border-blue-600"
                    : "hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full ${c.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                >
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${selectedId === c.id ? "text-blue-700" : "text-gray-800"}`}
                  >
                    {c.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${c.portalActive ? "bg-green-500" : "bg-gray-400"}`}
                    />
                    <span className="text-xs text-gray-500">
                      {c.portalActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="shadow-sm border-gray-200">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 font-medium">
                    Documentos Compartilhados
                  </p>
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalDocs}</p>
                <p className="text-xs text-gray-400 mt-1">total no portal</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 font-medium">
                    Visualizados
                  </p>
                  <Eye className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{viewedDocs}</p>
                <p className="text-xs text-gray-400 mt-1">
                  de {totalDocs} documentos
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 font-medium">
                    Último Acesso
                  </p>
                  <Users className="w-4 h-4 text-violet-500" />
                </div>
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  {client.lastAccess}
                </p>
                <p className="text-xs text-gray-400 mt-1">pelo cliente</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 font-medium">
                    Status do Portal
                  </p>
                  <Globe className="w-4 h-4 text-orange-500" />
                </div>
                <Badge
                  className={
                    client.portalActive
                      ? "bg-green-100 text-green-700 border-green-200 text-sm font-semibold"
                      : "bg-gray-100 text-gray-600 border-gray-200 text-sm font-semibold"
                  }
                >
                  {client.portalActive ? "Ativo" : "Inativo"}
                </Badge>
                <p className="text-xs text-gray-400 mt-1">acesso do cliente</p>
              </CardContent>
            </Card>
          </div>

          {/* Documents + Access side by side */}
          <div className="grid grid-cols-5 gap-5">
            {/* Documents Table */}
            <Card className="col-span-3 shadow-sm border-gray-200">
              <CardHeader className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-800">
                    Documentos Compartilhados
                  </CardTitle>
                  <Button
                    data-ocid="portal-cliente.add_doc.open_modal_button"
                    size="sm"
                    className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setShowAddDoc(true)}
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs px-4">Documento</TableHead>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Upload</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientDocs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-sm text-gray-400"
                          data-ocid="portal-cliente.docs.empty_state"
                        >
                          Nenhum documento compartilhado
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientDocs.map((doc, i) => (
                        <TableRow
                          key={doc.id}
                          data-ocid={`portal-cliente.doc.item.${i + 1}`}
                          className="hover:bg-gray-50"
                        >
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-800 font-medium">
                                {doc.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              className={`text-[11px] border ${TYPE_BADGE[doc.type] ?? ""}`}
                            >
                              {doc.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-xs text-gray-500">
                            {doc.uploadDate}
                          </TableCell>
                          <TableCell className="py-3">
                            {doc.viewed ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px] border">
                                ✓ Visualizado
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[11px] border">
                                Não Visualizado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3">
                            <Button
                              data-ocid={`portal-cliente.remove_doc.delete_button.${i + 1}`}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                              onClick={() => handleRemoveDoc(doc.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Access Panel */}
            <div className="col-span-2 space-y-4">
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-blue-500" />
                      Acesso do Cliente
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Portal</span>
                      <Switch
                        data-ocid="portal-cliente.portal_active.switch"
                        checked={client.portalActive}
                        onCheckedChange={handleTogglePortal}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 py-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">
                      Link de Acesso
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        data-ocid="portal-cliente.link.input"
                        value={portalLink}
                        readOnly
                        className="text-xs bg-gray-50 border-gray-200 text-gray-700 h-8"
                      />
                      <Button
                        data-ocid="portal-cliente.copy_link.button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 flex-shrink-0"
                        onClick={handleCopyLink}
                      >
                        {copiedLink ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">
                      Senha Temporária
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        data-ocid="portal-cliente.password.input"
                        value={
                          showPass
                            ? (passwords[selectedId] ?? "")
                            : "••••••••••"
                        }
                        readOnly
                        className="text-xs bg-gray-50 border-gray-200 text-gray-700 h-8 font-mono"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 flex-shrink-0"
                        onClick={() => setShowPass((v) => !v)}
                      >
                        {showPass ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        data-ocid="portal-cliente.copy_pass.button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 flex-shrink-0"
                        onClick={handleCopyPass}
                      >
                        {copiedPass ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    data-ocid="portal-cliente.generate_link.primary_button"
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
                    onClick={handleGenerateLink}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Gerar Novo Link de Acesso
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Access Log */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="px-5 py-4 border-b border-gray-100">
              <CardTitle className="text-sm font-semibold text-gray-800">
                Log de Acessos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs px-4">Data / Hora</TableHead>
                    <TableHead className="text-xs">
                      Documento Acessado
                    </TableHead>
                    <TableHead className="text-xs">IP</TableHead>
                    <TableHead className="text-xs">Dispositivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientLogs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-sm text-gray-400"
                        data-ocid="portal-cliente.logs.empty_state"
                      >
                        Nenhum acesso registrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientLogs.map((log, i) => (
                      <TableRow
                        key={log.id}
                        data-ocid={`portal-cliente.log.item.${i + 1}`}
                        className="hover:bg-gray-50"
                      >
                        <TableCell className="px-4 py-3 text-xs text-gray-600 font-mono">
                          {log.dateTime}
                        </TableCell>
                        <TableCell className="py-3 text-sm text-gray-800">
                          {log.document}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-gray-500 font-mono">
                          {log.ip}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            {log.device === "Desktop" ? (
                              <Monitor className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                            )}
                            {log.device}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Document Modal */}
      <Dialog open={showAddDoc} onOpenChange={setShowAddDoc}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid="portal-cliente.add_doc.dialog"
        >
          <DialogHeader>
            <DialogTitle>Adicionar Documento ao Portal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-name">Nome do Documento</Label>
              <Input
                id="doc-name"
                data-ocid="portal-cliente.add_doc.input"
                placeholder="Ex: Balancete Março/2026"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddDoc()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo do Documento</Label>
              <Select value={newDocType} onValueChange={setNewDocType}>
                <SelectTrigger data-ocid="portal-cliente.add_doc.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Relatório">Relatório</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="DRE">DRE</SelectItem>
                  <SelectItem value="Balancete">Balancete</SelectItem>
                  <SelectItem value="NF">Nota Fiscal (NF)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="portal-cliente.add_doc.cancel_button"
              variant="outline"
              onClick={() => setShowAddDoc(false)}
            >
              Cancelar
            </Button>
            <Button
              data-ocid="portal-cliente.add_doc.submit_button"
              onClick={handleAddDoc}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent
          className="sm:max-w-lg"
          data-ocid="portal-cliente.settings.dialog"
        >
          <DialogHeader>
            <DialogTitle>Configurações do Portal</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Logo upload */}
            <div className="space-y-2">
              <Label>Logo do Escritório</Label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                data-ocid="portal-cliente.logo.upload_button"
              >
                <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Clique para selecionar ou arraste a imagem
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG — máx. 2 MB
                </p>
              </div>
            </div>

            {/* Welcome message */}
            <div className="space-y-1.5">
              <Label htmlFor="welcome-msg">Mensagem de Boas-vindas</Label>
              <Textarea
                id="welcome-msg"
                data-ocid="portal-cliente.welcome_msg.textarea"
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            {/* Document type checkboxes */}
            <div className="space-y-2">
              <Label>Tipos de Documento Permitidos</Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: "relatorios", label: "Relatórios" },
                    { key: "boletos", label: "Boletos" },
                    { key: "dre", label: "DRE" },
                    { key: "balancete", label: "Balancete" },
                    { key: "nf", label: "Notas Fiscais" },
                    { key: "gerais", label: "Documentos Gerais" },
                  ] as { key: keyof typeof settingsChecks; label: string }[]
                ).map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50"
                  >
                    <Checkbox
                      id={`check-${key}`}
                      data-ocid={`portal-cliente.settings.${key}.checkbox`}
                      checked={settingsChecks[key]}
                      onCheckedChange={(v) =>
                        setSettingsChecks((prev) => ({ ...prev, [key]: !!v }))
                      }
                    />
                    <Label
                      htmlFor={`check-${key}`}
                      className="text-sm cursor-pointer"
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="portal-cliente.settings.cancel_button"
              variant="outline"
              onClick={() => setShowSettings(false)}
            >
              Cancelar
            </Button>
            <Button
              data-ocid="portal-cliente.settings.save_button"
              onClick={handleSaveSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
