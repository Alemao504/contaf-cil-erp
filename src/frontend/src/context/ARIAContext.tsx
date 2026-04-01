import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { type DocumentAnalysis, analyzeDocument } from "../lib/claudeService";
import { type OcrResult, getAllRecords, putRecord } from "../lib/db";
import { extractTextFromFile } from "../lib/ocrService";

export type { DocumentAnalysis };

export interface ARIAErrorDetail {
  file: string;
  line?: number;
  message: string;
}

export interface ARIACompletionData {
  processed: number;
  errors: number;
  resolved: number;
  files: string[];
}

export interface ARIAMessage {
  id: string;
  type:
    | "info"
    | "success"
    | "error"
    | "warning"
    | "system"
    | "completion"
    | "processing";
  text: string;
  timestamp: Date;
  filePath?: string;
  fileName?: string;
  clientName?: string;
  progress?: number;
  errorDetails?: ARIAErrorDetail[];
  isEditable?: boolean;
  editField?: string;
  resolved?: boolean;
  completionData?: ARIACompletionData;
}

export interface ARIASettings {
  autoMode: boolean;
  autoApproveEntries: boolean;
  autoComplete: boolean;
}

interface ARIAContextType {
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (v: boolean) => void;
  messages: ARIAMessage[];
  addMessage: (msg: Omit<ARIAMessage, "id" | "timestamp">) => void;
  updateMessage: (id: string, updates: Partial<ARIAMessage>) => void;
  clearHistory: () => void;
  unreadCount: number;
  clearUnread: () => void;
  settings: ARIASettings;
  updateSettings: (s: Partial<ARIASettings>) => void;
  startProcessingDemo: () => void;
  processRealDocument: (file: File, clientId: string) => Promise<void>;
  isProcessing: boolean;
  refreshPendingOcr: () => void;
  pendingOcrCount: number;
}

const ARIAContext = createContext<ARIAContextType | null>(null);

const DEFAULT_SETTINGS: ARIASettings = {
  autoMode: false,
  autoApproveEntries: false,
  autoComplete: false,
};

