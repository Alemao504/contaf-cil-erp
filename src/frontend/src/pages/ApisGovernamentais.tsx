import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Download,
  FileText,
  Globe,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Settings,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import { getRecord, putRecord } from "../lib/db";
import {
  type CNPJResult,
  DEFAULT_ESOCIAL_EVENTOS,
  type ESocialEvento,
  type ESocialResult,
  type NFeResult,
  type SPEDTipo,
  consultarCNPJ,
  consultarNFe,
  enviarESocial,
  gerarSPED,
} from "../lib/govApiService";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatCnpjMask(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatChaveAcesso(v: string) {
  return v.replace(/\D/g, "").slice(0, 44);
}

function formatMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

// ─── Mode badge ───────────────────────────────────────────────────────────────

function ModeBadge({
  useReal,
  onClick,
}: { useReal: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors hover:opacity-80"
      style={{
        background: useReal
          ? "oklch(0.22 0.1 150 / 0.3)"
          : "oklch(0.25 0.08 40 / 0.3)",
        color: useReal ? "oklch(0.7 0.18 150)" : "oklch(0.75 0.15 60)",
        border: `1px solid ${useReal ? "oklch(0.4 0.12 150 / 0.4)" : "oklch(0.4 0.1 60 / 0.4)"}`,
      }}
    >
      <span>{useReal ? "🟢" : "🔴"}</span>
      {useReal ? "APIs Reais Ativas" : "Modo Simulado"}
      <Settings className="w-3 h-3 ml-0.5 opacity-60" />
    </button>
  );
}

// ─── CNPJ Tab ─────────────────────────────────────────────────────────────────

function CNPJTab({ useReal }: { useReal: boolean }) {
  const [cnpjInput, setCnpjInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CNPJResult | null>(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const handleConsultar = async () => {
    const digits = cnpjInput.replace(/\D/g, "");
    if (digits.length < 14) {
      toast.error("CNPJ deve ter 14 dígitos");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = await consultarCNPJ(digits, useReal);
      setResult(r);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao consultar CNPJ";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleImportarCliente = async () => {
    if (!result) return;
    setImporting(true);
    try {
      const id = `client-cnpj-${result.cnpj}`;
      await putRecord("clients", {
        id,
        name: result.razaoSocial,
        cnpj: result.cnpj.replace(
          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
          "$1.$2.$3/$4-$5",
        ),
        regime: "Simples Nacional",
        active: true,
        nomeFantasia: result.nomeFantasia,
        telefone: result.telefone,
        email: result.email,
        endereco: result.endereco,
      });
      toast.success(`${result.razaoSocial} importado como cliente!`);
    } catch {
      toast.error("Erro ao importar cliente");
    } finally {
      setImporting(false);
    }
  };

  const situacaoCor = (s: string): { background: string; color: string } => {
    if (s.includes("ATIVA"))
      return {
        background: "oklch(0.2 0.1 150 / 0.4)",
        color: "oklch(0.7 0.18 150)",
      };
    if (s.includes("SUSP") || s.includes("INAPT"))
      return {
        background: "oklch(0.22 0.1 20 / 0.4)",
        color: "oklch(0.75 0.15 20)",
      };
    return {
      background: "oklch(0.22 0.04 240 / 0.4)",
      color: "oklch(0.65 0.05 240)",
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-xs mb-1.5 block text-white/70">CNPJ</Label>
          <Input
            data-ocid="govapi.cnpj.input"
            className="h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30"
            placeholder="00.000.000/0000-00"
            value={cnpjInput}
            onChange={(e) => setCnpjInput(formatCnpjMask(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && handleConsultar()}
          />
        </div>
        <Button
          type="button"
          data-ocid="govapi.cnpj.submit_button"
          size="sm"
          className="self-end h-9 px-4 text-xs font-semibold"
          style={{ background: "oklch(0.45 0.18 240)", color: "white" }}
          onClick={handleConsultar}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          <span className="ml-1.5">
            {loading ? "Consultando..." : "Consultar"}
          </span>
        </Button>
      </div>

      {error && (
        <div
          data-ocid="govapi.cnpj.error_state"
          className="flex items-start gap-2 p-3 rounded-lg"
          style={{
            background: "oklch(0.2 0.08 20 / 0.3)",
            border: "1px solid oklch(0.4 0.1 20 / 0.3)",
          }}
        >
          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {loading && (
        <div data-ocid="govapi.cnpj.loading_state" className="space-y-3">
          {[1, 2, 3].map((k) => (
            <div
              key={k}
              className="h-8 rounded-lg animate-pulse"
              style={{ background: "oklch(0.25 0.03 240 / 0.5)" }}
            />
          ))}
        </div>
      )}

      {result && (
        <Card
          data-ocid="govapi.cnpj.card"
          className="border-white/10 overflow-hidden"
          style={{ background: "oklch(0.17 0.04 240 / 0.8)" }}
        >
          <CardHeader className="px-4 py-3 border-b border-white/8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-white">
                  {result.razaoSocial}
                </CardTitle>
                {result.nomeFantasia && (
                  <p className="text-xs text-white/50 mt-0.5">
                    {result.nomeFantasia}
                  </p>
                )}
              </div>
              <Badge
                className="shrink-0 text-[10px] border-0 font-semibold"
                style={situacaoCor(result.situacaoCadastral)}
              >
                {result.situacaoCadastral}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "CNPJ",
                  value: result.cnpj.replace(
                    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                    "$1.$2.$3/$4-$5",
                  ),
                },
                {
                  label: "Data de Abertura",
                  value: formatDate(result.dataAbertura),
                },
                {
                  label: "Capital Social",
                  value: formatMoeda(result.capitalSocial),
                },
                { label: "Porte", value: result.porte },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">
                    {item.label}
                  </p>
                  <p className="text-xs font-medium text-white/85">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <Separator className="bg-white/8" />

            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                Atividade Principal (CNAE)
              </p>
              <p className="text-xs text-white/80">
                <span
                  className="font-mono mr-1.5"
                  style={{ color: "oklch(0.7 0.15 195)" }}
                >
                  {result.atividadePrincipal.codigo}
                </span>
                {result.atividadePrincipal.descricao}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                Natureza Jurídica
              </p>
              <p className="text-xs text-white/80">{result.naturezaJuridica}</p>
            </div>

            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                Endereço
              </p>
              <p className="text-xs text-white/80">
                {result.endereco.logradouro}, {result.endereco.numero}
                {result.endereco.complemento
                  ? ` — ${result.endereco.complemento}`
                  : ""}{" "}
                • {result.endereco.bairro} • {result.endereco.municipio}/
                {result.endereco.uf} • CEP {result.endereco.cep}
              </p>
            </div>

            {result.qsa.length > 0 && (
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                  Quadro de Sócios e Administradores
                </p>
                <div className="space-y-1.5">
                  {result.qsa.map((s) => (
                    <div
                      key={s.nome}
                      className="flex items-center justify-between px-3 py-2 rounded-lg"
                      style={{ background: "oklch(0.22 0.04 240 / 0.5)" }}
                    >
                      <div>
                        <p className="text-xs font-medium text-white/85">
                          {s.nome}
                        </p>
                        <p className="text-[10px] text-white/40">
                          {s.qualificacao}
                        </p>
                      </div>
                      {s.participacao && (
                        <Badge
                          className="text-[10px] border-0"
                          style={{
                            background: "oklch(0.3 0.1 240 / 0.5)",
                            color: "oklch(0.75 0.12 240)",
                          }}
                        >
                          {s.participacao}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="button"
              data-ocid="govapi.cnpj.import.button"
              size="sm"
              className="w-full text-xs font-semibold"
              style={{ background: "oklch(0.4 0.18 150)", color: "white" }}
              onClick={handleImportarCliente}
              disabled={importing}
            >
              {importing ? (
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              ) : (
                <BadgeCheck className="w-3 h-3 mr-1.5" />
              )}
              {importing ? "Importando..." : "Importar como Cliente"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── SEFAZ Tab ────────────────────────────────────────────────────────────────

function SEFAZTab({ useReal }: { useReal: boolean }) {
  const [chave, setChave] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NFeResult | null>(null);
  const [error, setError] = useState("");

  const handleConsultar = async () => {
    const digits = chave.replace(/\D/g, "");
    if (digits.length < 44) {
      toast.error("Chave de acesso deve ter 44 dígitos");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = await consultarNFe(digits, useReal);
      setResult(r);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao consultar NF-e";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<
    string,
    { bg: string; text: string; icon: typeof CheckCircle2 }
  > = {
    autorizada: {
      bg: "oklch(0.2 0.1 150 / 0.4)",
      text: "oklch(0.7 0.18 150)",
      icon: CheckCircle2,
    },
    cancelada: {
      bg: "oklch(0.22 0.1 20 / 0.4)",
      text: "oklch(0.75 0.15 20)",
      icon: XCircle,
    },
    denegada: {
      bg: "oklch(0.22 0.1 20 / 0.4)",
      text: "oklch(0.75 0.15 20)",
      icon: XCircle,
    },
    inutilizada: {
      bg: "oklch(0.22 0.04 240 / 0.4)",
      text: "oklch(0.65 0.05 240)",
      icon: Circle,
    },
    pendente: {
      bg: "oklch(0.22 0.08 60 / 0.4)",
      text: "oklch(0.75 0.15 60)",
      icon: Clock,
    },
  };

  return (
    <div className="space-y-4">
      {!useReal && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg text-xs"
          style={{
            background: "oklch(0.22 0.08 60 / 0.2)",
            border: "1px solid oklch(0.4 0.1 60 / 0.3)",
          }}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-200/80">
            Modo simulado — a consulta SEFAZ real requer certificado digital
            A1/A3 e comunicação via WebService SOAP. Os dados retornados são
            realistas para demonstração.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-xs mb-1.5 block text-white/70">
            Chave de Acesso NF-e (44 dígitos)
          </Label>
          <Input
            data-ocid="govapi.nfe.input"
            className="h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono"
            placeholder="00000000000000000000000000000000000000000000"
            value={chave}
            onChange={(e) => setChave(formatChaveAcesso(e.target.value))}
            maxLength={44}
          />
          <p className="text-[10px] text-white/30 mt-1">
            {chave.replace(/\D/g, "").length}/44 dígitos
          </p>
        </div>
        <Button
          type="button"
          data-ocid="govapi.nfe.submit_button"
          size="sm"
          className="self-start mt-5 h-9 px-4 text-xs font-semibold"
          style={{ background: "oklch(0.45 0.18 240)", color: "white" }}
          onClick={handleConsultar}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          <span className="ml-1.5">
            {loading ? "Consultando..." : "Consultar"}
          </span>
        </Button>
      </div>

      {error && (
        <div
          data-ocid="govapi.nfe.error_state"
          className="flex items-start gap-2 p-3 rounded-lg"
          style={{
            background: "oklch(0.2 0.08 20 / 0.3)",
            border: "1px solid oklch(0.4 0.1 20 / 0.3)",
          }}
        >
          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {loading && (
        <div data-ocid="govapi.nfe.loading_state" className="space-y-2">
          {[1, 2, 3].map((k) => (
            <div
              key={k}
              className="h-8 rounded animate-pulse"
              style={{ background: "oklch(0.25 0.03 240 / 0.5)" }}
            />
          ))}
        </div>
      )}

      {result && (
        <Card
          data-ocid="govapi.nfe.card"
          className="border-white/10"
          style={{ background: "oklch(0.17 0.04 240 / 0.8)" }}
        >
          <CardHeader className="px-4 py-3 border-b border-white/8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-white">
                  NF-e nº {result.numero} — Série {result.serie}
                </CardTitle>
                <p className="text-xs text-white/40 mt-0.5">
                  {result.naturezaOperacao}
                </p>
              </div>
              {(() => {
                const s =
                  statusColors[result.situacaoAtual] ?? statusColors.pendente;
                const Icon = s.icon;
                return (
                  <Badge
                    className="text-[10px] border-0 font-semibold flex items-center gap-1"
                    style={{ background: s.bg, color: s.text }}
                  >
                    <Icon className="w-3 h-3" />
                    {result.situacaoAtual.toUpperCase()}
                  </Badge>
                );
              })()}
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">
                  Emitente
                </p>
                <p className="text-xs font-medium text-white/85">
                  {result.emitente.razaoSocial}
                </p>
                <p className="text-[11px] text-white/40">
                  {result.emitente.cnpj}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">
                  Destinatário
                </p>
                <p className="text-xs font-medium text-white/85">
                  {result.destinatario.razaoSocial}
                </p>
                <p className="text-[11px] text-white/40">
                  {result.destinatario.cnpj}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">
                  Data de Emissão
                </p>
                <p className="text-xs font-medium text-white/85">
                  {formatDate(result.dataEmissao)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">
                  Valor Total
                </p>
                <p
                  className="text-xs font-bold"
                  style={{ color: "oklch(0.7 0.18 150)" }}
                >
                  {formatMoeda(result.valorTotal)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                Chave de Acesso
              </p>
              <p className="text-[10px] font-mono text-white/50 break-all">
                {result.chaveAcesso}
              </p>
            </div>

            <Separator className="bg-white/8" />

            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                Timeline de Eventos
              </p>
              <div className="space-y-2">
                {result.eventos.map((ev) => {
                  const s = statusColors[ev.status] ?? statusColors.pendente;
                  const Icon = s.icon;
                  return (
                    <div
                      key={ev.protocolo ?? ev.descricao}
                      className="flex items-start gap-3 px-3 py-2 rounded-lg"
                      style={{ background: "oklch(0.22 0.04 240 / 0.5)" }}
                    >
                      <Icon
                        className="w-4 h-4 mt-0.5 shrink-0"
                        style={{ color: s.text }}
                      />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-white/85">
                          {ev.descricao}
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          Protocolo: {ev.protocolo} • {formatDate(ev.data)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── eSocial Tab ──────────────────────────────────────────────────────────────

function ESocialTab({ useReal }: { useReal: boolean }) {
  const [eventos, setEventos] = useState<ESocialEvento[]>(
    DEFAULT_ESOCIAL_EVENTOS,
  );
  const [logs, setLogs] = useState<{ id: string; msg: string; ts: string }[]>(
    [],
  );
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const addLog = (id: string, msg: string) =>
    setLogs((p) => [
      { id, msg, ts: new Date().toLocaleTimeString("pt-BR") },
      ...p,
    ]);

  const handleEnviar = async (ev: ESocialEvento) => {
    setSendingId(ev.id);
    addLog(ev.id, `Iniciando envio ${ev.tipo}...`);
    try {
      const r: ESocialResult = await enviarESocial(ev, useReal);
      setEventos((prev) =>
        prev.map((e) =>
          e.id === ev.id
            ? {
                ...e,
                status: r.status === "processado" ? "enviado" : "erro",
                protocolo: r.protocolo,
                dataEnvio: r.dataRecibo,
              }
            : e,
        ),
      );
      addLog(ev.id, `✅ ${ev.tipo} processado — Protocolo: ${r.protocolo}`);
      toast.success(`Evento ${ev.tipo} enviado com sucesso!`);
    } catch {
      setEventos((prev) =>
        prev.map((e) => (e.id === ev.id ? { ...e, status: "erro" } : e)),
      );
      addLog(ev.id, `❌ Erro ao enviar ${ev.tipo}`);
      toast.error(`Erro ao enviar ${ev.tipo}`);
    } finally {
      setSendingId(null);
    }
  };

  const handleEnviarTodos = async () => {
    const pendentes = eventos.filter(
      (e) => e.status === "pendente" || e.status === "erro",
    );
    if (!pendentes.length) {
      toast.info("Nenhum evento pendente");
      return;
    }
    setSendingAll(true);
    for (const ev of pendentes) await handleEnviar(ev);
    setSendingAll(false);
  };

  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string; icon: typeof Circle }
  > = {
    pendente: {
      bg: "oklch(0.22 0.08 60 / 0.4)",
      text: "oklch(0.75 0.15 60)",
      label: "Pendente",
      icon: Clock,
    },
    enviado: {
      bg: "oklch(0.2 0.1 150 / 0.4)",
      text: "oklch(0.7 0.18 150)",
      label: "Enviado",
      icon: CheckCircle2,
    },
    erro: {
      bg: "oklch(0.22 0.1 20 / 0.4)",
      text: "oklch(0.75 0.15 20)",
      label: "Erro",
      icon: XCircle,
    },
    aguardando: {
      bg: "oklch(0.22 0.04 240 / 0.4)",
      text: "oklch(0.65 0.05 240)",
      label: "Aguardando",
      icon: Circle,
    },
    processado: {
      bg: "oklch(0.2 0.1 150 / 0.4)",
      text: "oklch(0.7 0.18 150)",
      label: "Processado",
      icon: CheckCircle2,
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">
          {eventos.length} eventos —{" "}
          {eventos.filter((e) => e.status === "pendente").length} pendentes
        </p>
        <Button
          type="button"
          data-ocid="govapi.esocial.send_all.button"
          size="sm"
          className="text-xs font-semibold"
          style={{ background: "oklch(0.45 0.18 240)", color: "white" }}
          onClick={handleEnviarTodos}
          disabled={sendingAll}
        >
          {sendingAll ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5 mr-1.5" />
          )}
          Enviar Todos Pendentes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-2" data-ocid="govapi.esocial.list">
          {eventos.map((ev) => {
            const sc = statusConfig[ev.status] ?? statusConfig.aguardando;
            const Icon = sc.icon;
            const isSending = sendingId === ev.id;
            return (
              <div
                key={ev.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl border"
                style={{
                  background: "oklch(0.17 0.04 240 / 0.8)",
                  borderColor: "oklch(0.3 0.05 240 / 0.4)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{
                    background: "oklch(0.25 0.08 240 / 0.6)",
                    color: "oklch(0.7 0.15 195)",
                  }}
                >
                  {ev.tipo.split("-")[1]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-white">
                      {ev.tipo}
                    </p>
                    <Badge
                      className="text-[9px] border-0 py-0"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      <Icon className="w-2.5 h-2.5 mr-0.5" />
                      {sc.label}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-white/50 truncate mt-0.5">
                    {ev.descricao}
                  </p>
                  {ev.protocolo && (
                    <p className="text-[10px] text-white/30 mt-0.5 font-mono">
                      {ev.protocolo}
                    </p>
                  )}
                </div>
                {(ev.status === "pendente" || ev.status === "erro") && (
                  <Button
                    type="button"
                    data-ocid={"govapi.esocial.send.button"}
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-white/40 hover:text-white hover:bg-white/10 shrink-0"
                    onClick={() => handleEnviar(ev)}
                    disabled={isSending || sendingAll}
                  >
                    {isSending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="rounded-xl border overflow-hidden"
          style={{
            background: "oklch(0.13 0.04 240 / 0.9)",
            borderColor: "oklch(0.3 0.05 240 / 0.4)",
          }}
        >
          <div
            className="px-3 py-2 border-b flex items-center gap-2"
            style={{ borderColor: "oklch(0.3 0.05 240 / 0.4)" }}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[11px] text-white/50 font-mono">
              Log de transmissão
            </p>
          </div>
          <ScrollArea className="h-48">
            <div className="p-3 space-y-1.5">
              {logs.length === 0 ? (
                <p className="text-[11px] text-white/25 font-mono">
                  Aguardando transmissão...
                </p>
              ) : (
                logs.map((l) => (
                  <div key={`${l.ts}-${l.msg}`} className="flex gap-2">
                    <span className="text-[10px] text-white/25 font-mono shrink-0">
                      {l.ts}
                    </span>
                    <span className="text-[11px] text-white/70 font-mono">
                      {l.msg}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// ─── SPED Tab ────────────────────────────────────────────────────────────────

const SPED_INFO: Record<
  SPEDTipo,
  { label: string; desc: string; color: string }
> = {
  ECD: {
    label: "ECD — Escrituração Contábil Digital",
    desc: "Livros contábeis (Diário, Razão, Balancete). Transmissão anual via PGE do SPED.",
    color: "oklch(0.5 0.18 240)",
  },
  ECF: {
    label: "ECF — Escrituração Contábil Fiscal",
    desc: "Apuração do IRPJ e CSLL. Inclui dados do Lalur e Lacs. Anual.",
    color: "oklch(0.5 0.18 195)",
  },
  EFD_ICMS: {
    label: "EFD ICMS/IPI",
    desc: "Registros de entradas, saídas e apuração de ICMS e IPI. Mensal.",
    color: "oklch(0.5 0.18 150)",
  },
  EFD_Contrib: {
    label: "EFD Contribuições (PIS/COFINS)",
    desc: "Apuração de PIS e COFINS. Inclui créditos e débitos. Mensal.",
    color: "oklch(0.5 0.18 60)",
  },
};

function SPEDTab({ useReal }: { useReal: boolean }) {
  const [tipo, setTipo] = useState<SPEDTipo>("ECD");
  const [periodo, setPeriodo] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(false);
  const [conteudo, setConteudo] = useState("");

  const handleGerar = async () => {
    setLoading(true);
    setConteudo("");
    try {
      const txt = await gerarSPED(tipo, periodo, useReal);
      setConteudo(txt);
      toast.success("Arquivo SPED gerado!");
    } catch {
      toast.error("Erro ao gerar SPED");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SPED_${tipo}_${periodo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo .txt baixado!");
  };

  const info = SPED_INFO[tipo];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs mb-2 block text-white/70">
          Tipo de Escrituração
        </Label>
        <RadioGroup
          value={tipo}
          onValueChange={(v) => setTipo(v as SPEDTipo)}
          className="space-y-2"
          data-ocid="govapi.sped.tipo.radio"
        >
          {(Object.keys(SPED_INFO) as SPEDTipo[]).map((t) => {
            const inf = SPED_INFO[t];
            return (
              <div
                key={t}
                className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                style={{
                  background:
                    tipo === t
                      ? "oklch(0.2 0.07 240 / 0.6)"
                      : "oklch(0.17 0.04 240 / 0.5)",
                  borderColor:
                    tipo === t ? inf.color : "oklch(0.3 0.05 240 / 0.3)",
                }}
              >
                <RadioGroupItem
                  value={t}
                  id={`sped-${t}`}
                  data-ocid={`govapi.sped.${t.toLowerCase()}.radio`}
                  className="mt-0.5"
                />
                <label htmlFor={`sped-${t}`} className="cursor-pointer flex-1">
                  <p className="text-xs font-semibold text-white">
                    {inf.label}
                  </p>
                  <p className="text-[11px] text-white/40 mt-0.5">{inf.desc}</p>
                </label>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      <div className="flex items-end gap-3">
        <div>
          <Label className="text-xs mb-1.5 block text-white/70">
            Período (Mês/Ano)
          </Label>
          <Input
            type="month"
            data-ocid="govapi.sped.periodo.input"
            className="h-9 text-sm bg-white/5 border-white/10 text-white w-44"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          />
        </div>
        <Button
          type="button"
          data-ocid="govapi.sped.gerar.button"
          size="sm"
          className="h-9 text-xs font-semibold"
          style={{ background: "oklch(0.45 0.18 240)", color: "white" }}
          onClick={handleGerar}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5 mr-1.5" />
          )}
          {loading ? "Gerando..." : "Gerar Arquivo SPED"}
        </Button>
      </div>

      {loading && (
        <div data-ocid="govapi.sped.loading_state" className="space-y-2">
          {[1, 2].map((k) => (
            <div
              key={k}
              className="h-8 rounded animate-pulse"
              style={{ background: "oklch(0.25 0.03 240 / 0.5)" }}
            />
          ))}
        </div>
      )}

      {conteudo && (
        <div data-ocid="govapi.sped.preview.card" className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50">
              {conteudo.split("\n").length} registros gerados
            </p>
            <Button
              type="button"
              data-ocid="govapi.sped.download.button"
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 border-white/20 text-white/70 hover:text-white hover:bg-white/10"
              onClick={handleDownload}
            >
              <Download className="w-3 h-3" />
              Download .txt
            </Button>
          </div>
          <div
            className="rounded-xl overflow-hidden border"
            style={{
              background: "oklch(0.13 0.04 240 / 0.9)",
              borderColor: "oklch(0.3 0.05 240 / 0.4)",
            }}
          >
            <div
              className="px-3 py-2 border-b flex items-center gap-2"
              style={{ borderColor: "oklch(0.3 0.05 240 / 0.4)" }}
            >
              <FileText className="w-3.5 h-3.5" style={{ color: info.color }} />
              <p className="text-[11px] text-white/50 font-mono">
                SPED_{tipo}_{periodo}.txt
              </p>
            </div>
            <ScrollArea className="h-48">
              <pre className="p-3 text-[11px] text-emerald-300/80 font-mono whitespace-pre">
                {conteudo.split("\n").slice(0, 20).join("\n")}
              </pre>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApisGovernamentais() {
  const { setCurrentPage } = useAppContext();
  const [useReal, setUseReal] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecord<{ key: string; value: boolean }>("configuracoes", "govApiReal")
      .then((rec) => {
        if (rec?.value !== undefined) {
          setUseReal(Boolean(rec.value));
        } else {
          putRecord("configuracoes", { key: "govApiReal", value: true }).catch(
            () => {},
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const _handleToggleReal = async () => {
    const next = !useReal;
    setUseReal(next);
    await putRecord("configuracoes", { key: "govApiReal", value: next }).catch(
      () => {},
    );
    toast.success(next ? "APIs reais ativadas" : "Modo simulado ativado");
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "oklch(0.14 0.04 240)" }}
    >
      {/* Header */}
      <header
        className="no-print flex items-center justify-between px-6 py-4 border-b"
        style={{
          borderColor: "oklch(0.25 0.05 240 / 0.6)",
          background: "oklch(0.16 0.06 240 / 0.9)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(0.3 0.15 240 / 0.4)" }}
          >
            <Globe
              className="w-5 h-5"
              style={{ color: "oklch(0.7 0.18 240)" }}
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">
              APIs Governamentais
            </h1>
            <p className="text-[11px] text-white/40 mt-0.5">
              SEFAZ • eSocial • Receita Federal • SPED
            </p>
          </div>
        </div>
        <ModeBadge
          useReal={useReal}
          onClick={() => setCurrentPage("configuracoes")}
        />
      </header>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div data-ocid="govapi.loading_state" className="space-y-3">
            {[1, 2, 3].map((k) => (
              <div
                key={k}
                className="h-12 rounded-xl animate-pulse"
                style={{ background: "oklch(0.2 0.04 240 / 0.5)" }}
              />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="cnpj" className="space-y-4">
            <TabsList
              className="grid grid-cols-4 w-full h-10 p-1"
              style={{
                background: "oklch(0.18 0.05 240 / 0.8)",
                border: "1px solid oklch(0.28 0.06 240 / 0.4)",
              }}
            >
              {[
                { value: "cnpj", label: "Consulta CNPJ", icon: Search },
                { value: "sefaz", label: "SEFAZ / NF-e", icon: FileText },
                { value: "esocial", label: "eSocial", icon: Send },
                { value: "sped", label: "SPED", icon: Download },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    data-ocid={`govapi.${tab.value}.tab`}
                    className="flex items-center gap-1.5 text-xs font-medium text-white/50 data-[state=active]:text-white data-[state=active]:bg-white/10"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="cnpj">
              <div
                className="rounded-xl border p-5"
                style={{
                  background: "oklch(0.16 0.04 240 / 0.6)",
                  borderColor: "oklch(0.28 0.06 240 / 0.4)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Search
                    className="w-4 h-4"
                    style={{ color: "oklch(0.65 0.15 240)" }}
                  />
                  <h2 className="text-sm font-semibold text-white">
                    Consulta CNPJ — Receita Federal
                  </h2>
                  <Badge
                    className="ml-auto text-[10px] border-0"
                    style={
                      useReal
                        ? {
                            background: "oklch(0.2 0.1 150 / 0.4)",
                            color: "oklch(0.7 0.18 150)",
                          }
                        : {
                            background: "oklch(0.22 0.08 60 / 0.3)",
                            color: "oklch(0.7 0.12 60)",
                          }
                    }
                  >
                    {useReal ? "BrasilAPI — Real" : "Dados Simulados"}
                  </Badge>
                </div>
                <CNPJTab useReal={useReal} />
              </div>
            </TabsContent>

            <TabsContent value="sefaz">
              <div
                className="rounded-xl border p-5"
                style={{
                  background: "oklch(0.16 0.04 240 / 0.6)",
                  borderColor: "oklch(0.28 0.06 240 / 0.4)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <FileText
                    className="w-4 h-4"
                    style={{ color: "oklch(0.65 0.15 195)" }}
                  />
                  <h2 className="text-sm font-semibold text-white">
                    SEFAZ — Consulta NF-e
                  </h2>
                  <Badge
                    className="ml-auto text-[10px] border-0"
                    style={{
                      background: "oklch(0.22 0.08 60 / 0.3)",
                      color: "oklch(0.7 0.12 60)",
                    }}
                  >
                    Requer certificado A1/A3
                  </Badge>
                </div>
                <SEFAZTab useReal={useReal} />
              </div>
            </TabsContent>

            <TabsContent value="esocial">
              <div
                className="rounded-xl border p-5"
                style={{
                  background: "oklch(0.16 0.04 240 / 0.6)",
                  borderColor: "oklch(0.28 0.06 240 / 0.4)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Send
                    className="w-4 h-4"
                    style={{ color: "oklch(0.65 0.15 150)" }}
                  />
                  <h2 className="text-sm font-semibold text-white">
                    eSocial — Eventos
                  </h2>
                  <Badge
                    className="ml-auto text-[10px] border-0"
                    style={{
                      background: "oklch(0.22 0.08 60 / 0.3)",
                      color: "oklch(0.7 0.12 60)",
                    }}
                  >
                    Requer certificado + habilitação
                  </Badge>
                </div>
                <ESocialTab useReal={useReal} />
              </div>
            </TabsContent>

            <TabsContent value="sped">
              <div
                className="rounded-xl border p-5"
                style={{
                  background: "oklch(0.16 0.04 240 / 0.6)",
                  borderColor: "oklch(0.28 0.06 240 / 0.4)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Download
                    className="w-4 h-4"
                    style={{ color: "oklch(0.65 0.15 60)" }}
                  />
                  <h2 className="text-sm font-semibold text-white">
                    SPED — Geração de Arquivo
                  </h2>
                  <Badge
                    className="ml-auto text-[10px] border-0"
                    style={{
                      background: "oklch(0.2 0.1 150 / 0.4)",
                      color: "oklch(0.7 0.18 150)",
                    }}
                  >
                    Geração Local
                  </Badge>
                </div>
                <SPEDTab useReal={useReal} />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <footer
        className="no-print px-6 py-3 border-t"
        style={{ borderColor: "oklch(0.25 0.05 240 / 0.5)" }}
      >
        <p className="text-[11px] text-white/30 text-center">
          © {new Date().getFullYear()}. Feito com ❤️ usando{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/60"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
