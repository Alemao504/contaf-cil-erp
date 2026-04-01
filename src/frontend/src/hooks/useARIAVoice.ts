import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceEmotion =
  | "normal"
  | "urgent"
  | "celebrate"
  | "error"
  | "working";

// Web Speech API types (not always in TS lib)
interface SpeechRecognitionResult {
  readonly 0: { readonly transcript: string };
}
interface SpeechRecognitionResultList {
  readonly 0: SpeechRecognitionResult;
}
interface SpeechRecognitionEventLike {
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface WindowWithSpeech {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

const EMOTION_PARAMS: Record<VoiceEmotion, { rate: number; pitch: number }> = {
  normal: { rate: 1.0, pitch: 1.0 },
  urgent: { rate: 1.2, pitch: 1.1 },
  celebrate: { rate: 1.1, pitch: 1.2 },
  error: { rate: 0.9, pitch: 0.8 },
  working: { rate: 1.0, pitch: 0.95 },
};

const LANG_MAP: Record<"pt" | "en" | "es", string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
};

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  const w = window as WindowWithSpeech;
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

export default function useARIAVoice() {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      setIsSupported(true);
    }
    if (getSpeechRecognition()) {
      setRecognitionSupported(true);
    }
  }, []);

  const speak = useCallback(
    (
      text: string,
      emotion: VoiceEmotion = "normal",
      language: "pt" | "en" | "es" = "pt",
    ) => {
      try {
        const synth = synthRef.current;
        if (!synth) return;
        synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = LANG_MAP[language];
        const params = EMOTION_PARAMS[emotion];
        utter.rate = params.rate;
        utter.pitch = params.pitch;
        utter.volume = 1.0;
        const voices = synth.getVoices();
        const langCode = LANG_MAP[language];
        const match = voices.find((v) =>
          v.lang.startsWith(langCode.slice(0, 2)),
        );
        if (match) utter.voice = match;
        synth.speak(utter);
      } catch (e) {
        console.warn("Speech synthesis error:", e);
      }
    },
    [],
  );

  const startListening = useCallback(
    (
      onResult: (cmd: string) => void,
      onEnd: () => void,
      language: "pt" | "en" | "es" = "pt",
    ): (() => void) => {
      try {
        const SpeechRec = getSpeechRecognition();
        if (!SpeechRec) {
          onEnd();
          return () => {};
        }
        const rec = new SpeechRec();
        recognitionRef.current = rec;
        rec.lang = LANG_MAP[language];
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.onresult = (event) => {
          const transcript = event.results[0][0].transcript
            .toLowerCase()
            .trim();
          onResult(transcript);
        };
        rec.onend = () => {
          onEnd();
        };
        rec.onerror = () => {
          onEnd();
        };
        rec.start();
        return () => {
          try {
            rec.stop();
          } catch {}
        };
      } catch (e) {
        console.warn("Speech recognition error:", e);
        onEnd();
        return () => {};
      }
    },
    [],
  );

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
  }, []);

  return {
    speak,
    startListening,
    stopListening,
    isSupported,
    recognitionSupported,
  };
}
