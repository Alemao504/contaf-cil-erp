import { Power, Volume2, VolumeX, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useARIA } from "../context/ARIAContext";

type ARIAExpression = "idle" | "working" | "new_file" | "error" | "success";

function getExpression(
  isActive: boolean,
  isProcessing: boolean,
  lastMsgType?: string,
): ARIAExpression {
  if (!isActive) return "idle";
  if (isProcessing) return "working";
  if (lastMsgType === "error") return "error";
  if (lastMsgType === "success" || lastMsgType === "completion")
    return "success";
  if (lastMsgType === "info") return "new_file";
  return "idle";
}

// Emoji faces per expression
const EXPRESSION_FACES: Record<ARIAExpression, string> = {
  idle: "😊",
  working: "🤓",
  new_file: "😲",
  error: "😟",
  success: "🎉",
};

const EXPRESSION_BORDER: Record<ARIAExpression, string> = {
  idle: "oklch(0.85 0.18 195)",
  working: "oklch(0.75 0.2 255)",
  new_file: "oklch(0.8 0.18 60)",
  error: "oklch(0.65 0.2 25)",
  success: "oklch(0.72 0.18 145)",
};

const EXPRESSION_GLOW: Record<ARIAExpression, string> = {
  idle: "0 0 30px oklch(0.85 0.18 195 / 0.3)",
  working: "0 0 30px oklch(0.75 0.2 255 / 0.4)",
  new_file: "0 0 30px oklch(0.8 0.18 60 / 0.4)",
  error: "0 0 30px oklch(0.65 0.2 25 / 0.5)",
  success: "0 0 40px oklch(0.72 0.18 145 / 0.5)",
};

// Size constants
const SIZE = 240;

