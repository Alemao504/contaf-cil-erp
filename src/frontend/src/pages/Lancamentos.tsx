import ARIATogglePanel from "@/components/ARIATogglePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";
import ClientSelector from "../components/ClientSelector";
import LancamentoModal from "../components/LancamentoModal";
import { useAppContext } from "../context/AppContext";
import { useJournalEntries } from "../hooks/useQueries";
import { formatBRL, formatDate } from "../lib/formatters";

const YEARS = ["2026", "2025", "2024", "2023"];

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  conciliado: {
    bg: "oklch(0.92 0.08 150)",
    text: "oklch(0.35 0.12 150)",
    label: "Conciliado",
  },
  pendente: {
    bg: "oklch(0.94 0.1 80)",
    text: "oklch(0.4 0.14 80)",
    label: "Pendente",
  },
  aprovado: {
    bg: "oklch(0.91 0.08 240)",
    text: "oklch(0.35 0.1 240)",
    label: "Aprovado",
  },
};

export default function Lancamentos() {
  const { selectedClientId } = useAppContext();
  const { data: entries = [], isLoading } = useJournalEntries(selectedClientId);
  const [yearFilter, setYearFilter] = useState("2026");
  const [showModal, setShowModal] = useState(false);

  const filtered = entries.filter((e) => e.entryDate.startsWith(yearFilter));

  return (
    <div className="flex flex-col h-full">
      <header className="no-print flex items-center justify-between px-6 py-4 bg-white border-b border-border">
        <div>
          <h1 className="text-xl font-semibold">Lançamentos Contábeis</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} lançamento(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ClientSelector />
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger
              data-ocid="lancamentos.year.select"
              className="w-28 h-8 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y} className="text-xs">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            data-ocid="lancamentos.novo.primary_button"
            size="sm"
            className="bg-primary text-white text-xs gap-1.5"
            onClick={() => setShowModal(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Novo Lançamento
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <ARIATogglePanel
          screenName="lancamentos"
          toggles={[
            { key: "automaticos", label: "Lançamentos Automáticos" },
            { key: "conciliacao", label: "Conciliação" },
            { key: "sugestoes", label: "Sugestões" },
          ]}
        />
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="px-5 py-4 border-b border-border">
            <CardTitle className="text-sm font-semibold">
              Livro de Lançamentos — {yearFilter}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div
                className="p-4 space-y-2"
                data-ocid="lancamentos.loading_state"
              >
                {["a", "b", "c", "d", "e", "f"].map((k) => (
                  <Skeleton key={k} className="h-9 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div
                data-ocid="lancamentos.empty_state"
                className="py-14 flex flex-col items-center gap-2 text-muted-foreground"
              >
                <BookOpen className="w-10 h-10 opacity-30" />
                <p className="text-sm">
                  Nenhum lançamento encontrado para {yearFilter}.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs mt-1"
                  onClick={() => setShowModal(true)}
                >
                  Criar primeiro lançamento
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold px-5">
                        #
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
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
                      <TableHead className="text-xs font-semibold text-right pr-5">
                        Valor
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((e, i) => {
                      const style =
                        STATUS_STYLES[e.status] ?? STATUS_STYLES.conciliado;
                      return (
                        <TableRow
                          key={e.id}
                          data-ocid={`lancamentos.item.${i + 1}`}
                        >
                          <TableCell className="text-xs px-5 py-2.5 text-muted-foreground">
                            {i + 1}
                          </TableCell>
                          <TableCell className="text-xs py-2.5 whitespace-nowrap">
                            {formatDate(e.entryDate)}
                          </TableCell>
                          <TableCell className="text-xs py-2.5 max-w-[200px] truncate">
                            {e.description}
                          </TableCell>
                          <TableCell className="text-xs py-2.5 font-mono">
                            {e.debitCode}
                          </TableCell>
                          <TableCell className="text-xs py-2.5 font-mono">
                            {e.creditCode}
                          </TableCell>
                          <TableCell className="text-xs py-2.5 text-right pr-5 font-semibold">
                            {formatBRL(e.valueInCents)}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge
                              className="text-[10px] px-1.5 py-0.5 border-0"
                              style={{
                                background: style.bg,
                                color: style.text,
                              }}
                            >
                              {style.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <LancamentoModal open={showModal} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
