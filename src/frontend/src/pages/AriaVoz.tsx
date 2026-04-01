import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  CheckCircle,
  Mic,
  MicOff,
  Search,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useARIA } from "../context/ARIAContext";
import useARIAVoice, { type VoiceEmotion } from "../hooks/useARIAVoice";

const VOICE_COMMANDS = [
  {
    cmd: "abrir clientes",
    action: "Abrir módulo Clientes",
    category: "Navegação",
  },
  {
    cmd: "abrir documentos",
    action: "Abrir módulo Documentos",
    category: "Navegação",
  },
  { cmd: "abrir fiscal", action: "Abrir módulo Fiscal", category: "Navegação" },
  { cmd: "abrir irpf", action: "Abrir módulo IRPF", category: "Navegação" },
  {
    cmd: "abrir dashboard",
    action: "Ir ao Painel Geral",
    category: "Navegação",
  },
  {
    cmd: "abrir contratos",
    action: "Abrir Gestão de Contratos",
    category: "Navegação",
  },
  {
    cmd: "abrir relatórios",
    action: "Abrir módulo Relatórios",
    category: "Navegação",
  },
  {
    cmd: "processar tudo",
    action: "Iniciar automação geral de todos os clientes",
    category: "Automação",
  },
  {
    cmd: "relatório mensal",
    action: "Gerar relatório mensal consolidado",
    category: "Automação",
  },
  {
    cmd: "modo automático",
    action: "Ativar modo automático da ARIA",
    category: "Automação",
  },
  {
    cmd: "modo manual",
    action: "Ativar modo manual — solicitar confirmação",
    category: "Automação",
  },
  {
    cmd: "parar",
    action: "Parar processo atual em execução",
    category: "Controle",
  },
  {
    cmd: "limpar histórico",
    action: "Limpar histórico de mensagens da ARIA",
    category: "Controle",
  },
  { cmd: "ativar aria", action: "Ligar/ativar a ARIA", category: "Controle" },
  {
    cmd: "desativar aria",
    action: "Desligar/desativar a ARIA",
    category: "Controle",
  },
  {
    cmd: "novo cliente",
    action: "Abrir formulário de cadastro de cliente",
    category: "Ações",
  },
  {
    cmd: "gerar nota fiscal",
    action: "Iniciar emissão de nota fiscal",
    category: "Ações",
  },
  {
    cmd: "fechar chat",
    action: "Fechar painel de chat da ARIA",
    category: "Controle",
  },
];

const EMOTIONS: {
  id: VoiceEmotion;
  label: string;
  emoji: string;
  desc: string;
}[] = [
  {
    id: "normal",
    label: "Normal",
    emoji: "😊",
    desc: "Tom padrão, neutro e claro",
  },
  {
    id: "urgent",
    label: "Urgente",
    emoji: "⚡",
    desc: "Mais rápido e enfático",
  },
  {
    id: "celebrate",
    label: "Celebração",
    emoji: "🎉",
    desc: "Animado, tarefa concluída",
  },
  { id: "error", label: "Erro", emoji: "😟", desc: "Mais lento e grave" },
];

const SAMPLE_TEXTS: Record<VoiceEmotion, string> = {
  normal:
    "Olá! Sou a ARIA, sua assistente contábil inteligente. Estou pronta para trabalhar.",
  urgent:
    "Atenção! Existem obrigações fiscais com vencimento em 3 dias. Ação necessária imediatamente.",
  celebrate:
    "Excelente trabalho! Processamento de todos os clientes concluído com sucesso!",
  error:
    "Atenção. Encontrei inconsistências nos lançamentos do cliente. Revisão manual necessária.",
  working:
    "Processando imposto de renda do cliente Cleber. Aguardando análise...",
};

interface CommandLog {
  id: string;
  command: string;
  action: string;
  emotion: VoiceEmotion;
  timestamp: Date;
}