export default function ARIABubble() {
  const {
    isActive,
    setIsActive,
    isChatOpen,
    setIsChatOpen,
    unreadCount,
    clearUnread,
    isProcessing,
    messages,
    voiceEnabled,
    setVoiceEnabled,
  } = useARIA();

  const [minimized, setMinimized] = useState(false);
  const [speechVisible, setSpeechVisible] = useState(false);
  const [speechText, setSpeechText] = useState("");
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastMsg = messages[messages.length - 1];
  const expression = getExpression(isActive, isProcessing, lastMsg?.type);
  const borderColor = EXPRESSION_BORDER[expression];

  // Show speech bubble when new message arrives
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on message id only
  useEffect(() => {
    if (!lastMsg) return;
    const text = lastMsg.text
      .replace(/^[\p{Emoji}\s]+/u, "")
      .trim()
      .slice(0, 80);
    setSpeechText(text);
    setSpeechVisible(true);
    if (speechTimer.current) clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => setSpeechVisible(false), 5000);
    return () => {
      if (speechTimer.current) clearTimeout(speechTimer.current);
    };
  }, [lastMsg?.id]);

  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem("ariaBubblePos");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      x: window.innerWidth - SIZE - 24,
      y: window.innerHeight - SIZE - 60,
    };
  });

  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, bx: 0, by: 0 });
  const moved = useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    moved.current = false;
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: pos.x, by: pos.y };
    e.preventDefault();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    dragging.current = true;
    moved.current = false;
    dragStart.current = { mx: t.clientX, my: t.clientY, bx: pos.x, by: pos.y };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const { clientX, clientY } = "touches" in e ? e.touches[0] : e;
      const dx = clientX - dragStart.current.mx;
      const dy = clientY - dragStart.current.my;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved.current = true;
      const nx = Math.max(
        0,
        Math.min(window.innerWidth - SIZE, dragStart.current.bx + dx),
      );
      const ny = Math.max(
        0,
        Math.min(window.innerHeight - SIZE, dragStart.current.by + dy),
      );
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      dragging.current = false;
      localStorage.setItem("ariaBubblePos", JSON.stringify(pos));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [pos]);

  const handleAvatarClick = () => {
    if (moved.current) return;
    if (minimized) {
      setMinimized(false);
      return;
    }
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) clearUnread();
  };

  const handlePower = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActive(!isActive);
    if (!isActive) {
      setIsChatOpen(true);
      clearUnread();
    }
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMinimized(!minimized);
  };

  const handleVoiceToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVoiceEnabled(!voiceEnabled);
  };

  // Expression-based animation variants
  const bodyAnimations: Record<
    ARIAExpression,
    import("motion/react").TargetAndTransition
  > = {
    idle: {
      y: [0, -6, 0],
      transition: {
        duration: 3,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
    working: {
      y: [0, -10, 0],
      rotate: [-1.5, 1.5, -1.5],
      transition: {
        duration: 1.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
    success: {
      scale: [1, 1.08, 0.95, 1.04, 1],
      y: [0, -14, 0],
      transition: { duration: 0.6, repeat: 3, ease: "easeOut" },
    },
    error: {
      x: [-6, 6, -6, 6, -3, 3, 0],
      transition: { duration: 0.5, repeat: 2, ease: "easeInOut" },
    },
    new_file: {
      y: [0, -18, 4, -10, 0],
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  if (minimized) {
    return (
      <motion.button
        type="button"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          zIndex: 9999,
          background: "oklch(0.15 0.04 240 / 0.9)",
          backdropFilter: "blur(8px)",
        }}
        onClick={() => setMinimized(false)}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-xl border border-border"
        aria-label="Mostrar ARIA"
      >
        {EXPRESSION_FACES[expression]}
      </motion.button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 9999,
        userSelect: "none",
        touchAction: "none",
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className="cursor-grab active:cursor-grabbing"
    >
      {/* Speech bubble — comic style — positioned to the left */}
      <AnimatePresence>
        {speechVisible && speechText && (
          <motion.div
            key="speech"
            initial={{ opacity: 0, scale: 0.85, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: 10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              right: `${SIZE + 12}px`,
              top: "20px",
              zIndex: 10000,
              maxWidth: "260px",
              minWidth: "140px",
            }}
          >
            <div
              className="relative px-4 py-3 text-[12px] leading-relaxed font-medium shadow-xl"
              style={{
                background: "oklch(0.14 0.05 240 / 0.97)",
                border: `1.5px solid ${borderColor}`,
                borderRadius: "14px 14px 2px 14px",
                color: "oklch(0.92 0.02 240)",
                backdropFilter: "blur(12px)",
              }}
            >
              <span className="mr-1">{EXPRESSION_FACES[expression]}</span>
              {speechText}
              {/* Bubble tail */}
              <div
                className="absolute"
                style={{
                  right: "-9px",
                  bottom: "8px",
                  width: 0,
                  height: 0,
                  borderLeft: `9px solid ${borderColor}`,
                  borderTop: "7px solid transparent",
                  borderBottom: "7px solid transparent",
                }}
              />
              <div
                className="absolute"
                style={{
                  right: "-7px",
                  bottom: "9px",
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid oklch(0.14 0.05 240 / 0.97)",
                  borderTop: "6px solid transparent",
                  borderBottom: "6px solid transparent",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outer glow ring when active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${borderColor.replace(")", " / 0.25)")} 0%, transparent 70%)`,
            width: SIZE,
            height: SIZE,
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.1, 0.5] }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Main bubble container */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {/* Animated border ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: isActive
              ? `conic-gradient(from 0deg, ${borderColor}, oklch(0.75 0.2 255), ${borderColor})`
              : "conic-gradient(from 0deg, oklch(0.6 0.02 240), oklch(0.5 0.02 240))",
            padding: 3,
          }}
          animate={isActive ? { rotate: 360 } : { rotate: 0 }}
          transition={
            isActive
              ? {
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }
              : {}
          }
        />

        {/* Processing pulse ring */}
        {isProcessing && (
          <motion.div
            className="absolute rounded-full border-2"
            style={{ inset: -6, borderColor }}
            animate={{ scale: [1, 1.15, 1], opacity: [1, 0.3, 1] }}
            transition={{
              duration: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Avatar image with expression-based body animation */}
        <motion.button
          type="button"
          onClick={handleAvatarClick}
          className="absolute rounded-full overflow-hidden focus:outline-none"
          style={{
            inset: 3,
            boxShadow: EXPRESSION_GLOW[expression],
          }}
          animate={bodyAnimations[expression]}
          aria-label="Abrir chat ARIA"
          data-ocid="aria.toggle"
        >
          {/* Avatar image */}
          <img
            src="/assets/generated/aria-avatar-transparent.dim_400x500.png"
            alt="ARIA"
            className="w-full h-full object-cover rounded-full"
            draggable={false}
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent && !parent.querySelector(".aria-fallback")) {
                const fallback = document.createElement("div");
                fallback.className =
                  "aria-fallback w-full h-full rounded-full flex items-center justify-center";
                fallback.style.background =
                  "linear-gradient(135deg, oklch(0.3 0.2 195), oklch(0.25 0.15 255))";
                fallback.style.fontSize = "80px";
                fallback.textContent = EXPRESSION_FACES[expression];
                parent.appendChild(fallback);
              }
            }}
          />

          {/* Expression face overlay — large, centered on lower half */}
          <AnimatePresence mode="wait">
            <motion.div
              key={expression}
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center"
              style={{
                background: "oklch(0.12 0.04 240 / 0.85)",
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 28,
                backdropFilter: "blur(4px)",
                border: `1.5px solid ${borderColor}`,
              }}
            >
              {EXPRESSION_FACES[expression]}
            </motion.div>
          </AnimatePresence>

          {/* Blinking overlay */}
          <BlinkOverlay />

          {/* Working shimmer */}
          {expression === "working" && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.75 0.2 255 / 0.2) 0%, transparent 60%)",
              }}
              animate={{ opacity: [0.2, 0.7, 0.2] }}
              transition={{
                duration: 0.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          )}

          {/* Success sparkle overlay */}
          {expression === "success" && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.72 0.18 145 / 0.3) 0%, transparent 70%)",
              }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 0.6,
                repeat: 4,
              }}
            />
          )}
        </motion.button>

        {/* Power button */}
        <button
          type="button"
          onClick={handlePower}
          className="absolute flex items-center justify-center shadow-lg border border-border transition-colors"
          style={{
            bottom: 8,
            right: -2,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: isActive
              ? "oklch(0.55 0.18 145)"
              : "oklch(0.35 0.04 240)",
            color: "white",
          }}
          aria-label={isActive ? "Desativar ARIA" : "Ativar ARIA"}
        >
          <Power size={15} />
        </button>

        {/* Voice toggle button */}
        <button
          type="button"
          onClick={handleVoiceToggle}
          className="absolute flex items-center justify-center shadow-lg border border-border transition-colors"
          style={{
            bottom: 8,
            left: -2,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: voiceEnabled
              ? "oklch(0.45 0.15 195)"
              : "oklch(0.3 0.04 240)",
            color: "white",
          }}
          aria-label={voiceEnabled ? "Desativar voz" : "Ativar voz"}
          data-ocid="aria.voice.toggle"
        >
          {voiceEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>

        {/* Minimize button */}
        <button
          type="button"
          onClick={handleMinimize}
          className="absolute flex items-center justify-center shadow border border-border transition-colors"
          style={{
            top: 4,
            right: -2,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "oklch(0.3 0.04 240)",
            color: "oklch(0.7 0.02 240)",
          }}
          aria-label="Minimizar ARIA"
        >
          <X size={12} />
        </button>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute flex items-center justify-center font-bold text-white shadow"
            style={{
              top: -4,
              left: 0,
              minWidth: 26,
              height: 26,
              borderRadius: 999,
              fontSize: 11,
              background: "oklch(0.55 0.22 25)",
              zIndex: 1,
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.div>
        )}

        {/* Status dot */}
        <div
          className="absolute border-2 border-white"
          style={{
            top: 12,
            left: 8,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: isActive
              ? isProcessing
                ? "oklch(0.75 0.2 85)"
                : "oklch(0.6 0.18 145)"
              : "oklch(0.55 0.03 240)",
          }}
        />
      </div>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-semibold px-3 py-1 rounded-full"
        style={{
          bottom: -32,
          fontSize: 12,
          background: "oklch(0.15 0.04 240 / 0.85)",
          color: isActive ? borderColor : "oklch(0.7 0.03 240)",
          backdropFilter: "blur(8px)",
        }}
      >
        ARIA{" "}
        {isActive ? (isProcessing ? "• processando" : "• ativa") : "• inativa"}
      </motion.div>
    </div>
  );
}

// Separate blinking component to avoid re-renders
function BlinkOverlay() {
  const [blinkPhase, setBlinkPhase] = useState(0);

  useEffect(() => {
    // Blink every 3-4 seconds
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 2000;
      return setTimeout(() => {
        setBlinkPhase((p) => p + 1);
        scheduleNext();
      }, delay);
    };
    const t = scheduleNext();
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      key={blinkPhase}
      className="absolute rounded-full pointer-events-none"
      style={{
        top: "20%",
        left: "10%",
        right: "10%",
        height: "25%",
        background: "oklch(0.1 0.02 240 / 0.85)",
        transformOrigin: "center",
      }}
      initial={{ scaleY: 0 }}
      animate={{ scaleY: [0, 1, 0] }}
      transition={{ duration: 0.18, ease: "easeInOut" }}
    />
  );
}