function loadSettings(): ARIASettings {
  try {
    const s = localStorage.getItem("ariaSettings");
    if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function loadMessages(): ARIAMessage[] {
  try {
    const s = sessionStorage.getItem("ariaMessages");
    if (s) {
      const parsed = JSON.parse(s);
      return parsed.map((m: ARIAMessage) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
    }
  } catch {}
  return [];
}

const DEMO_FILES = [
  {
    name: "NF_0091_EmpresaAlfa.pdf",
    client: "Empresa Alfa Ltda",
    cnpj: "12.345.678/0001-99",
  },
  {
    name: "EXTRATO_BB_JULHO.ofx",
    client: "Tech Solutions SA",
    cnpj: "98.765.432/0001-10",
  },
  {
    name: "FOLHA_JUL2026_ConstrutoraBeta.pdf",
    client: "Construtora Beta Ltda",
    cnpj: "11.222.333/0001-44",
  },
  {
    name: "NF_0034_Comercial.pdf",
    client: "Comercial Gama ME",
    cnpj: "44.555.666/0001-77",
  },
];

export function ARIAProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActiveState] = useState(() => {
    return localStorage.getItem("ariaActive") === "true";
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ARIAMessage[]>(loadMessages);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<ARIASettings>(loadSettings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingOcrCount, setPendingOcrCount] = useState(0);
  const demoRunning = useRef(false);

  useEffect(() => {
    try {
      sessionStorage.setItem("ariaMessages", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Load pending OCR count on mount
  const refreshPendingOcr = useCallback(() => {
    getAllRecords<OcrResult>("ocr_results")
      .then((all) => {
        setPendingOcrCount(all.filter((r) => r.status === "pending").length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshPendingOcr();
  }, [refreshPendingOcr]);

  const addMessage = useCallback(
    (msg: Omit<ARIAMessage, "id" | "timestamp">) => {
      const full: ARIAMessage = {
        ...msg,
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, full]);
      setUnreadCount((c) => c + 1);
      return full.id;
    },
    [],
  );

  const updateMessage = useCallback(
    (id: string, updates: Partial<ARIAMessage>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      );
    },
    [],
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    setUnreadCount(0);
    sessionStorage.removeItem("ariaMessages");
  }, []);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  const updateSettings = useCallback((s: Partial<ARIASettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...s };
      localStorage.setItem("ariaSettings", JSON.stringify(next));
      return next;
    });
  }, []);

  const setIsActive = useCallback((v: boolean) => {
    setIsActiveState(v);
    localStorage.setItem("ariaActive", String(v));
  }, []);

  const processRealDocument = useCallback(
    async (file: File, clientId: string) => {
      const apiKey = localStorage.getItem("claudeApiKey");
      const useReal = localStorage.getItem("useRealProcessing") === "true";

      if (!apiKey || !useReal) {
        addMessage({
          type: "warning",
          text: apiKey
            ? "⚠️ Processamento real desativado. Ative em Configurações → ARIA → Usar processamento real."
            : "⚠️ Claude API Key não configurada. Configure em Configurações → ARIA.",
        });
        setIsChatOpen(true);
        return;
      }

      setIsProcessing(true);
      setIsChatOpen(true);

      const docId = crypto.randomUUID();

      addMessage({
        type: "info",
        text: `📄 Lendo arquivo: ${file.name}...`,
        fileName: file.name,
      });

      try {
        addMessage({
          type: "info",
          text: "🔍 Extraindo texto com OCR...",
          fileName: file.name,
        });

        const extractedText = await extractTextFromFile(file);

        if (!extractedText.trim()) {
          addMessage({
            type: "error",
            text: `❌ Não foi possível extrair texto de ${file.name}. Tente lançamento manual.`,
            fileName: file.name,
            errorDetails: [
              { file: file.name, message: "Nenhum texto extraído pelo OCR" },
            ],
          });
          setIsProcessing(false);
          return;
        }

        const procId = `proc_real_${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: procId,
            type: "processing",
            text: "🧠 ARIA analisando com Claude AI...",
            timestamp: new Date(),
            fileName: file.name,
            progress: 20,
          },
        ]);
        setUnreadCount((c) => c + 1);

        const progressInterval = setInterval(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === procId && (m.progress ?? 0) < 85
                ? { ...m, progress: Math.min((m.progress ?? 20) + 5, 85) }
                : m,
            ),
          );
        }, 600);

        const analysis = await analyzeDocument(
          extractedText,
          file.name,
          apiKey,
        );

        clearInterval(progressInterval);
        updateMessage(procId, {
          progress: 100,
          type: "success",
          text: `✅ Análise concluída: ${file.name}`,
        });

        // Save to ocr_results IndexedDB
        const ocrResult: OcrResult = {
          id: docId,
          clientId,
          fileName: file.name,
          status: "pending",
          createdAt: new Date().toISOString(),
          analysis,
        };
        await putRecord("ocr_results", ocrResult);

        const valueFormatted = (analysis.valor / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });

        addMessage({
          type: "success",
          text: `✅ Documento analisado! Tipo: ${analysis.tipo} | CNPJ: ${analysis.cnpj || "n/a"} | Valor: ${valueFormatted} | Data: ${analysis.data}`,
          fileName: file.name,
        });

        if (settings.autoApproveEntries) {
          // Auto-approve: save lancamentos directly
          for (const l of analysis.lancamentos) {
            await putRecord("journal_entries", {
              id: `je_${docId}_${l.id}`,
              clientId,
              docId,
              debitCode: l.debitoCode,
              creditCode: l.creditoCode,
              valueInCents: l.valor,
              description: l.historico,
              entryDate: analysis.data,
              createdAt: new Date().toISOString(),
            });
          }
          // Update status to approved
          await putRecord("ocr_results", { ...ocrResult, status: "approved" });
          addMessage({
            type: "success",
            text: `✅ ${analysis.lancamentos.length} lançamentos criados automaticamente!`,
            fileName: file.name,
          });
        } else {
          addMessage({
            type: "warning",
            text: "⏳ Documento na fila de aprovação. Veja em Documentos → Pendentes.",
            fileName: file.name,
          });
        }

        refreshPendingOcr();
      } catch (err) {
        addMessage({
          type: "error",
          text: `❌ Falha ao processar ${file.name}: ${
            err instanceof Error ? err.message : "Erro desconhecido"
          }`,
          fileName: file.name,
          errorDetails: [
            {
              file: file.name,
              message: err instanceof Error ? err.message : "Erro desconhecido",
            },
          ],
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [addMessage, updateMessage, settings.autoApproveEntries, refreshPendingOcr],
  );

  const startProcessingDemo = useCallback(async () => {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    if (demoRunning.current) return;
    demoRunning.current = true;
    setIsProcessing(true);

    addMessage({
      type: "system",
      text: "🤖 ARIA iniciando monitoramento de pastas...",
    });

    await delay(800);
    addMessage({
      type: "info",
      text: "📂 Monitorando: Downloads/ | Documentos/ | Fotos/",
    });

    await delay(600);
    addMessage({
      type: "info",
      text: `🔍 ${DEMO_FILES.length} arquivos novos detectados. Iniciando processamento paralelo...`,
    });

    const processingIds: string[] = [];

    for (let i = 0; i < DEMO_FILES.length; i++) {
      const file = DEMO_FILES[i];
      await delay(300 * i);
      const id = `proc_${i}_${Date.now()}`;
      processingIds.push(id);
      setMessages((prev) => [
        ...prev,
        {
          id,
          type: "processing",
          text: `🔄 Processando: ${file.name}`,
          timestamp: new Date(),
          fileName: file.name,
          clientName: file.client,
          progress: 0,
        },
      ]);
      setUnreadCount((c) => c + 1);
    }

    const progressSteps = [10, 25, 40, 55, 70, 85, 100];
    for (const step of progressSteps) {
      await delay(350);
      for (let i = 0; i < processingIds.length; i++) {
        const pid = processingIds[i];
        if (i === 1 && step > 70) continue;
        updateMessage(pid, { progress: step });
      }
    }

    await delay(200);
    updateMessage(processingIds[0], {
      type: "success",
      text: "✅ NF_0091_EmpresaAlfa.pdf processado com sucesso",
      progress: 100,
    });
    addMessage({
      type: "info",
      text: `👤 Cliente identificado: ${DEMO_FILES[0].client}`,
      clientName: DEMO_FILES[0].client,
    });
    addMessage({
      type: "success",
      text: "📁 Pasta gerada: /Clientes/EmpresaAlfa/2026/NF-e/",
      filePath: "/Clientes/EmpresaAlfa/2026/NF-e/",
      fileName: DEMO_FILES[0].name,
    });

    await delay(400);
    addMessage({
      type: "warning",
      text: `⚠️ CNPJ inválido detectado em EXTRATO_BB_JULHO.ofx: "987654320001-10"`,
      fileName: DEMO_FILES[1].name,
      errorDetails: [
        {
          file: DEMO_FILES[1].name,
          line: 12,
          message: "CNPJ com formatação incorreta: 987654320001-10",
        },
      ],
    });

    await delay(1200);
    addMessage({
      type: "info",
      text: "🧠 ARIA tentando corrigir automaticamente...",
    });

    await delay(1500);
    addMessage({
      type: "success",
      text: "✅ ARIA resolveu automaticamente: CNPJ corrigido para 98.765.432/0001-10",
      resolved: true,
    });
    updateMessage(processingIds[1], {
      type: "success",
      text: "✅ EXTRATO_BB_JULHO.ofx processado (CNPJ auto-corrigido)",
      progress: 100,
    });
    addMessage({
      type: "success",
      text: "📁 Pasta gerada: /Clientes/TechSolutions/2026/Extratos/",
      filePath: "/Clientes/TechSolutions/2026/Extratos/",
      fileName: DEMO_FILES[1].name,
    });

    await delay(300);
    updateMessage(processingIds[2], {
      type: "success",
      text: "✅ FOLHA_JUL2026_ConstrutoraBeta.pdf processado com sucesso",
      progress: 100,
    });
    addMessage({
      type: "success",
      text: "📁 Pasta gerada: /Clientes/ConstrutoraBeta/2026/Folha/",
      filePath: "/Clientes/ConstrutoraBeta/2026/Folha/",
      fileName: DEMO_FILES[2].name,
    });

    await delay(500);
    addMessage({
      type: "error",
      text: `❌ Valor total ilegível em NF_0034_Comercial.pdf — OCR retornou "R$ ???,??"`,
      fileName: DEMO_FILES[3].name,
      isEditable: true,
      editField: "valorTotal",
      errorDetails: [
        {
          file: DEMO_FILES[3].name,
          line: 8,
          message: "Valor total ilegível pelo OCR — correção manual necessária",
        },
      ],
    });
    addMessage({
      type: "warning",
      text: "⚠️ ARIA não conseguiu resolver sozinha. Clique em ✏️ Editar para inserir o valor correto.",
    });
    updateMessage(processingIds[3], {
      type: "error",
      text: "⚠️ NF_0034_Comercial.pdf — aguardando correção manual",
      progress: 70,
    });

    await delay(600);

    const completionData: ARIACompletionData = {
      processed: 4,
      errors: 2,
      resolved: 1,
      files: DEMO_FILES.map((f) => f.name),
    };

    addMessage({
      type: "completion",
      text: "Processamento concluído",
      completionData,
      errorDetails: [
        {
          file: "EXTRATO_BB_JULHO.ofx",
          line: 12,
          message: "CNPJ com formatação incorreta — resolvido automaticamente",
        },
        {
          file: "NF_0034_Comercial.pdf",
          line: 8,
          message: "Valor total ilegível — aguardando correção manual",
        },
      ],
    });

    demoRunning.current = false;
    setIsProcessing(false);
  }, [addMessage, updateMessage]);

  const prevActive = useRef(isActive);
  useEffect(() => {
    if (isActive && !prevActive.current && !demoRunning.current) {
      setIsChatOpen(true);
      setTimeout(() => startProcessingDemo(), 500);
    }
    prevActive.current = isActive;
  }, [isActive, startProcessingDemo]);

  return (
    <ARIAContext.Provider
      value={{
        isActive,
        setIsActive,
        isChatOpen,
        setIsChatOpen,
        messages,
        addMessage,
        updateMessage,
        clearHistory,
        unreadCount,
        clearUnread,
        settings,
        updateSettings,
        startProcessingDemo,
        processRealDocument,
        isProcessing,
        refreshPendingOcr,
        pendingOcrCount,
      }}
    >
      {children}
    </ARIAContext.Provider>
  );
}

export function useARIA() {
  const ctx = useContext(ARIAContext);
  if (!ctx) throw new Error("useARIA must be inside ARIAProvider");
  return ctx;
}