export default function AriaVoz() {
  const { addMessage, setIsChatOpen, isActive, setIsActive } = useARIA();
  const {
    speak,
    startListening,
    stopListening,
    isSupported,
    recognitionSupported,
  } = useARIAVoice();

  const [voiceEnabled, setVoiceEnabledState] = useState(
    () => localStorage.getItem("aria_voice_enabled") === "true",
  );
  const [commandsEnabled, setCommandsEnabledState] = useState(
    () => localStorage.getItem("aria_commands_enabled") === "true",
  );
  const [language, setLanguage] = useState<"pt" | "en" | "es">(() => {
    const saved = localStorage.getItem("aria_voice_language");
    if (saved === "pt" || saved === "en" || saved === "es") return saved;
    return "pt";
  });
  const [selectedEmotion, setSelectedEmotion] =
    useState<VoiceEmotion>("normal");
  const [isListening, setIsListening] = useState(false);
  const [searchCmd, setSearchCmd] = useState("");
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);

  const setVoiceEnabled = (v: boolean) => {
    setVoiceEnabledState(v);
    localStorage.setItem("aria_voice_enabled", String(v));
  };

  const setCommandsEnabled = (v: boolean) => {
    setCommandsEnabledState(v);
    localStorage.setItem("aria_commands_enabled", String(v));
  };

  const handleSetLanguage = (v: string) => {
    const lang = v as "pt" | "en" | "es";
    setLanguage(lang);
    localStorage.setItem("aria_voice_language", lang);
  };

  const handleTestVoice = () => {
    if (!isSupported) return;
    speak(SAMPLE_TEXTS[selectedEmotion], selectedEmotion, language);
  };

  const handleListenToggle = () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
      return;
    }
    setIsListening(true);
    startListening(
      (cmd) => {
        const matched = VOICE_COMMANDS.find((vc) => cmd.includes(vc.cmd));
        const action = matched ? matched.action : "Comando não reconhecido";
        const emotion: VoiceEmotion =
          cmd.includes("urgente") || cmd.includes("parar")
            ? "urgent"
            : "normal";

        const log: CommandLog = {
          id: crypto.randomUUID(),
          command: cmd,
          action,
          emotion,
          timestamp: new Date(),
        };
        setCommandLogs((prev) => [log, ...prev.slice(0, 49)]);

        // Execute commands
        if (cmd.includes("ativar aria") && !isActive) setIsActive(true);
        if (cmd.includes("desativar aria") && isActive) setIsActive(false);
        if (cmd.includes("fechar chat")) setIsChatOpen(false);

        addMessage({
          type: "info",
          text: `🎙️ Comando de voz: "${cmd}" → ${action}`,
        });
        if (voiceEnabled) speak(action, emotion, language);
      },
      () => setIsListening(false),
      language,
    );
  };

  const filteredCmds = VOICE_COMMANDS.filter(
    (c) =>
      c.cmd.toLowerCase().includes(searchCmd.toLowerCase()) ||
      c.action.toLowerCase().includes(searchCmd.toLowerCase()) ||
      c.category.toLowerCase().includes(searchCmd.toLowerCase()),
  );

  const emotionBadgeColor: Record<VoiceEmotion, string> = {
    normal: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    urgent: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    celebrate: "bg-green-500/15 text-green-400 border-green-500/30",
    error: "bg-red-500/15 text-red-400 border-red-500/30",
    working: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(var(--background))" }}
    >
      {/* Header */}
      <header className="shrink-0 px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.55 0.22 25), oklch(0.5 0.18 45))",
            }}
          >
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              ARIA — Voz & Comandos
            </h1>
            <p className="text-xs text-muted-foreground">
              Controle por voz e texto-para-fala
            </p>
          </div>
        </div>
        {!isSupported && !recognitionSupported && (
          <Badge
            variant="outline"
            className="border-yellow-500/40 text-yellow-500 bg-yellow-500/10 gap-1"
          >
            <AlertTriangle className="w-3 h-3" />
            Navegador sem suporte
          </Badge>
        )}
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-4xl">
          {/* Toggle Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TTS Card */}
            <Card
              data-ocid="aria_voz.tts.card"
              className="rounded-xl border-border"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: voiceEnabled
                        ? "oklch(0.55 0.18 145 / 0.15)"
                        : "oklch(0.5 0.02 240 / 0.1)",
                    }}
                  >
                    {voiceEnabled ? (
                      <Volume2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <Switch
                    data-ocid="aria_voz.tts.toggle"
                    checked={voiceEnabled}
                    onCheckedChange={setVoiceEnabled}
                    disabled={!isSupported}
                  />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Voz da ARIA (Text-to-Speech)
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  A ARIA fala em voz alta o que está fazendo — acompanhe sem
                  precisar olhar a tela.
                </p>
                <Badge
                  variant="outline"
                  className={
                    voiceEnabled && isSupported
                      ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                      : "border-muted text-muted-foreground"
                  }
                >
                  {voiceEnabled && isSupported
                    ? "Ativo"
                    : !isSupported
                      ? "Sem suporte"
                      : "Inativo"}
                </Badge>
              </CardContent>
            </Card>

            {/* Commands Card */}
            <Card
              data-ocid="aria_voz.commands.card"
              className="rounded-xl border-border"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: commandsEnabled
                        ? "oklch(0.55 0.22 25 / 0.15)"
                        : "oklch(0.5 0.02 240 / 0.1)",
                    }}
                  >
                    {commandsEnabled ? (
                      <Mic className="w-5 h-5 text-orange-400" />
                    ) : (
                      <MicOff className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <Switch
                    data-ocid="aria_voz.commands.toggle"
                    checked={commandsEnabled}
                    onCheckedChange={setCommandsEnabled}
                    disabled={!recognitionSupported}
                  />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Comandos de Voz (Microfone)
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Fale para controlar o sistema. A ARIA reconhece e executa
                  comandos em tempo real.
                </p>
                <Badge
                  variant="outline"
                  className={
                    commandsEnabled && recognitionSupported
                      ? "border-orange-500/40 text-orange-400 bg-orange-500/10"
                      : "border-muted text-muted-foreground"
                  }
                >
                  {commandsEnabled && recognitionSupported
                    ? "Ativo"
                    : !recognitionSupported
                      ? "Sem suporte"
                      : "Inativo"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Voice Settings */}
          <Card className="rounded-xl border-border">
            <CardHeader className="px-5 py-4 border-b border-border">
              <CardTitle className="text-sm font-semibold">
                Configurações de Voz
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Language */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Idioma da Voz</Label>
                <Select value={language} onValueChange={handleSetLanguage}>
                  <SelectTrigger
                    data-ocid="aria_voz.language.select"
                    className="w-48"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">🇧🇷 Português (PT-BR)</SelectItem>
                    <SelectItem value="en">🇺🇸 English (EN-US)</SelectItem>
                    <SelectItem value="es">🇪🇸 Español (ES-ES)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Emotion selector */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Tom / Emoção para Teste
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {EMOTIONS.map((e) => (
                    <button
                      type="button"
                      key={e.id}
                      data-ocid={`aria_voz.emotion.${e.id}.button`}
                      onClick={() => setSelectedEmotion(e.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedEmotion === e.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40 hover:bg-muted/50"
                      }`}
                    >
                      <div className="text-xl mb-1">{e.emoji}</div>
                      <div className="text-xs font-semibold text-foreground">
                        {e.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {e.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Test button */}
              <Button
                data-ocid="aria_voz.test_voice.button"
                onClick={handleTestVoice}
                disabled={!isSupported || !voiceEnabled}
                className="gap-2"
              >
                <Volume2 className="w-4 h-4" />
                Testar Voz (
                {EMOTIONS.find((e) => e.id === selectedEmotion)?.label})
              </Button>
              {!isSupported && (
                <p className="text-xs text-yellow-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Este navegador não suporta síntese de voz. Use Chrome ou Edge.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Microphone Button */}
          {commandsEnabled && recognitionSupported && (
            <Card className="rounded-xl border-border">
              <CardHeader className="px-5 py-4 border-b border-border">
                <CardTitle className="text-sm font-semibold">
                  Controle por Voz
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground text-center">
                  Clique no microfone e fale um comando. A ARIA irá reconhecer e
                  executar automaticamente.
                </p>

                {/* Big mic button */}
                <div className="relative">
                  <button
                    type="button"
                    data-ocid="aria_voz.mic.button"
                    onClick={handleListenToggle}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                      isListening
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-primary hover:bg-primary/90 text-white"
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </button>
                  {isListening && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full bg-red-500/30"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{
                          duration: 1.5,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full bg-red-500/20"
                        animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{
                          duration: 1.5,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: 0.3,
                        }}
                      />
                    </>
                  )}
                </div>

                {/* Waveform animation */}
                {isListening && (
                  <div className="flex items-center gap-1 h-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 rounded-full bg-primary"
                        animate={{ height: [8, 24, 8, 32, 8, 16, 8] }}
                        transition={{
                          duration: 0.8,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.08,
                        }}
                      />
                    ))}
                  </div>
                )}

                <Badge
                  data-ocid="aria_voz.listening.loading_state"
                  variant="outline"
                  className={
                    isListening
                      ? "border-red-500/40 text-red-400 bg-red-500/10"
                      : "border-border text-muted-foreground"
                  }
                >
                  {isListening ? "🔴 Ouvindo..." : "🎙️ Aguardando"}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Available Commands */}
          <Card className="rounded-xl border-border">
            <CardHeader className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Comandos Disponíveis
                </CardTitle>
                <Badge variant="outline">
                  {VOICE_COMMANDS.length} comandos
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-ocid="aria_voz.commands.search_input"
                  placeholder="Pesquisar comandos..."
                  className="pl-9 h-9 text-sm"
                  value={searchCmd}
                  onChange={(e) => setSearchCmd(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                {filteredCmds.map((c, idx) => (
                  <div
                    key={c.cmd}
                    data-ocid={`aria_voz.commands.item.${idx + 1}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground shrink-0">
                      "{c.cmd}"
                    </code>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-xs text-foreground">{c.action}</span>
                    <Badge
                      variant="outline"
                      className="ml-auto text-[10px] py-0 shrink-0"
                    >
                      {c.category}
                    </Badge>
                  </div>
                ))}
                {filteredCmds.length === 0 && (
                  <p
                    data-ocid="aria_voz.commands.empty_state"
                    className="text-center text-sm text-muted-foreground py-6"
                  >
                    Nenhum comando encontrado.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Command Log */}
          <Card className="rounded-xl border-border">
            <CardHeader className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Log de Comandos Reconhecidos
                </CardTitle>
                {commandLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCommandLogs([])}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {commandLogs.length === 0 ? (
                <div
                  data-ocid="aria_voz.log.empty_state"
                  className="text-center py-8 text-sm text-muted-foreground"
                >
                  <Mic className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Nenhum comando reconhecido ainda. Ative o microfone e fale.
                </div>
              ) : (
                <div className="space-y-2">
                  {commandLogs.map((log, idx) => (
                    <div
                      key={log.id}
                      data-ocid={`aria_voz.log.item.${idx + 1}`}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-muted/30"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs font-mono text-foreground">
                            "{log.command}"
                          </code>
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 border ${emotionBadgeColor[log.emotion]}`}
                          >
                            {log.emotion}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {log.action}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {log.timestamp.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <footer className="px-6 py-3 border-t border-border text-center">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()}. Feito com ❤️ usando{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </ScrollArea>
    </div>
  );
}
