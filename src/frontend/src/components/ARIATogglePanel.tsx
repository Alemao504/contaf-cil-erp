import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bot } from "lucide-react";
import { useEffect, useState } from "react";

interface ARIAToggle {
  key: string;
  label: string;
}

interface ARIATogglePanelProps {
  screenName: string;
  toggles: ARIAToggle[];
}

export default function ARIATogglePanel({
  screenName,
  toggles,
}: ARIATogglePanelProps) {
  const storageKey = `aria-toggles-${screenName}`;

  const [states, setStates] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return Object.fromEntries(toggles.map((t) => [t.key, true]));
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(states));
    } catch {}
  }, [states, storageKey]);

  const toggle = (key: string) => {
    setStates((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      data-ocid={`${screenName}.aria_toggle.panel`}
      className="flex items-center gap-3 flex-wrap rounded-lg px-4 py-2.5 mb-4"
      style={{
        background: "oklch(0.22 0.06 240 / 0.12)",
        border: "1px solid oklch(0.5 0.12 240 / 0.2)",
      }}
    >
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Bot
          className="w-3.5 h-3.5"
          style={{ color: "oklch(0.65 0.18 240)" }}
        />
        <span
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: "oklch(0.65 0.18 240)" }}
        >
          Automação ARIA
        </span>
      </div>
      <div className="w-px h-4 bg-current opacity-20 flex-shrink-0" />
      <div className="flex items-center gap-4 flex-wrap">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center gap-1.5">
            <Switch
              data-ocid={`${screenName}.aria_toggle.${t.key}.switch`}
              id={`aria-toggle-${screenName}-${t.key}`}
              checked={states[t.key] ?? true}
              onCheckedChange={() => toggle(t.key)}
              className="scale-75 origin-left"
            />
            <Label
              htmlFor={`aria-toggle-${screenName}-${t.key}`}
              className="text-[11px] cursor-pointer"
              style={{
                color: states[t.key]
                  ? "oklch(0.75 0.05 240)"
                  : "oklch(0.5 0.02 240)",
              }}
            >
              {t.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
