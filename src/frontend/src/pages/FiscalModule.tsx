import ARIATogglePanel from "@/components/ARIATogglePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Send,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useARIA } from "../context/ARIAContext";
import { addRecord, getAllRecords } from "../lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FiscalTransmissao {
  id: string;
  tipo: "DCTF" | "ECF" | "ECD";
  cliente: string;
  clienteId: string;
  periodo: string;
  status: "Transmitido" | "Pendente" | "Erro";
  recibo: string;
  dataTransmissao: string;
}

interface TransmissaoStep {
  label: string;
  done: boolean;
  active: boolean;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const CLIENTES = [
  { id: "c1", nome: "Padaria São João Ltda" },
  { id: "c2", nome: "Tech Solutions ME" },
  { id: "c3", nome: "Construtora Horizonte SA" },
  { id: "c4", nome: "Farmácia Saúde & Vida" },
  { id: "c5", nome: "Academia Fit Total" },
  { id: "c6", nome: "Escola Saber Kids" },
];

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const HISTORICO_INICIAL: FiscalTransmissao[] = [
  {
    id: "h1",
    tipo: "DCTF",
    cliente: "Padaria São João Ltda",
    clienteId: "c1",
    periodo: "Março/2026",
    status: "Transmitido",
    recibo: "REC-2026-0031",
    dataTransmissao: "2026-04-04T10:22:00",
  },
  {
    id: "h2",
    tipo: "ECD",
    cliente: "Tech Solutions ME",
    clienteId: "c2",
    periodo: "2025",
    status: "Transmitido",
    recibo: "REC-2026-0028",
    dataTransmissao: "2026-03-28T14:05:00",
  },
  {
    id: "h3",
    tipo: "ECF",
    cliente: "Construtora Horizonte SA",
    clienteId: "c3",
    periodo: "2025",
    status: "Pendente",
    recibo: "",
    dataTransmissao: "",
  },
  {
    id: "h4",
    tipo: "DCTF",
    cliente: "Farmácia Saúde & Vida",
    clienteId: "c4",
    periodo: "Fevereiro/2026",
    status: "Transmitido",
    recibo: "REC-2026-0019",
    dataTransmissao: "2026-03-05T09:14:00",
  },
  {
    id: "h5",
    tipo: "ECD",
    cliente: "Academia Fit Total",
    clienteId: "c5",
    periodo: "2025",
    status: "Erro",
    recibo: "",
    dataTransmissao: "2026-03-29T16:40:00",
  },
  {
    id: "h6",
    tipo: "DCTF",
    cliente: "Escola Saber Kids",
    clienteId: "c6",
    periodo: "Janeiro/2026",
    status: "Transmitido",
    recibo: "REC-2026-0007",
    dataTransmissao: "2026-02-04T11:30:00",
  },
];

const TRANSMISSAO_STEPS = [
  "Preparando",
  "Validando",
  "Transmitindo",
  "Recibo Emitido",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gerarRecibo(): string {
  const n = Math.floor(Math.random() * 900) + 100;
  return `REC-2026-0${n}`;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── TransmissaoModal ─────────────────────────────────────────────────────────

function TransmissaoModal({
  open,
  onClose,
  tipo,
  periodo,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  tipo: string;
  cliente: string;
  periodo: string;
  onSuccess: (recibo: string) => void;
}) {
  const [steps, setSteps] = useState<TransmissaoStep[]>(
    TRANSMISSAO_STEPS.map((label, i) => ({
      label,
      done: false,
      active: i === 0,
    })),
  );
  const [logs, setLogs] = useState<{ msg: string; ts: string }[]>([]);
  const [recibo, setRecibo] = useState("");
  const [done, setDone] = useState(false);
  const runRef = useRef(false);

  const addLog = (msg: string) =>
    setLogs((p) => [...p, { msg, ts: new Date().toLocaleTimeString("pt-BR") }]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: addLog is stable, intentional
  useEffect(() => {
    if (!open) return;
    setSteps(
      TRANSMISSAO_STEPS.map((label, i) => ({
        label,
        done: false,
        active: i === 0,
      })),
    );
    setLogs([]);
    setRecibo("");
    setDone(false);
    runRef.current = false;

    const run = async () => {
      if (runRef.current) return;
      runRef.current = true;

      addLog(`Iniciando transmissão ${tipo} — Competência ${periodo}`);
      await delay(800);

      // Step 0 done, step 1 active
      setSteps((p) =>
        p.map((s, i) => ({ ...s, done: i === 0, active: i === 1 })),
      );
      addLog("Verificando assinatura digital e certificado A1...");
      await delay(1000);

      // Step 1 done, step 2 active
      setSteps((p) =>
        p.map((s, i) => ({ ...s, done: i <= 1, active: i === 2 })),
      );
      addLog("Validando campos obrigatórios e regras de negócio...");
      await delay(1000);

      setSteps((p) =>
        p.map((s, i) => ({ ...s, done: i <= 2, active: i === 3 })),
      );
      addLog("Enviando para Receita Federal...");
      await delay(1200);

      const r = gerarRecibo();
      setRecibo(r);
      setSteps((p) => p.map((s) => ({ ...s, done: true, active: false })));
      addLog(`✅ Transmissão concluída! Recibo: ${r}`);
      setDone(true);
      onSuccess(r);
    };

    run();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="fiscal.transmissao.dialog"
        className="max-w-md"
        style={{
          background: "oklch(0.16 0.04 240)",
          border: "1px solid oklch(0.3 0.06 240)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-sm font-bold">
            Transmissão {tipo} — {periodo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Timeline */}
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {s.done ? (
                    <CheckCircle2
                      className="w-5 h-5"
                      style={{ color: "oklch(0.7 0.18 150)" }}
                    />
                  ) : s.active ? (
                    <Loader2
                      className="w-5 h-5 animate-spin"
                      style={{ color: "oklch(0.6 0.15 240)" }}
                    />
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold"
                      style={{
                        borderColor: "oklch(0.4 0.06 240)",
                        color: "oklch(0.5 0.06 240)",
                      }}
                    >
                      {i + 1}
                    </div>
                  )}
                </div>
                <span
                  className="text-sm"
                  style={{
                    color: s.done
                      ? "oklch(0.7 0.18 150)"
                      : s.active
                        ? "oklch(0.9 0.05 240)"
                        : "oklch(0.5 0.04 240)",
                    fontWeight: s.active ? 600 : 400,
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Recibo */}
          {recibo && (
            <div
              className="rounded-lg px-4 py-3 text-center"
              style={{
                background: "oklch(0.2 0.06 150 / 0.3)",
                border: "1px solid oklch(0.4 0.1 150 / 0.4)",
              }}
            >
              <p className="text-xs text-white/60 mb-1">Número do Recibo</p>
              <p
                className="text-base font-mono font-bold"
                style={{ color: "oklch(0.7 0.18 150)" }}
              >
                {recibo}
              </p>
            </div>
          )}

          {/* Log */}
          <div
            className="rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto"
            style={{ background: "oklch(0.12 0.03 240)" }}
          >
            {logs.map((l, i) => (
              <p
                key={`log-${i}-${l.ts}`}
                className="text-[11px] font-mono"
                style={{ color: "oklch(0.65 0.08 200)" }}
              >
                <span className="text-white/30 mr-2">[{l.ts}]</span>
                {l.msg}
              </p>
            ))}
          </div>

          {done && (
            <Button
              data-ocid="fiscal.transmissao.close_button"
              className="w-full text-white border-0"
              style={{ background: "oklch(0.45 0.15 150)" }}
              onClick={onClose}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Concluído
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── DCTFTab ──────────────────────────────────────────────────────────────────

function DCTFTab({
  exportFormat,
  onTransmit,
}: {
  exportFormat: string;
  onTransmit: (
    tipo: "DCTF" | "ECF" | "ECD",
    cliente: string,
    clienteId: string,
    periodo: string,
    recibo: string,
  ) => void;
}) {
  const [cliente, setCliente] = useState(CLIENTES[0].id);
  const [mes, setMes] = useState("3");
  const [ano, setAno] = useState("2026");
  const [transmissaoOpen, setTransmissaoOpen] = useState(false);

  const clienteNome = CLIENTES.find((c) => c.id === cliente)?.nome ?? "";
  const periodo = `${MESES[Number(mes) - 1]}/${ano}`;

  const handleDownload = () => {
    const content = `DCTF - Declaração de Débitos e Créditos Tributários Federais\nCompetência: ${periodo}\nContribuinte: ${clienteNome}\nCNPJ: 12.345.678/0001-00\n\nGrupo: IRPJ\nPeríodo: ${periodo}\nValor Original: R$ 8.240,00\nValor Pago: R$ 8.240,00\n\nGrupo: CSLL\nValor: R$ 3.108,00\n\nGrupo: PIS\nValor: R$ 1.520,00\n\nGrupo: COFINS\nValor: R$ 7.012,00\n`;
    if (exportFormat === "txt") {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DCTF_${periodo.replace("/", "_")}_${clienteNome.replace(/ /g, "_")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toast.success(
        `Arquivo ${exportFormat.toUpperCase()} gerado para ${clienteNome}`,
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-white/70">Cliente</Label>
          <Select value={cliente} onValueChange={setCliente}>
            <SelectTrigger
              data-ocid="dctf.cliente.select"
              className="h-9 text-xs border-white/15 bg-white/5 text-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENTES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-white/70">Mês Competência</Label>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger
              data-ocid="dctf.mes.select"
              className="h-9 text-xs border-white/15 bg-white/5 text-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-white/70">Ano</Label>
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger
              data-ocid="dctf.ano.select"
              className="h-9 text-xs border-white/15 bg-white/5 text-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["2024", "2025", "2026"].map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card
        className="border-white/10"
        style={{ background: "oklch(0.17 0.04 240)" }}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-white/70 uppercase tracking-wider">
            Tributos e Contribuições — {periodo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              grupo: "IRPJ",
              codigo: "2362",
              valor: "R$ 8.240,00",
              status: "Pago",
            },
            {
              grupo: "CSLL",
              codigo: "2484",
              valor: "R$ 3.108,00",
              status: "Pago",
            },
            {
              grupo: "PIS/Pasep",
              codigo: "8109",
              valor: "R$ 1.520,00",
              status: "Pendente",
            },
            {
              grupo: "COFINS",
              codigo: "2172",
              valor: "R$ 7.012,00",
              status: "Pendente",
            },
            { grupo: "IPI", codigo: "0668", valor: "R$ 0,00", status: "N/A" },
          ].map((t) => (
            <div
              key={t.grupo}
              className="flex items-center justify-between py-2 border-b border-white/8 last:border-0"
            >
              <div>
                <p className="text-xs font-semibold text-white/85">{t.grupo}</p>
                <p className="text-[10px] text-white/40">
                  Código DARF: {t.codigo}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-white/85">{t.valor}</p>
                <Badge
                  className="text-[9px] border-0 mt-0.5"
                  style={{
                    background:
                      t.status === "Pago"
                        ? "oklch(0.3 0.1 150 / 0.5)"
                        : t.status === "Pendente"
                          ? "oklch(0.3 0.12 50 / 0.5)"
                          : "oklch(0.25 0.04 240 / 0.5)",
                    color:
                      t.status === "Pago"
                        ? "oklch(0.7 0.18 150)"
                        : t.status === "Pendente"
                          ? "oklch(0.75 0.15 50)"
                          : "oklch(0.55 0.04 240)",
                  }}
                >
                  {t.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          data-ocid="dctf.download.button"
          size="sm"
          className="text-white border-0 text-xs"
          style={{ background: "oklch(0.35 0.1 240)" }}
          onClick={handleDownload}
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Gerar {exportFormat.toUpperCase()}
        </Button>
        <Button
          data-ocid="dctf.transmitir.button"
          size="sm"
          className="text-white border-0 text-xs"
          style={{ background: "oklch(0.45 0.15 150)" }}
          onClick={() => setTransmissaoOpen(true)}
        >
          <Send className="w-3.5 h-3.5 mr-1.5" /> Transmitir
        </Button>
      </div>

      <TransmissaoModal
        open={transmissaoOpen}
        onClose={() => setTransmissaoOpen(false)}
        tipo="DCTF"
        cliente={clienteNome}
        periodo={periodo}
        onSuccess={(recibo) => {
          setTransmissaoOpen(false);
          onTransmit("DCTF", clienteNome, cliente, periodo, recibo);
        }}
      />
    </div>
  );
}

// ─── ECFTab ───────────────────────────────────────────────────────────────────

function ECFTab({
  exportFormat,
  onTransmit,
}: {
  exportFormat: string;
  onTransmit: (
    tipo: "DCTF" | "ECF" | "ECD",
    cliente: string,
    clienteId: string,
    periodo: string,
    recibo: string,
  ) => void;
}) {
  const [cliente, setCliente] = useState(CLIENTES[0].id);
  const [ano, setAno] = useState("2025");
  const [transmissaoOpen, setTransmissaoOpen] = useState(false);

  const clienteNome = CLIENTES.find((c) => c.id === cliente)?.nome ?? "";
  const periodo = ano;

  const handleDownload = () => {
    const content = `ECF - Escrituração Contábil Fiscal\nAno-Calendário: ${ano}\nContribuinte: ${clienteNome}\nCNPJ: 12.345.678/0001-00\n\nBLOCO 0 - Abertura\n0000|ECF|2024|20250731\n\nBLOCO J - Balanço Patrimonial\nJ100|1.1.01.01.001|Caixa e Equivalentes|450000,00|0\nJ100|1.1.01.02.001|Contas a Receber|1200000,00|0\n\nBLOCO L - LALUR\nL300|LAIR|2800000,00\nL100|Provisão para CSLL|252000,00\n`;
    if (exportFormat === "txt") {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ECF_${ano}_${clienteNome.replace(/ /g, "_")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toast.success(
        `Arquivo ${exportFormat.toUpperCase()} gerado para ${clienteNome}`,
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-white/70">Cliente</Label>
          <Select value={cliente} onValueChange={setCliente}>
            <SelectTrigger
              data-ocid="ecf.cliente.select"
              className="h-9 text-xs border-white/15 bg-white/5 text-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENTES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-white/70">Ano-Calendário</Label>
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger
              data-ocid="ecf.ano.select"
              className="h-9 text-xs border-white/15 bg-white/5 text-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["2023", "2024", "2025"].map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card
        className="border-white/10"
        style={{ background: "oklch(0.17 0.04 240)" }}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-white/70 uppercase tracking-wider">
            Escrituração Contábil Fiscal — Ano {ano}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              bloco: "Bloco 0",
              desc: "Abertura e Identificação",
              itens: 12,
              status: "OK",
            },
            {
              bloco: "Bloco C",
              desc: "Dados das NF-e / NFC-e",
              itens: 87,
              status: "OK",
            },
            {
              bloco: "Bloco J",
              desc: "Balanço Patrimonial e DRE",
              itens: 43,
              status: "OK",
            },
            {
              bloco: "Bloco K",
              desc: "Saldo das Contas",
              itens: 156,
              status: "Atenção",
            },
            { bloco: "Bloco L", desc: "LALUR/LACS", itens: 28, status: "OK" },
            { bloco: "Bloco M", desc: "CSLL — LACS", itens: 18, status: "OK" },
          ].map((b) => (
            <div
              key={b.bloco}
              className="flex items-center justify-between py-2 border-b border-white/8 last:border-0"
            >
              <div>
                <p className="text-xs font-semibold text-white/85">{b.bloco}</p>
                <p className="text-[10px] text-white/40">{b.desc}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40">{b.itens} registros</p>
                <Badge
                  className="text-[9px] border-0 mt-0.5"
                  style={{
                    background:
                      b.status === "OK"
                        ? "oklch(0.3 0.1 150 / 0.5)"
                        : "oklch(0.3 0.15 50 / 0.5)",
                    color:
                      b.status === "OK"
                        ? "oklch(0.7 0.18 150)"
                        : "oklch(0.75 0.15 50)",
                  }}
                >
                  {b.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          data-ocid="ecf.download.button"
          size="sm"
          className="text-white border-0 text-xs"
          style={{ background: "oklch(0.35 0.1 240)" }}
          onClick={handleDownload}
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Gerar {exportFormat.toUpperCase()}
        </Button>
        <Button
          data-ocid="ecf.transmitir.button"
          size="sm"
          className="text-white border-0 text-xs"
          style={{ background: "oklch(0.45 0.15 150)" }}
          onClick={() => setTransmissaoOpen(true)}
        >
          <Send className="w-3.5 h-3.5 mr-1.5" /> Transmitir
        </Button>
      </div>

      <TransmissaoModal
        open={transmissaoOpen}
        onClose={() => setTransmissaoOpen(false)}
        tipo="ECF"
        cliente={clienteNome}
        periodo={periodo}
        onSuccess={(recibo) => {
          setTransmissaoOpen(false);
          onTransmit("ECF", clienteNome, cliente, periodo, recibo);
        }}
      />
    </div>
  );
}

// ─── ECDTab ───────────────────────────────────────────────────────────────────

function ECDTab({
  exportFormat,
  onTransmit,
}: {
  exportFormat: string;
  onTransmit: (
    tipo: "DCTF" | "ECF" | "ECD",
    cliente: string,
    clienteId: string,
    periodo: string,
    recibo: string,
  ) => void;
}) {
  const [cliente, setCliente] = useState(CLIENTES[0].id);
  const [ano, setAno] = useState("2025");
  const [transmissaoOpen, setTransmissaoOpen] = useState(false);

  const clienteNome = CLIENTES.find((c) => c.id === cliente)?.nome ?? "";
  const periodo = ano;

  const handleDownload = () => {
    const content = `ECD - Escrituração Contábil Digital\nAno-Calendário: ${ano}\nContribuinte: ${clienteNome}\nCNPJ: 12.345.678/0001-00\nVersionSPED: 9\n\nBLOCO 0 - Abertura\n0000|ECD|9|01012025|31122025|${clienteNome}|12345678000100|0001|S|2|1000\n\nBLOCO I - Lançamentos\nI010|T|N\nI012|0001\n\nBLOCO J - Balanço Patrimonial\nJ100|1.1.01.001|Caixa|450000,00|D\nJ100|2.1.01.001|Fornecedores|380000,00|C\n`;
    if (exportFormat === "txt") {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ECD_${ano}_${clienteNome.replace(/ /g, "_")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toast.success(
        `Arquivo ${exportFormat.toUpperCase()} gerado para ${clienteNome}`,
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-white/70">Cliente</Label>
          <Select value={cliente} onValueChange={setCliente}>
            <SelectTrigger
              data-ocid="ecd.cliente.select"
              className="h-9 text-xs border-white/15 bg-white/5 text-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENTES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-white/70">Ano-Calendário</Label>
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger
              data-ocid="ecd.ano.select"
              className="h-9 text-xs border-white/15 bg-white/5 text-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["2023", "2024", "2025"].map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card
        className="border-white/10"
        style={{ background: "oklch(0.17 0.04 240)" }}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-white/70 uppercase tracking-wider">
            Blocos ECD SPED — Ano {ano}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              bloco: "Bloco 0",
              desc: "Abertura, Identificação e Referências",
              registros: 8,
              ok: true,
            },
            {
              bloco: "Bloco I",
              desc: "Lançamentos Contábeis",
              registros: 1248,
              ok: true,
            },
            {
              bloco: "Bloco J",
              desc: "Balanço Patrimonial, DRE e DMPL",
              registros: 96,
              ok: true,
            },
            {
              bloco: "Bloco K",
              desc: "Saldo das Contas Patrimoniais e de Resultado",
              registros: 312,
              ok: true,
            },
            { bloco: "Bloco 9", desc: "Encerramento", registros: 3, ok: true },
          ].map((b) => (
            <div
              key={b.bloco}
              className="flex items-center justify-between py-2 border-b border-white/8 last:border-0"
            >
              <div>
                <p className="text-xs font-semibold text-white/85">{b.bloco}</p>
                <p className="text-[10px] text-white/40">{b.desc}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40">
                  {b.registros} registros
                </p>
                <Badge
                  className="text-[9px] border-0 mt-0.5"
                  style={{
                    background: "oklch(0.3 0.1 150 / 0.5)",
                    color: "oklch(0.7 0.18 150)",
                  }}
                >
                  Válido
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          data-ocid="ecd.download.button"
          size="sm"
          className="text-white border-0 text-xs"
          style={{ background: "oklch(0.35 0.1 240)" }}
          onClick={handleDownload}
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Gerar {exportFormat.toUpperCase()}
        </Button>
        <Button
          data-ocid="ecd.transmitir.button"
          size="sm"
          className="text-white border-0 text-xs"
          style={{ background: "oklch(0.45 0.15 150)" }}
          onClick={() => setTransmissaoOpen(true)}
        >
          <Send className="w-3.5 h-3.5 mr-1.5" /> Transmitir
        </Button>
      </div>

      <TransmissaoModal
        open={transmissaoOpen}
        onClose={() => setTransmissaoOpen(false)}
        tipo="ECD"
        cliente={clienteNome}
        periodo={periodo}
        onSuccess={(recibo) => {
          setTransmissaoOpen(false);
          onTransmit("ECD", clienteNome, cliente, periodo, recibo);
        }}
      />
    </div>
  );
}

// ─── HistoricoTab ─────────────────────────────────────────────────────────────

function HistoricoTab({ historico }: { historico: FiscalTransmissao[] }) {
  const statusStyle = (s: string) => {
    if (s === "Transmitido")
      return { bg: "oklch(0.3 0.1 150 / 0.4)", color: "oklch(0.7 0.18 150)" };
    if (s === "Erro")
      return { bg: "oklch(0.3 0.15 15 / 0.4)", color: "oklch(0.7 0.2 15)" };
    return { bg: "oklch(0.3 0.1 50 / 0.4)", color: "oklch(0.75 0.15 50)" };
  };

  const StatusIcon = ({ s }: { s: string }) => {
    if (s === "Transmitido")
      return (
        <CheckCircle2
          className="w-3.5 h-3.5"
          style={{ color: "oklch(0.7 0.18 150)" }}
        />
      );
    if (s === "Erro")
      return (
        <XCircle
          className="w-3.5 h-3.5"
          style={{ color: "oklch(0.7 0.2 15)" }}
        />
      );
    return (
      <Clock className="w-3.5 h-3.5" style={{ color: "oklch(0.75 0.15 50)" }} />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">
          {historico.length} transmissões registradas
        </p>
        <div className="flex gap-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{
              background: "oklch(0.3 0.1 150 / 0.3)",
              color: "oklch(0.7 0.18 150)",
            }}
          >
            {historico.filter((h) => h.status === "Transmitido").length}{" "}
            transmitidas
          </span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{
              background: "oklch(0.3 0.1 50 / 0.3)",
              color: "oklch(0.75 0.15 50)",
            }}
          >
            {historico.filter((h) => h.status === "Pendente").length} pendentes
          </span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-white/10">
        <Table>
          <TableHeader>
            <TableRow style={{ background: "oklch(0.17 0.04 240)" }}>
              <TableHead className="text-[10px] text-white/50 uppercase">
                Tipo
              </TableHead>
              <TableHead className="text-[10px] text-white/50 uppercase">
                Cliente
              </TableHead>
              <TableHead className="text-[10px] text-white/50 uppercase">
                Período
              </TableHead>
              <TableHead className="text-[10px] text-white/50 uppercase">
                Status
              </TableHead>
              <TableHead className="text-[10px] text-white/50 uppercase">
                Recibo
              </TableHead>
              <TableHead className="text-[10px] text-white/50 uppercase">
                Data
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historico.map((h, idx) => {
              const ss = statusStyle(h.status);
              return (
                <TableRow
                  key={h.id}
                  data-ocid={`fiscal.historico.item.${idx + 1}`}
                  style={{
                    background:
                      idx % 2 === 0
                        ? "oklch(0.15 0.03 240)"
                        : "oklch(0.13 0.03 240)",
                  }}
                >
                  <TableCell>
                    <Badge
                      className="text-[10px] border-0 font-mono"
                      style={{
                        background: "oklch(0.25 0.08 240 / 0.6)",
                        color: "oklch(0.75 0.1 240)",
                      }}
                    >
                      {h.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-white/75">
                    {h.cliente}
                  </TableCell>
                  <TableCell className="text-xs text-white/60 font-mono">
                    {h.periodo}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <StatusIcon s={h.status} />
                      <span className="text-[11px]" style={{ color: ss.color }}>
                        {h.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[11px] font-mono text-white/50">
                    {h.recibo || "—"}
                  </TableCell>
                  <TableCell className="text-[11px] text-white/40">
                    {formatDate(h.dataTransmissao)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FiscalModule() {
  const { addMessage } = useARIA();
  const [historico, setHistorico] = useState<FiscalTransmissao[]>([]);
  const exportFormat = localStorage.getItem("fiscalExportFormat") ?? "txt";
  const ariaNotified = useRef(false);

  useEffect(() => {
    // Load from IndexedDB, seed with initial if empty
    getAllRecords<FiscalTransmissao>("fiscal_transmissoes")
      .then((rows) => {
        if (rows.length === 0) {
          // Seed
          Promise.all(
            HISTORICO_INICIAL.map((r) => addRecord("fiscal_transmissoes", r)),
          )
            .then(() => setHistorico(HISTORICO_INICIAL))
            .catch(() => setHistorico(HISTORICO_INICIAL));
        } else {
          setHistorico(rows);
        }
      })
      .catch(() => setHistorico(HISTORICO_INICIAL));
  }, []);

  useEffect(() => {
    if (ariaNotified.current) return;
    ariaNotified.current = true;
    const timer = setTimeout(() => {
      addMessage({
        type: "info",
        text:
          "📋 **Módulo Fiscal aberto.** Você tem 3 obrigações próximas do vencimento:\n" +
          "• **DCTF** — vence 05/04/2026 (5 dias)\n" +
          "• **ECD** — vence 31/05/2026 (61 dias)\n" +
          "• **ECF** — vence 31/07/2026 (122 dias)\n\n" +
          "Recomendo transmitir a DCTF com prioridade máxima para evitar multas.",
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [addMessage]);

  const handleTransmit = async (
    tipo: "DCTF" | "ECF" | "ECD",
    cliente: string,
    clienteId: string,
    periodo: string,
    recibo: string,
  ) => {
    const nova: FiscalTransmissao = {
      id: `ft_${Date.now()}`,
      tipo,
      cliente,
      clienteId,
      periodo,
      status: "Transmitido",
      recibo,
      dataTransmissao: new Date().toISOString(),
    };

    try {
      await addRecord("fiscal_transmissoes", nova);
    } catch {
      /* ignore */
    }

    setHistorico((prev) => [nova, ...prev]);
    toast.success(`${tipo} transmitida com sucesso! Recibo: ${recibo}`);

    addMessage({
      type: "info",
      text: `✅ **${tipo} transmitida com sucesso!**\n\nCliente: ${cliente}\nPeríodo: ${periodo}\nRecibo: **${recibo}**\n\nO comprovante foi registrado no histórico de transmissões.`,
    });
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "oklch(0.13 0.035 240)" }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 px-6 py-5 border-b"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.16 0.06 240) 0%, oklch(0.19 0.07 220) 100%)",
          borderColor: "oklch(0.28 0.06 240)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(0.3 0.12 240 / 0.6)" }}
          >
            <FileText
              className="w-5 h-5"
              style={{ color: "oklch(0.7 0.15 240)" }}
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">
              Módulo Fiscal Completo
            </h1>
            <p className="text-xs text-white/50">
              DCTF • ECF • ECD — Transmissão simulada com timeline
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge
              className="text-[10px] border-0"
              style={{
                background: "oklch(0.3 0.12 50 / 0.5)",
                color: "oklch(0.8 0.15 50)",
              }}
            >
              <Clock className="w-3 h-3 mr-1" /> 3 pendentes
            </Badge>
            <Badge
              className="text-[10px] border-0"
              style={{
                background: "oklch(0.25 0.08 240 / 0.5)",
                color: "oklch(0.7 0.1 240)",
              }}
            >
              Formato: {exportFormat.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <ARIATogglePanel
          screenName="modulo-fiscal"
          toggles={[
            { key: "dctf", label: "DCTF" },
            { key: "ecd", label: "ECD" },
            { key: "ecf", label: "ECF" },
            { key: "transmissao", label: "Transmissão" },
          ]}
        />
        <Tabs defaultValue="dctf">
          <TabsList
            data-ocid="fiscal.tabs"
            className="mb-6 border-b border-white/10 bg-transparent p-0 h-auto gap-1"
          >
            {["dctf", "ecf", "ecd", "historico"].map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                data-ocid={`fiscal.${t}.tab`}
                className="px-4 py-2 rounded-t-lg text-xs font-semibold uppercase tracking-wider border border-transparent data-[state=active]:border-white/20 data-[state=active]:text-white data-[state=inactive]:text-white/40"
                style={{
                  background: "transparent",
                }}
              >
                {t === "historico" ? "Histórico" : t.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dctf">
            <DCTFTab exportFormat={exportFormat} onTransmit={handleTransmit} />
          </TabsContent>
          <TabsContent value="ecf">
            <ECFTab exportFormat={exportFormat} onTransmit={handleTransmit} />
          </TabsContent>
          <TabsContent value="ecd">
            <ECDTab exportFormat={exportFormat} onTransmit={handleTransmit} />
          </TabsContent>
          <TabsContent value="historico">
            <HistoricoTab historico={historico} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
