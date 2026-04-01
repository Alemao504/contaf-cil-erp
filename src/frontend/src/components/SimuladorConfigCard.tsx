import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BarChart2, Info } from "lucide-react";
import { useState } from "react";
import { useAppContext } from "../context/AppContext";

export function SimuladorConfigCard() {
  const { setCurrentPage } = useAppContext();

  const [autoLoad, setAutoLoad] = useState(
    () => localStorage.getItem("simulador_auto") === "true",
  );
  const [exportFormat, setExportFormat] = useState(
    () => localStorage.getItem("simulador_export_format") ?? "pdf",
  );
  const [ariaAutoExport, setAriaAutoExport] = useState(
    () => localStorage.getItem("simulador_aria_auto") === "true",
  );
  const [detailLevel, setDetailLevel] = useState(
    () => localStorage.getItem("simulador_detail_level") ?? "completo",
  );

  const handleAutoLoad = (v: boolean) => {
    setAutoLoad(v);
    localStorage.setItem("simulador_auto", String(v));
  };
  const handleExportFormat = (v: string) => {
    setExportFormat(v);
    localStorage.setItem("simulador_export_format", v);
  };
  const handleAriaAutoExport = (v: boolean) => {
    setAriaAutoExport(v);
    localStorage.setItem("simulador_aria_auto", String(v));
  };
  const handleDetailLevel = (v: string) => {
    setDetailLevel(v);
    localStorage.setItem("simulador_detail_level", v);
  };

  return (
    <Card
      data-ocid="config.simulador.card"
      className="rounded-xl border-border shadow-sm"
    >
      <CardHeader className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary/60" />
          <CardTitle className="text-sm font-semibold">
            Simulador Tributário
          </CardTitle>
          <button
            type="button"
            className="ml-auto text-xs text-primary underline"
            onClick={() => setCurrentPage("simulador-tributario")}
          >
            Abrir simulador →
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Auto-load toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <Label className="text-xs font-medium" htmlFor="sim-auto-load">
              Carregar dados automaticamente
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Preenche o simulador com dados do cliente selecionado
            </p>
          </div>
          <Switch
            data-ocid="config.simulador_auto.switch"
            id="sim-auto-load"
            checked={autoLoad}
            onCheckedChange={handleAutoLoad}
          />
        </div>

        {/* Export format */}
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs font-medium">
            Formato padrão de exportação
          </Label>
          <Select value={exportFormat} onValueChange={handleExportFormat}>
            <SelectTrigger
              data-ocid="config.simulador_export.select"
              className="h-8 w-36 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="word">Word (.doc)</SelectItem>
              <SelectItem value="excel">Excel (.csv)</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ARIA auto export */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <Label className="text-xs font-medium" htmlFor="sim-aria-auto">
              ARIA exporta automaticamente
            </Label>
            <p className="text-[11px] text-muted-foreground">
              ARIA gera e salva o relatório após cada simulação
            </p>
          </div>
          <Switch
            data-ocid="config.simulador_aria_auto.switch"
            id="sim-aria-auto"
            checked={ariaAutoExport}
            onCheckedChange={handleAriaAutoExport}
          />
        </div>

        {/* Detail level */}
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs font-medium">
            Nível de detalhe do relatório
          </Label>
          <Select value={detailLevel} onValueChange={handleDetailLevel}>
            <SelectTrigger
              data-ocid="config.simulador_detail.select"
              className="h-8 w-40 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="resumido">Resumido</SelectItem>
              <SelectItem value="completo">Completo</SelectItem>
              <SelectItem value="separado">Separado por imposto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Info note */}
        {!autoLoad && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg text-xs"
            style={{
              background: "oklch(0.97 0.02 240)",
              borderLeft: "3px solid oklch(0.68 0.155 50)",
            }}
          >
            <Info
              className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
              style={{ color: "oklch(0.68 0.155 50)" }}
            />
            <p className="text-muted-foreground">
              ARIA irá sugerir ativar o modo automático ao abrir o simulador.
              Com dados automáticos, a ARIA pré-preenche os campos com base no
              histórico de lançamentos do cliente.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
