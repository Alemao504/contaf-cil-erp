import { Power, X } from "lucide-react";
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
    return { x: window.innerWidth - 100, y: window.innerHeight - 100 };
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
        Math.min(window.innerWidth - 80, dragStart.current.bx + dx),
      );
      const ny = Math.max(
        0,
        Math.min(window.innerHeight - 80, dragStart.current.by + dy),
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
        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg text-base border border-border"
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
              right: "88px",
              top: "-8px",
              zIndex: 10000,
              maxWidth: "220px",
              minWidth: "120px",
            }}
          >
            {/* Bubble body */}
            <div
              className="relative px-3 py-2 text-[11px] leading-tight font-medium shadow-xl"
              style={{
                background: "oklch(0.14 0.05 240 / 0.97)",
                border: `1.5px solid ${borderColor}`,
                borderRadius: "12px 12px 2px 12px",
                color: "oklch(0.92 0.02 240)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Expression emoji */}
              <span className="mr-1">{EXPRESSION_FACES[expression]}</span>
              {speechText}
              {/* Bubble tail */}
              <div
                className="absolute"
                style={{
                  right: "-8px",
                  bottom: "6px",
                  width: 0,
                  height: 0,
                  borderLeft: `8px solid ${borderColor}`,
                  borderTop: "6px solid transparent",
                  borderBottom: "6px solid transparent",
                }}
              />
              <div
                className="absolute"
                style={{
                  right: "-6px",
                  bottom: "7px",
                  width: 0,
                  height: 0,
                  borderLeft: "7px solid oklch(0.14 0.05 240 / 0.97)",
                  borderTop: "5px solid transparent",
                  borderBottom: "5px solid transparent",
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
            background: `radial-gradient(circle, ${borderColor.replace(")", " / 0.3)")} 0%, transparent 70%)`,
            width: 80,
            height: 80,
          }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.15, 0.6] }}
          transition={{
            duration: 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Bubble container */}
      <div className="relative" style={{ width: 80, height: 80 }}>
        {/* Animated border ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: isActive
              ? `conic-gradient(from 0deg, ${borderColor}, oklch(0.75 0.2 255), ${borderColor})`
              : "conic-gradient(from 0deg, oklch(0.6 0.02 240), oklch(0.5 0.02 240))",
            padding: 2,
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
            style={{ inset: -4, borderColor }}
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.3, 1] }}
            transition={{
              duration: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Avatar image + expression overlay */}
        <button
          type="button"
          onClick={handleAvatarClick}
          className="absolute inset-[2px] rounded-full overflow-hidden focus:outline-none"
          aria-label="Abrir chat ARIA"
          data-ocid="aria.toggle"
        >
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
                  "aria-fallback w-full h-full rounded-full flex items-center justify-center text-2xl";
                fallback.style.background =
                  "linear-gradient(135deg, oklch(0.3 0.2 195), oklch(0.25 0.15 255))";
                fallback.textContent = EXPRESSION_FACES[expression];
                parent.appendChild(fallback);
              }
            }}
          />
          {/* Expression overlay emoji — shown when not idle */}
          {expression !== "idle" && (
            <motion.div
              key={expression}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center text-sm shadow"
              style={{ background: "oklch(0.12 0.04 240 / 0.9)" }}
            >
              {EXPRESSION_FACES[expression]}
            </motion.div>
          )}
          {/* Working animation shimmer */}
          {expression === "working" && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.75 0.2 255 / 0.25) 0%, transparent 60%)",
              }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          )}
        </button>

        {/* Power button */}
        <button
          type="button"
          onClick={handlePower}
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border border-border transition-colors"
          style={{
            background: isActive
              ? "oklch(0.55 0.18 145)"
              : "oklch(0.35 0.04 240)",
            color: "white",
          }}
          aria-label={isActive ? "Desativar ARIA" : "Ativar ARIA"}
        >
          <Power size={10} />
        </button>

        {/* Minimize button */}
        <button
          type="button"
          onClick={handleMinimize}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow border border-border transition-colors"
          style={{
            background: "oklch(0.3 0.04 240)",
            color: "oklch(0.7 0.02 240)",
          }}
          aria-label="Minimizar ARIA"
        >
          <X size={9} />
        </button>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 left-0 min-w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
            style={{ background: "oklch(0.55 0.22 25)", zIndex: 1 }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.div>
        )}

        {/* Status dot */}
        <div
          className="absolute top-0 left-0 w-3 h-3 rounded-full border-2 border-white"
          style={{
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
        className="absolute left-1/2 -translate-x-1/2 -bottom-8 whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{
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
