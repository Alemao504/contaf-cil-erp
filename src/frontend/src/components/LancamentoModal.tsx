import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import { useAccountPlan, useCreateJournalEntry } from "../hooks/useQueries";
import { DEFAULT_ACCOUNT_PLAN } from "../lib/accountPlan";

interface Props {
  open: boolean;
  onClose: () => void;
  prefill?: {
    debitCode?: string;
    creditCode?: string;
    description?: string;
    value?: string;
  };
}

export default function LancamentoModal({ open, onClose, prefill }: Props) {
  const { selectedClientId } = useAppContext();
  const { data: accountPlan = [] } = useAccountPlan(selectedClientId);
  const create = useCreateJournalEntry();

  const plan = accountPlan.length > 0 ? accountPlan : DEFAULT_ACCOUNT_PLAN;

  const [form, setForm] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    debitCode: prefill?.debitCode ?? "",
    creditCode: prefill?.creditCode ?? "",
    description: prefill?.description ?? "",
    value: prefill?.value ?? "",
  });

  const handleSubmit = async () => {
    if (!selectedClientId) {
      toast.error("Selecione um cliente");
      return;
    }
    if (!form.debitCode || !form.creditCode || !form.value || !form.entryDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const valueCents = Math.round(
      Number.parseFloat(form.value.replace(",", ".")) * 100,
    );
    try {
      await create.mutateAsync({
        id: crypto.randomUUID(),
        clientId: selectedClientId,
        entryDate: form.entryDate,
        debitCode: form.debitCode,
        creditCode: form.creditCode,
        description: form.description,
        valueInCents: valueCents,
        docId: "",
      });
      toast.success("Lançamento criado com sucesso!");
      onClose();
    } catch {
      toast.error("Erro ao criar lançamento");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-ocid="lancamento.dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Novo Lançamento Contábil
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Data *</Label>
            <Input
              data-ocid="lancamento.date.input"
              type="date"
              className="h-8 text-xs mt-1"
              value={form.entryDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, entryDate: e.target.value }))
              }
            />
          </div>
          <div>
            <Label className="text-xs">Conta Débito *</Label>
            <Select
              value={form.debitCode}
              onValueChange={(v) => setForm((p) => ({ ...p, debitCode: v }))}
            >
              <SelectTrigger
                data-ocid="lancamento.debit.select"
                className="h-8 text-xs mt-1"
              >
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {plan.map((a) => (
                  <SelectItem key={a.code} value={a.code} className="text-xs">
                    {a.code} - {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Conta Crédito *</Label>
            <Select
              value={form.creditCode}
              onValueChange={(v) => setForm((p) => ({ ...p, creditCode: v }))}
            >
              <SelectTrigger
                data-ocid="lancamento.credit.select"
                className="h-8 text-xs mt-1"
              >
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {plan.map((a) => (
                  <SelectItem key={a.code} value={a.code} className="text-xs">
                    {a.code} - {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Input
              data-ocid="lancamento.description.input"
              className="h-8 text-xs mt-1"
              placeholder="Histórico do lançamento"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>
          <div>
            <Label className="text-xs">Valor (R$) *</Label>
            <Input
              data-ocid="lancamento.value.input"
              className="h-8 text-xs mt-1"
              placeholder="0,00"
              value={form.value}
              onChange={(e) =>
                setForm((p) => ({ ...p, value: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            data-ocid="lancamento.cancel.button"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="text-xs bg-primary"
            data-ocid="lancamento.submit.submit_button"
            onClick={handleSubmit}
            disabled={create.isPending}
          >
            {create.isPending && (
              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            )}
            Salvar Lançamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
