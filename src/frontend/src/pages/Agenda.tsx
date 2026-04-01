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
import { cn } from "@/lib/utils";
import { CalendarDays, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Obrigacao {
  id: number;
  dia: number;
  titulo: string;
  descricao: string;
  tipo: string;
  valor?: string;
  cumprido: boolean;
}

const OBRIGACOES_JULHO: Obrigacao[] = [
  {
    id: 1,
    dia: 7,
    titulo: "FGTS",
    descricao: "Recolhimento FGTS — competência junho",
    tipo: "trabalhista",
    valor: "R$ 4.320,00",
    cumprido: false,
  },
  {
    id: 2,
    dia: 10,
    titulo: "DAS — Simples Nacional",
    descricao:
      "Documento de Arrecadação do Simples Nacional — competência junho",
    tipo: "federal",
    valor: "R$ 12.450,00",
    cumprido: false,
  },
  {
    id: 3,
    dia: 15,
    titulo: "DCTFWeb",
    descricao: "Declaração de Débitos e Créditos Tributários Federais — INSS",
    tipo: "federal",
    cumprido: false,
  },
  {
    id: 4,
    dia: 15,
    titulo: "INSS Empregados",
    descricao: "Recolhimento INSS empregados e patronal — junho",
    tipo: "previdenciário",
    valor: "R$ 8.760,00",
    cumprido: false,
  },
  {
    id: 5,
    dia: 20,
    titulo: "DCTF",
    descricao: "Declaração de Débitos e Créditos Tributários Federais — maio",
    tipo: "federal",
    cumprido: false,
  },
  {
    id: 6,
    dia: 25,
    titulo: "IRPJ / CSLL — Lucro Presumido",
    descricao: "Recolhimento IRPJ e CSLL — 2º trimestre 2026",
    tipo: "federal",
    valor: "R$ 34.200,00",
    cumprido: false,
  },
  {
    id: 7,
    dia: 25,
    titulo: "PIS / COFINS",
    descricao: "Recolhimento PIS e COFINS — competência junho",
    tipo: "federal",
    valor: "R$ 9.840,00",
    cumprido: false,
  },
  {
    id: 8,
    dia: 31,
    titulo: "SPED Fiscal EFD",
    descricao: "Entrega SPED Fiscal Escrituração Fiscal Digital — maio",
    tipo: "obrigação acessória",
    cumprido: false,
  },
];

const today = new Date();
const CURRENT_MONTH = 6; // July (0-indexed)
const CURRENT_YEAR = 2026;

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getUrgency(dia: number): "critico" | "urgente" | "normal" {
  const currentDay =
    today.getFullYear() === CURRENT_YEAR && today.getMonth() === CURRENT_MONTH
      ? today.getDate()
      : 1;
  const diff = dia - currentDay;
  if (diff < 3) return "critico";
  if (diff < 7) return "urgente";
  return "normal";
}

const tipoBadge = (tipo: string) => {
  const map: Record<string, string> = {
    federal: "bg-blue-100 text-blue-700",
    trabalhista: "bg-orange-100 text-orange-700",
    previdenciário: "bg-purple-100 text-purple-700",
    "obrigação acessória": "bg-gray-100 text-gray-700",
  };
  return (
    <Badge
      className={cn("text-[10px]", map[tipo] ?? "bg-gray-100 text-gray-700")}
    >
      {tipo}
    </Badge>
  );
};

const urgencyDot = (urgency: string) => {
  if (urgency === "critico") return "bg-red-500";
  if (urgency === "urgente") return "bg-yellow-500";
  return "bg-green-500";
};

export default function Agenda() {
  const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>(OBRIGACOES_JULHO);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [filterCliente, setFilterCliente] = useState("todos");

  const daysInMonth = getDaysInMonth(CURRENT_YEAR, CURRENT_MONTH);
  const firstDow = getFirstDayOfWeek(CURRENT_YEAR, CURRENT_MONTH);

  const obrigacoesByDay = (dia: number) =>
    obrigacoes.filter((o) => o.dia === dia);

  const toggleCumprido = (id: number) => {
    setObrigacoes((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next = { ...o, cumprido: !o.cumprido };
        toast.success(
          next.cumprido
            ? `"${o.titulo}" marcado como cumprido`
            : `"${o.titulo}" reaberto`,
        );
        return next;
      }),
    );
  };

  const selectedObrigacoes = selectedDay ? obrigacoesByDay(selectedDay) : [];
  const proximosVencimentos = [...obrigacoes]
    .filter((o) => !o.cumprido)
    .sort((a, b) => a.dia - b.dia);

  const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda Fiscal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Calendário de obrigações — Julho 2026
          </p>
        </div>
        <Select value={filterCliente} onValueChange={setFilterCliente}>
          <SelectTrigger
            data-ocid="agenda.filter_cliente.select"
            className="h-9 w-52 text-xs"
          >
            <SelectValue placeholder="Filtrar por cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os clientes</SelectItem>
            <SelectItem value="panificadora">
              Panificadora Pão Quente
            </SelectItem>
            <SelectItem value="construtora">
              Construtora Horizonte S.A.
            </SelectItem>
            <SelectItem value="clinica">Clínica Saúde & Vida</SelectItem>
            <SelectItem value="tech">Tech Inovação Sistemas</SelectItem>
            <SelectItem value="agropecuaria">
              Agropecuária Vale Verde
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Julho 2026
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-semibold text-muted-foreground py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDow }, (_, i) => i).map((i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayObrigacoes = obrigacoesByDay(day);
                  const isSelected = selectedDay === day;
                  const isToday =
                    today.getFullYear() === CURRENT_YEAR &&
                    today.getMonth() === CURRENT_MONTH &&
                    today.getDate() === day;

                  return (
                    <button
                      type="button"
                      key={day}
                      data-ocid={`agenda.day_${day}.button`}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={cn(
                        "relative flex flex-col items-center p-1.5 rounded-lg text-xs transition-colors min-h-[48px]",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : isToday
                            ? "bg-muted font-bold ring-1 ring-primary"
                            : dayObrigacoes.length > 0
                              ? "hover:bg-muted cursor-pointer"
                              : "text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      <span className="font-medium">{day}</span>
                      {dayObrigacoes.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                          {dayObrigacoes.map((o) => (
                            <span
                              key={o.id}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                o.cumprido
                                  ? "bg-gray-400"
                                  : urgencyDot(getUrgency(day)),
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                <span className="text-[10px] text-muted-foreground">
                  Legenda:
                </span>
                {[
                  { color: "bg-red-500", label: "< 3 dias" },
                  { color: "bg-yellow-500", label: "< 7 dias" },
                  { color: "bg-green-500", label: "> 7 dias" },
                  { color: "bg-gray-400", label: "Cumprido" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1">
                    <span className={cn("w-2 h-2 rounded-full", l.color)} />
                    <span className="text-[10px] text-muted-foreground">
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedDay !== null && (
            <Card data-ocid="agenda.selected_day.panel">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">
                  Obrigações — {selectedDay} de Julho de 2026
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {selectedObrigacoes.length === 0 ? (
                  <p
                    className="text-sm text-muted-foreground text-center py-4"
                    data-ocid="agenda.selected_day.empty_state"
                  >
                    Nenhuma obrigação para este dia.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedObrigacoes.map((o, idx) => (
                      <div
                        key={o.id}
                        data-ocid={`agenda.obrigacao.item.${idx + 1}`}
                        className={cn(
                          "flex items-start justify-between p-3 rounded-lg border",
                          o.cumprido
                            ? "bg-muted/30 opacity-60"
                            : "bg-background",
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={cn(
                                "font-medium text-sm",
                                o.cumprido &&
                                  "line-through text-muted-foreground",
                              )}
                            >
                              {o.titulo}
                            </p>
                            {tipoBadge(o.tipo)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {o.descricao}
                          </p>
                          {o.valor && (
                            <p className="text-xs font-semibold mt-1">
                              {o.valor}
                            </p>
                          )}
                        </div>
                        <Button
                          variant={o.cumprido ? "outline" : "default"}
                          size="sm"
                          data-ocid={`agenda.toggle_cumprido.${idx + 1}`}
                          className="ml-3 h-8 text-xs gap-1.5 flex-shrink-0"
                          onClick={() => toggleCumprido(o.id)}
                        >
                          {o.cumprido ? (
                            <>
                              <Circle className="w-3.5 h-3.5" /> Reabrir
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Marcar
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming sidebar */}
        <div>
          <Card className="sticky top-6">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">
                Próximos Vencimentos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2.5">
                {proximosVencimentos.map((o, i) => {
                  const urg = getUrgency(o.dia);
                  return (
                    <button
                      type="button"
                      key={o.id}
                      data-ocid={`agenda.proximo.item.${i + 1}`}
                      className="w-full flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/40 cursor-pointer hover:bg-muted/70 transition-colors text-left"
                      onClick={() => setSelectedDay(o.dia)}
                    >
                      <div
                        className={cn(
                          "flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold",
                          urg === "critico"
                            ? "bg-red-500"
                            : urg === "urgente"
                              ? "bg-yellow-500"
                              : "bg-green-500",
                        )}
                      >
                        {o.dia}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {o.titulo}
                        </p>
                        {o.valor && (
                          <p className="text-[10px] text-muted-foreground">
                            {o.valor}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
                {proximosVencimentos.length === 0 && (
                  <p
                    className="text-xs text-center text-muted-foreground py-4"
                    data-ocid="agenda.proximos.empty_state"
                  >
                    Todas as obrigações cumpridas! 🎉
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
