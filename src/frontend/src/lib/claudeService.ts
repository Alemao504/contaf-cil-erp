// Claude API service — called directly from the browser

export interface SuggestedEntry {
  id: string;
  debitoCode: string;
  creditoCode: string;
  valor: number; // in cents
  historico: string;
}

export interface DocumentAnalysis {
  tipo: string; // "NF-e" | "Extrato Bancário" | "Folha de Pagamento" | "Recibo" | "Outro"
  cnpj: string; // only digits
  valor: number; // in cents
  data: string; // YYYY-MM-DD
  descricao: string; // max 150 chars
  lancamentos: SuggestedEntry[];
}

const SYSTEM_PROMPT = `Você é uma IA contábil brasileira especializada em análise de documentos fiscais e contábeis.
Analise o documento fornecido e extraia as seguintes informações:
- tipo: tipo do documento (NF-e, Extrato Bancário, Folha de Pagamento, Recibo, Outro)
- cnpj: CNPJ do emitente/empresa (somente dígitos, sem pontos/traços/barra)
- valor: valor total em centavos (inteiro, sem casas decimais)
- data: data do documento no formato YYYY-MM-DD
- descricao: breve descrição do documento (máximo 150 caracteres)
- lancamentos: array com sugestões de lançamentos contábeis usando o plano de contas CFC (Conselho Federal de Contabilidade)

Cada lançamento deve ter:
- id: identificador único (UUID curto, ex: "l1", "l2")
- debitoCode: código da conta débito (ex: "1.1.01", "5.1.04")
- creditoCode: código da conta crédito (ex: "2.1.01", "1.1.02")
- valor: valor em centavos (inteiro)
- historico: histórico contábil resumido

NUNCA invente informações. Se um campo não for identificável, use string vazia ou 0.
Retorne APENAS JSON válido no formato:
{"tipo":"","cnpj":"","valor":0,"data":"","descricao":"","lancamentos":[{"id":"","debitoCode":"","creditoCode":"","valor":0,"historico":""}]}`;

const FALLBACK_ANALYSIS: DocumentAnalysis = {
  tipo: "Outro",
  cnpj: "",
  valor: 0,
  data: new Date().toISOString().slice(0, 10),
  descricao: "Documento não identificado",
  lancamentos: [],
};

function extractJson(text: string): string {
  // If wrapped in markdown code block, extract it
  const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (mdMatch) return mdMatch[1].trim();
  // Otherwise look for first { ... }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text;
}

export async function analyzeDocument(
  textOrBase64: string,
  filename: string,
  apiKey: string,
): Promise<DocumentAnalysis> {
  try {
    const isImage = textOrBase64.startsWith("[IMAGE_BASE64]");
    let content: object[];

    if (isImage) {
      const dataUrl = textOrBase64.slice("[IMAGE_BASE64]".length);
      const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
      const mediaType = (mimeMatch?.[1] ?? "image/jpeg") as
        | "image/jpeg"
        | "image/png"
        | "image/gif"
        | "image/webp";
      const base64Data = dataUrl.split(",")[1];
      content = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data: base64Data,
          },
        },
        {
          type: "text",
          text: `Arquivo: ${filename}\nAnalise este documento contábil e retorne o JSON solicitado.`,
        },
      ];
    } else {
      const truncated = textOrBase64.slice(0, 8000); // stay within context
      content = [
        {
          type: "text",
          text: `Arquivo: ${filename}\n\nConteúdo:\n${truncated}`,
        },
      ];
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-allow-cors": "true",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text ?? "";
    const jsonStr = extractJson(raw);
    const parsed = JSON.parse(jsonStr) as DocumentAnalysis;

    return {
      tipo: parsed.tipo ?? "Outro",
      cnpj: String(parsed.cnpj ?? "").replace(/\D/g, ""),
      valor: Number(parsed.valor ?? 0),
      data: parsed.data ?? new Date().toISOString().slice(0, 10),
      descricao: String(parsed.descricao ?? "").slice(0, 150),
      lancamentos: (parsed.lancamentos ?? []).map((l, i) => ({
        id: String(l.id ?? `l${i + 1}`),
        debitoCode: String(l.debitoCode ?? ""),
        creditoCode: String(l.creditoCode ?? ""),
        valor: Number(l.valor ?? 0),
        historico: String(l.historico ?? ""),
      })),
    };
  } catch (err) {
    console.error("analyzeDocument error:", err);
    return { ...FALLBACK_ANALYSIS };
  }
}
