import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarClock,
  FileKey,
  KeyRound,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { isExpirando } from "../lib/certificadoService";
import type { CertificadoDigital } from "../lib/db";

interface Props {
  cert: CertificadoDigital;
  onDelete: (id: string) => void;
  index: number;
}

export function CertificadoDigitalCard({ cert, onDelete, index }: Props) {
  const expirando = isExpirando(cert.validade);
  const expirado = cert.status === "expirado";

  const validadeFmt = cert.validade
    ? new Date(cert.validade).toLocaleDateString("pt-BR")
    : "—";
  const uploadFmt = cert.armazenado
    ? new Date(cert.armazenado).toLocaleDateString("pt-BR")
    : "—";

  const badgeStyle = expirado
    ? { background: "oklch(0.92 0.08 20)", color: "oklch(0.38 0.14 20)" }
    : expirando
      ? { background: "oklch(0.94 0.1 80)", color: "oklch(0.4 0.14 80)" }
      : { background: "oklch(0.92 0.08 150)", color: "oklch(0.35 0.12 150)" };

  const badgeLabel = expirado ? "Expirado" : expirando ? "Expirando" : "Válido";

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card
      data-ocid={`cert.item.${index}`}
      className="rounded-xl border-border shadow-sm overflow-hidden"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: expirado
                ? "oklch(0.94 0.05 20)"
                : "oklch(0.92 0.06 240)",
            }}
          >
            <ShieldCheck
              className="w-5 h-5"
              style={{
                color: expirado ? "oklch(0.5 0.12 20)" : "oklch(0.45 0.15 240)",
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-semibold truncate">
                {cert.nome}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge
                  className="text-[10px] border-0"
                  style={{
                    background: "oklch(0.92 0.06 240)",
                    color: "oklch(0.3 0.1 240)",
                  }}
                >
                  {cert.tipo}
                </Badge>
                <Badge className="text-[10px] border-0" style={badgeStyle}>
                  {badgeLabel}
                </Badge>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-muted-foreground truncate">
                  {cert.cnpj}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileKey className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-muted-foreground truncate">
                  {cert.razaoSocial}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarClock className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-muted-foreground">
                  Validade: {validadeFmt}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">
                  Upload: {uploadFmt} · {formatBytes(cert.tamanho)}
                </span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            data-ocid={`cert.delete_button.${index}`}
            size="sm"
            variant="ghost"
            className="shrink-0 h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (window.confirm(`Excluir o certificado "${cert.nome}"?`)) {
                onDelete(cert.id);
              }
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
