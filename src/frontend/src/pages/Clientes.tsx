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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import { useClients, useCreateClient } from "../hooks/useQueries";
import { formatCNPJ } from "../lib/formatters";

export default function Clientes() {
  const { data: clients = [], isLoading } = useClients();
  const { setClients, setSelectedClientId } = useAppContext();
  const createClient = useCreateClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    regime: "Simples Nacional",
  });

  const handleCreate = async () => {
    if (!form.name || !form.cnpj) {
      toast.error("Nome e CNPJ são obrigatórios");
      return;
    }
    try {
      const id = crypto.randomUUID();
      await createClient.mutateAsync({
        id,
        name: form.name,
        cnpj: form.cnpj.replace(/\D/g, ""),
        regime: form.regime,
        active: true,
      });
      setClients([
        ...clients,
        {
          id,
          name: form.name,
          cnpj: form.cnpj.replace(/\D/g, ""),
          regime: form.regime,
          active: true,
        },
      ]);
      toast.success("Cliente cadastrado com sucesso!");
      setOpen(false);
      setForm({ name: "", cnpj: "", regime: "Simples Nacional" });
    } catch {
      toast.error("Erro ao cadastrar cliente");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="no-print flex items-center justify-between px-6 py-4 bg-white border-b border-border">
        <div>
          <h1 className="text-xl font-semibold">Clientes</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {clients.length} cliente(s) cadastrado(s)
          </p>
        </div>
        <Button
          type="button"
          data-ocid="clientes.novo.primary_button"
          size="sm"
          className="bg-primary text-white text-xs gap-1.5"
          onClick={() => setOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" /> Novo Cliente
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="px-5 py-4 border-b border-border">
            <CardTitle className="text-sm font-semibold">
              Lista de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2" data-ocid="clientes.loading_state">
                {["a", "b", "c", "d"].map((k) => (
                  <Skeleton key={k} className="h-10 w-full" />
                ))}
              </div>
            ) : clients.length === 0 ? (
              <div
                data-ocid="clientes.empty_state"
                className="py-16 flex flex-col items-center gap-2 text-muted-foreground"
              >
                <Users className="w-10 h-10 opacity-30" />
                <p className="text-sm">Nenhum cliente cadastrado ainda.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs mt-1"
                  onClick={() => setOpen(true)}
                >
                  Cadastrar primeiro cliente
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold px-5">
                      Nome
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      CNPJ
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Regime
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c, i) => (
                    <TableRow key={c.id} data-ocid={`clientes.item.${i + 1}`}>
                      <TableCell className="text-xs px-5 py-3 font-medium">
                        {c.name}
                      </TableCell>
                      <TableCell className="text-xs py-3 font-mono">
                        {formatCNPJ(c.cnpj)}
                      </TableCell>
                      <TableCell className="text-xs py-3">{c.regime}</TableCell>
                      <TableCell className="py-3">
                        <Badge
                          className="text-[10px] px-1.5 py-0.5"
                          style={
                            c.active
                              ? {
                                  background: "oklch(0.95 0.05 150)",
                                  color: "oklch(0.4 0.12 150)",
                                }
                              : {
                                  background: "oklch(0.93 0.01 240)",
                                  color: "oklch(0.52 0.02 240)",
                                }
                          }
                        >
                          {c.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary h-7"
                          data-ocid={`clientes.selecionar.button.${i + 1}`}
                          onClick={() => setSelectedClientId(c.id)}
                        >
                          Selecionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid="clientes.novo.dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Novo Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Razão Social *</Label>
              <Input
                data-ocid="clientes.name.input"
                className="h-8 text-xs mt-1"
                placeholder="Nome do cliente"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">CNPJ *</Label>
              <Input
                data-ocid="clientes.cnpj.input"
                className="h-8 text-xs mt-1"
                placeholder="00.000.000/0000-00"
                value={form.cnpj}
                onChange={(e) =>
                  setForm((p) => ({ ...p, cnpj: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Regime Tributário</Label>
              <Select
                value={form.regime}
                onValueChange={(v) => setForm((p) => ({ ...p, regime: v }))}
              >
                <SelectTrigger
                  data-ocid="clientes.regime.select"
                  className="h-8 text-xs mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Simples Nacional" className="text-xs">
                    Simples Nacional
                  </SelectItem>
                  <SelectItem value="Lucro Presumido" className="text-xs">
                    Lucro Presumido
                  </SelectItem>
                  <SelectItem value="Lucro Real" className="text-xs">
                    Lucro Real
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              data-ocid="clientes.cancel.button"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs bg-primary"
              data-ocid="clientes.save.submit_button"
              onClick={handleCreate}
              disabled={createClient.isPending}
            >
              {createClient.isPending && (
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              )}
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
