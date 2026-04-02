import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Info,
  Loader2,
  Mic,
  MicOff,
  PencilLine,
  Send,
  Trash2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type ARIAMessage, useARIA } from "../context/ARIAContext";
import { useAppContext } from "../context/AppContext";

// Check for SpeechRecognition support
const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    : null;

function MessageIcon({ type }: { type: ARIAMessage["type"] }) {
  if (type === "success")
    return (
      <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
    );
  if (type === "error")
    return <XCircle size={13} className="text-red-400 shrink-0 mt-0.5" />;
  if (type === "warning")
    return (
      <AlertTriangle size={13} className="text-yellow-400 shrink-0 mt-0.5" />
    );
  if (type === "system")
    return <Zap size={13} className="text-cyan-400 shrink-0 mt-0.5" />;
  if (type === "processing")
    return (
      <Loader2
        size={13}
        className="text-blue-400 shrink-0 mt-0.5 animate-spin"
      />
    );
  if (type === "completion")
    return <CheckCircle2 size={13} className="text-cyan-400 shrink-0 mt-0.5" />;
  return <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />;
}

function msgBg(type: ARIAMessage["type"]) {
  if (type === "success") return "oklch(0.22 0.06 145 / 0.85)";
  if (type === "error") return "oklch(0.22 0.08 25 / 0.85)";
  if (type === "warning") return "oklch(0.22 0.07 85 / 0.85)";
  if (type === "system") return "oklch(0.2 0.05 195 / 0.85)";
  if (type === "completion") return "oklch(0.18 0.06 260 / 0.95)";
  return "oklch(0.18 0.02 240 / 0.85)";
}

function EditableError({ msg }: { msg: ARIAMessage }) {
  const { updateMessage } = useARIA();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");

  const handleConfirm = () => {
    if (!val.trim()) return;
    updateMessage(msg.id, {
      resolved: true,
      isEditable: false,
      text: `${msg.text.replace("❌", "✅")} → corrigido para: ${val}`,
      type: "success",
    });
    toast.success(`Valor corrigido: ${val}`);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="mt-2 flex gap-2">
        <Input
          autoFocus
          data-ocid="aria.edit.input"
          placeholder="Digite o valor correto..."
          className="h-7 text-xs bg-white/10 border-white/20 text-white placeholder-white/40"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
        />
        <Button
          size="sm"
          className="h-7 text-xs bg-cyan-600 hover:bg-cyan-500"
          onClick={handleConfirm}
          data-ocid="aria.edit.save_button"
        >
          ✓
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-white/60"
          onClick={() => setEditing(false)}
          data-ocid="aria.edit.cancel_button"
        >
          ✕
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      data-ocid="aria.edit_button"
      className="mt-2 h-6 text-[11px] bg-yellow-600/60 hover:bg-yellow-500/80 text-white border-0"
      onClick={() => setEditing(true)}
    >
      <PencilLine size={10} className="mr-1" /> Editar
    </Button>
  );
}

