import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  FileKey,
  Loader2,
  Send,
  Upload,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const TRANSMISSION_TYPES = [
  { id: "irpf", label: "IRPF — Declaração Pessoa Física" },
  { id: "irpj", label: "IRPJ — Declaração Pessoa Jurídica" },
  { id: "dctf", label: "DCTF — Declaração de Débitos Tributários" },
  { id: "ecd", label: "ECD — Escrituração Contábil Digital" },
  { id: "ecf", label: "ECF — Escrituração Contábil Fiscal" },
  { id: "esocial", label: "eSocial — Obrigações Trabalhistas" },
];

export function TransmissaoReceitaCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [certName, setCertName] = useState<string>(
    localStorage.getItem("contafacil_cert_name") || "",
  );
  const [certPassword, setCertPassword] = useState<string>(
    localStorage.getItem("contafacil_cert_password") || "",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [ambiente, setAmbiente] = useState<string>(
    localStorage.getItem("contafacil_transmissao_ambiente") || "homologacao",
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("contafacil_transmissao_tipos") || "[]",
      );
    } catch {
      return [];
    }
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("contafacil_transmissao_ambiente", ambiente);
  }, [ambiente]);

  useEffect(() => {
    localStorage.setItem(
      "contafacil_transmissao_tipos",
      JSON.stringify(selectedTypes),
    );
  }, [selectedTypes]);

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [".pfx", ".p12", ".pem", ".crt"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowed.includes(ext)) {
      toast.error("Formato não suportado. Use .pfx, .p12 ou .pem");
      return;
    }
    setCertName(file.name);
    localStorage.setItem("contafacil_cert_name", file.name);
    toast.success(`Certificado "${file.name}" carregado com sucesso`);
  };

  const handleSavePassword = () => {
    localStorage.setItem("contafacil_cert_password", certPassword);
    toast.success("Senha salva (armazenamento local simulado)");
  };

  const toggleType = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 2000));
    setTesting(false);
    setTestResult("simulated");
    toast.info("Conexão simulada — aguardando infraestrutura de servidor");
  };

  const hasCert = !!certName;
  const hasTypes = selectedTypes.length > 0;

  return (
    <Card
      data-ocid="config.transmissao.card"
      className="rounded-xl border-border shadow-sm overflow-hidden"
    >
      <CardHeader
        className="px-5 py-4 border-b border-border"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.13 0.05 200) 0%, oklch(0.16 0.08 170) 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-white">
              Transmissão à Receita Federal
            </CardTitle>
            <p className="text-xs text-white/60 mt-0.5">
              Configure certificado e tipos de transmissão
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Warning notice */}
        <div className="flex items-start gap-3 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-200/80 leading-relaxed">
            <span className="font-semibold text-yellow-300">Atenção:</span>{" "}
            Transmissão real requer certificado digital instalado em servidor
            dedicado. Esta configuração ficará pronta para uso futuro quando a
            infraestrutura for ativada.
          </p>
        </div>

        {/* Certificado Digital */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-2">
            <FileKey className="w-3.5 h-3.5 text-primary/70" />
            Certificado Digital (A1/A3)
          </Label>
          <div className="flex items-center gap-3">
            <div className="flex-1 px-3 py-2 rounded-md border border-border bg-muted/30 text-xs text-muted-foreground truncate">
              {certName || "Nenhum certificado carregado"}
            </div>
            <Button
              data-ocid="config.transmissao.upload_button"
              size="sm"
              variant="outline"
              className="text-xs shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Carregar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pfx,.p12,.pem,.crt"
              className="hidden"
              onChange={handleCertUpload}
            />
          </div>
        </div>

        {/* Senha do Certificado */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">
            Senha do Certificado
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                data-ocid="config.transmissao.input"
                type={showPassword ? "text" : "password"}
                value={certPassword}
                onChange={(e) => setCertPassword(e.target.value)}
                placeholder="Digite a senha do certificado"
                className="text-xs pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <Button
              data-ocid="config.transmissao.save_button"
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={handleSavePassword}
            >
              Salvar
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Armazenamento local simulado — não enviado a servidores externos.
          </p>
        </div>

        {/* Ambiente */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">
            Ambiente
          </Label>
          <Select value={ambiente} onValueChange={setAmbiente}>
            <SelectTrigger
              data-ocid="config.transmissao.select"
              className="text-xs h-9"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="homologacao">
                🧪 Homologação (testes)
              </SelectItem>
              <SelectItem value="producao">🚀 Produção (real)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipos de Transmissão */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">
            Tipos de Transmissão
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TRANSMISSION_TYPES.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors group"
                onClick={() => toggleType(t.id)}
                onKeyDown={(e) => e.key === "Enter" && toggleType(t.id)}
              >
                <Checkbox
                  id={`tx-type-${t.id}`}
                  data-ocid="config.transmissao.checkbox"
                  checked={selectedTypes.includes(t.id)}
                  onCheckedChange={() => toggleType(t.id)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label
                  htmlFor={`tx-type-${t.id}`}
                  className="text-xs text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer"
                >
                  {t.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Status de Configuração */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">
            Status de Configuração
          </Label>
          <div className="space-y-1.5 p-3 rounded-lg border border-border bg-muted/20">
            <StatusItem
              ok={hasCert}
              label={`Certificado: ${hasCert ? certName : "não carregado"}`}
            />
            <StatusItem
              ok={true}
              label={`Ambiente: ${ambiente === "producao" ? "Produção" : "Homologação"}`}
            />
            <StatusItem
              ok={hasTypes}
              label={`Tipos selecionados: ${hasTypes ? `${selectedTypes.length} tipo(s)` : "nenhum"}`}
            />
          </div>
        </div>

        {/* Testar Conexão */}
        <div className="flex items-center gap-3">
          <Button
            data-ocid="config.transmissao.primary_button"
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={testing}
            onClick={handleTestConnection}
          >
            {testing ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 mr-1.5" />
            )}
            {testing ? "Testando..." : "Testar Conexão"}
          </Button>
          {testResult === "simulated" && (
            <Badge
              variant="outline"
              className="text-[10px] border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
            >
              ⚠️ Conexão simulada — aguardando infraestrutura de servidor
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-destructive/70 shrink-0" />
      )}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