function CompletionCard({ msg }: { msg: ARIAMessage }) {
  const { settings, clearHistory } = useARIA();
  const [done, setDone] = useState(false);
  const d = msg.completionData!;

  useEffect(() => {
    if (settings.autoComplete && !done) {
      setTimeout(() => {
        setDone(true);
        toast.success("ARIA: Todos os arquivos confirmados automaticamente");
      }, 1500);
    }
  }, [settings.autoComplete, done]);

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "oklch(0.18 0.07 260 / 0.98)",
        border: "1px solid oklch(0.55 0.15 195 / 0.5)",
      }}
    >
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: "oklch(0.22 0.08 260 / 0.9)" }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.5 0.18 195 / 0.3)" }}
        >
          <CheckCircle2 size={14} className="text-cyan-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">
            Processamento Concluído
          </p>
          <p className="text-[10px] text-white/50">
            {new Date().toLocaleTimeString("pt-BR")}
          </p>
        </div>
      </div>
      <div className="px-4 py-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-cyan-400">{d.processed}</p>
          <p className="text-[10px] text-white/50">Processados</p>
        </div>
        <div>
          <p className="text-lg font-bold text-yellow-400">{d.errors}</p>
          <p className="text-[10px] text-white/50">Erros</p>
        </div>
        <div>
          <p className="text-lg font-bold text-emerald-400">{d.resolved}</p>
          <p className="text-[10px] text-white/50">Auto-resolvidos</p>
        </div>
      </div>

      {!done && !settings.autoComplete && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-[10px] text-white/50 mb-1">
            O que deseja fazer com os arquivos?
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              data-ocid="aria.completion.delete_button"
              className="h-7 text-[11px] bg-red-600/70 hover:bg-red-500 text-white border-0"
              onClick={() => {
                setDone(true);
                toast.success("Arquivos originais removidos");
              }}
            >
              <Trash2 size={10} className="mr-1" /> Deletar
            </Button>
            <Button
              size="sm"
              data-ocid="aria.completion.rename_button"
              className="h-7 text-[11px] bg-purple-600/70 hover:bg-purple-500 text-white border-0"
              onClick={() => {
                setDone(true);
                toast.success("Arquivos renomeados com padrão ContaFácil");
              }}
            >
              <PencilLine size={10} className="mr-1" /> Renomear
            </Button>
            <Button
              size="sm"
              data-ocid="aria.completion.ok_button"
              className="h-7 text-[11px] bg-cyan-700/70 hover:bg-cyan-600 text-white border-0"
              onClick={() => {
                setDone(true);
                toast.success("OK");
              }}
            >
              ✅ OK
            </Button>
            <Button
              size="sm"
              data-ocid="aria.completion.ok_all_button"
              className="h-7 text-[11px] text-white border-0"
              style={{ background: "oklch(0.5 0.18 145)" }}
              onClick={() => {
                setDone(true);
                toast.success("Todos os arquivos confirmados!");
                clearHistory();
              }}
            >
              ✅ OK Todos
            </Button>
          </div>
        </div>
      )}

      {(done || settings.autoComplete) && (
        <div className="px-4 pb-3">
          <p className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={11} /> Concluído{" "}
            {settings.autoComplete ? "automaticamente" : ""}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function ErrorsPanel({ messages }: { messages: ARIAMessage[] }) {
  const [open, setOpen] = useState(false);
  const allErrors = messages.flatMap((m) => m.errorDetails ?? []);
  const errorCount = allErrors.length;

  return (
    <div
      className="mt-2 rounded-lg overflow-hidden text-[11px]"
      style={{
        background: "oklch(0.15 0.04 240 / 0.9)",
        border: "1px solid oklch(0.35 0.05 240 / 0.6)",
      }}
    >
      <button
        type="button"
        data-ocid="aria.errors.toggle"
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={11}
            className={errorCount > 0 ? "text-red-400" : "text-white/40"}
          />
          <span
            className={
              errorCount > 0 ? "text-red-300 font-semibold" : "text-white/40"
            }
          >
            {errorCount} {errorCount === 1 ? "erro" : "erros"} encontrados
          </span>
        </div>
        {open ? (
          <ChevronUp size={11} className="text-white/40" />
        ) : (
          <ChevronDown size={11} className="text-white/40" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 space-y-1">
              {errorCount === 0 ? (
                <p className="text-white/30 py-1">Nenhum erro registrado</p>
              ) : (
                allErrors.map((e, i) => (
                  <div
                    key={`${e.file}-${i}`}
                    className="flex gap-2 py-1 border-b border-white/5"
                  >
                    <XCircle
                      size={10}
                      className="text-red-400 shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="text-red-300 font-mono">{e.file}</span>
                      {e.line && (
                        <span className="text-white/30">:{e.line}</span>
                      )}
                      <span className="text-white/60 ml-1">{e.message}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Voice command processor
function processVoiceCommand(
  transcript: string,
  setCurrentPage: (page: string) => void,
  setIsChatOpen: (open: boolean) => void,
  addMessage: (msg: any) => void,
  setIsActive: (v: boolean) => void,
  messages: ARIAMessage[],
): boolean {
  const t = transcript.toLowerCase().trim();

  const nav = (page: string, label: string) => {
    setCurrentPage(page);
    setIsChatOpen(false);
    addMessage({
      type: "success",
      text: `Navegando para ${label}! ✨`,
    });
    return true;
  };

  if (t.includes("notas") || t.includes("nota fiscal"))
    return nav("notas-fiscais", "Notas Fiscais");
  if (t.includes("clientes") || t.includes("cliente"))
    return nav("clientes", "Clientes");
  if (
    t.includes("dashboard") ||
    t.includes("início") ||
    t.includes("inicio") ||
    t.includes("home")
  )
    return nav("dashboard", "Dashboard");
  if (t.includes("fiscal") || t.includes("módulo fiscal"))
    return nav("modulo-fiscal", "Módulo Fiscal");
  if (t.includes("irpf") || t.includes("imposto de renda"))
    return nav("irpf", "IRPF");
  if (t.includes("lançamentos") || t.includes("lancamentos"))
    return nav("lancamentos", "Lançamentos");
  if (
    t.includes("relatório") ||
    t.includes("relatorio") ||
    t.includes("relatórios")
  )
    return nav("relatorios", "Relatórios");
  if (
    t.includes("configurações") ||
    t.includes("configuracoes") ||
    t.includes("configuracao")
  )
    return nav("configuracoes", "Configurações");

  if (
    t.includes("falta") ||
    t.includes("pendente") ||
    t.includes("pendentes")
  ) {
    const pending = messages.filter(
      (m) => m.type !== "success" && m.type !== "completion",
    ).length;
    addMessage({
      type: "info",
      text: `📋 Tarefas pendentes: ${pending} item(s) aguardando processamento. Use o módulo de Processamento Sequencial para ver a lista completa.`,
    });
    return true;
  }

  if (
    t.includes("processar") ||
    t.includes("ativar aria") ||
    t.includes("ativar")
  ) {
    setIsActive(true);
    addMessage({
      type: "system",
      text: "🤖 ARIA ativada por comando de voz! Iniciando processamento...",
    });
    return true;
  }

  return false;
}

export default function ARIAChat() {
  const {
    messages,
    clearHistory,
    setIsChatOpen,
    clearUnread,
    isActive,
    isProcessing,
    addMessage,
    setIsActive,
  } = useARIA();
  const { setCurrentPage } = useAppContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    clearUnread();
  }, [clearUnread]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  });

  const handleSendText = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    setInputText("");

    // Check if it's a command
    const isCommand = processVoiceCommand(
      text,
      setCurrentPage,
      setIsChatOpen,
      addMessage,
      setIsActive,
      messages,
    );

    if (!isCommand) {
      // Echo user message then respond
      addMessage({ type: "info", text: `Você: ${text}` });
      setTimeout(() => {
        addMessage({
          type: "system",
          text: `Entendido! Para navegar, diga: "abrir clientes", "abrir notas", "abrir dashboard" etc. Para processar clientes, diga "processar tudo".`,
        });
      }, 600);
    }
  }, [
    inputText,
    setCurrentPage,
    setIsChatOpen,
    addMessage,
    setIsActive,
    messages,
  ]);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);

      const isCommand = processVoiceCommand(
        transcript,
        setCurrentPage,
        setIsChatOpen,
        addMessage,
        setIsActive,
        messages,
      );

      if (!isCommand) {
        addMessage({ type: "info", text: `🎤 Você disse: "${transcript}"` });
        setTimeout(() => {
          addMessage({
            type: "system",
            text: 'Comando não reconhecido. Tente: "abrir clientes", "abrir notas", "quem falta declaração" ou "processar tudo".',
          });
        }, 500);
      }
    };

    recognition.start();
  }, [
    isListening,
    setCurrentPage,
    setIsChatOpen,
    addMessage,
    setIsActive,
    messages,
  ]);

  const chatMessages = messages.filter((m) => m.type !== "completion");
  const completionMsg = messages.find((m) => m.type === "completion");

  return (
    <motion.div
      data-ocid="aria.chat.panel"
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        position: "fixed",
        bottom: 100,
        right: 24,
        width: 380,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "calc(100vh - 140px)",
        zIndex: 9998,
        background: "oklch(0.13 0.04 240 / 0.97)",
        border: "1px solid oklch(0.4 0.1 195 / 0.5)",
        borderRadius: 16,
        boxShadow:
          "0 8px 40px oklch(0.08 0.1 240 / 0.7), 0 0 0 1px oklch(0.5 0.18 195 / 0.15)",
        backdropFilter: "blur(16px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{
          background: "oklch(0.17 0.06 240 / 0.9)",
          borderBottom: "1px solid oklch(0.35 0.06 195 / 0.4)",
        }}
      >
        <div className="relative shrink-0">
          <img
            src="/assets/generated/aria-avatar-transparent.dim_400x500.png"
            alt="ARIA"
            className="w-9 h-9 rounded-full object-cover"
            style={{ border: "2px solid oklch(0.6 0.18 195)" }}
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{
              background: isActive
                ? isProcessing
                  ? "oklch(0.75 0.2 85)"
                  : "oklch(0.6 0.18 145)"
                : "oklch(0.45 0.03 240)",
              borderColor: "oklch(0.13 0.04 240)",
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-none">ARIA</p>
          <p className="text-[10px] text-cyan-400/80 mt-0.5 truncate">
            Assistente de Registro Inteligente Automatizado
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            className="text-[9px] h-4 px-1.5 border-0"
            style={{
              background: isActive
                ? "oklch(0.3 0.1 145 / 0.7)"
                : "oklch(0.25 0.03 240 / 0.7)",
              color: isActive ? "oklch(0.8 0.15 145)" : "oklch(0.6 0.03 240)",
            }}
          >
            {isActive ? (isProcessing ? "Processando" : "Ativa") : "Inativa"}
          </Badge>
          <button
            type="button"
            data-ocid="aria.chat.close_button"
            onClick={() => setIsChatOpen(false)}
            className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Voice command hint */}
      {SpeechRecognitionAPI && (
        <div
          className="px-4 py-1.5 text-[10px] text-white/30 flex items-center gap-1.5"
          style={{ borderBottom: "1px solid oklch(0.25 0.04 240 / 0.4)" }}
        >
          <Mic size={9} />
          Diga: &quot;abrir clientes&quot;, &quot;abrir notas&quot;,
          &quot;processar tudo&quot;
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "oklch(0.3 0.05 240) transparent",
        }}
      >
        {messages.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-10 gap-3"
            data-ocid="aria.chat.empty_state"
          >
            <img
              src="/assets/generated/aria-avatar-transparent.dim_400x500.png"
              alt="ARIA"
              className="w-16 h-16 rounded-full object-cover opacity-50"
            />
            <p className="text-xs text-white/30 text-center">
              {isActive
                ? "ARIA está pronta. Aguardando arquivos..."
                : "Ative a ARIA para iniciar o processamento automático."}
            </p>
            {SpeechRecognitionAPI && (
              <p className="text-[10px] text-white/20 text-center">
                💡 Use o microfone para comandos de voz
              </p>
            )}
          </div>
        )}

        <AnimatePresence initial={false}>
          {chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="flex gap-2"
            >
              <div className="shrink-0 w-5 h-5 mt-0.5">
                <img
                  src="/assets/generated/aria-avatar-transparent.dim_400x500.png"
                  alt="ARIA"
                  className="w-5 h-5 rounded-full object-cover"
                  style={{ border: "1px solid oklch(0.5 0.12 195 / 0.6)" }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className="rounded-xl px-3 py-2 text-xs text-white/90 leading-relaxed"
                  style={{ background: msgBg(msg.type) }}
                >
                  <div className="flex items-start gap-1.5">
                    <MessageIcon type={msg.type} />
                    <span className="flex-1">{msg.text}</span>
                  </div>

                  {msg.type === "processing" && msg.progress !== undefined && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-white/40 mb-1">
                        <span className="truncate">{msg.fileName}</span>
                        <span>{msg.progress}%</span>
                      </div>
                      <Progress
                        value={msg.progress}
                        className="h-1"
                        style={{ background: "oklch(0.3 0.04 240)" }}
                      />
                    </div>
                  )}

                  {msg.filePath && (
                    <button
                      type="button"
                      data-ocid="aria.open_folder.button"
                      className="mt-1.5 flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                      onClick={() => toast.info(`📂 Pasta: ${msg.filePath}`)}
                    >
                      <FolderOpen size={10} /> Abrir pasta
                    </button>
                  )}

                  {msg.isEditable && !msg.resolved && (
                    <EditableError msg={msg} />
                  )}
                </div>
                <p className="text-[9px] text-white/25 mt-0.5 ml-1">
                  {msg.timestamp.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {completionMsg && <CompletionCard msg={completionMsg} />}
        {messages.length > 0 && <ErrorsPanel messages={messages} />}
      </div>

      {/* Chat input */}
      <div
        className="shrink-0 px-3 py-2 flex items-center gap-2"
        style={{ borderTop: "1px solid oklch(0.25 0.04 240 / 0.6)" }}
      >
        <Input
          data-ocid="aria.chat.input"
          placeholder={isListening ? "Ouvindo..." : "Pergunte à ARIA..."}
          className="flex-1 h-8 text-xs bg-white/5 border-white/15 text-white placeholder-white/30 focus:border-cyan-500/50"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendText()}
        />

        {/* Mic button */}
        {SpeechRecognitionAPI && (
          <motion.button
            type="button"
            data-ocid="aria.voice.mic_button"
            onClick={startListening}
            animate={isListening ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={
              isListening
                ? { duration: 0.8, repeat: Number.POSITIVE_INFINITY }
                : {}
            }
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0"
            style={{
              background: isListening
                ? "oklch(0.55 0.22 25)"
                : "oklch(0.3 0.05 240)",
              color: "white",
              boxShadow: isListening
                ? "0 0 12px oklch(0.55 0.22 25 / 0.6)"
                : "none",
            }}
            aria-label={
              isListening ? "Parar gravação" : "Iniciar gravação de voz"
            }
          >
            {isListening ? <MicOff size={13} /> : <Mic size={13} />}
          </motion.button>
        )}

        {/* Send button */}
        <button
          type="button"
          data-ocid="aria.chat.submit_button"
          onClick={handleSendText}
          disabled={!inputText.trim()}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 disabled:opacity-30"
          style={{
            background: inputText.trim()
              ? "oklch(0.55 0.18 195)"
              : "oklch(0.3 0.04 240)",
            color: "white",
          }}
          aria-label="Enviar mensagem"
        >
          <Send size={13} />
        </button>
      </div>

      {/* Footer */}
      <div
        className="shrink-0 px-3 pb-2 flex items-center justify-between"
        style={{ borderTop: "1px solid oklch(0.2 0.03 240 / 0.4)" }}
      >
        <p className="text-[10px] text-white/25">
          {messages.length} {messages.length === 1 ? "mensagem" : "mensagens"}
        </p>
        <button
          type="button"
          data-ocid="aria.clear_history.button"
          className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
          onClick={() => {
            clearHistory();
            toast.info("Histórico limpo");
          }}
        >
          <Trash2 size={10} /> Limpar
        </button>
      </div>
    </motion.div>
  );
}
