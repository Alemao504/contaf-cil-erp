import { useCallback, useState } from "react";
import { ARIA_MODULE_GROUPS } from "../lib/ariaModules";

const STORAGE_KEY = "aria_modules_config";

function getDefaults(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {};
  for (const group of ARIA_MODULE_GROUPS) {
    for (const mod of group.modules) {
      defaults[mod.id] = mod.defaultOn;
    }
  }
  return defaults;
}

export function useAriaModules() {
  const [modules, setModules] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...getDefaults(), ...JSON.parse(saved) };
    } catch {}
    return getDefaults();
  });

  const toggle = useCallback((id: string) => {
    setModules((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setGroupAll = useCallback((groupId: string, value: boolean) => {
    const group = ARIA_MODULE_GROUPS.find((g) => g.id === groupId);
    if (!group) return;
    setModules((prev) => {
      const next = { ...prev };
      for (const mod of group.modules) next[mod.id] = value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setAll = useCallback((value: boolean) => {
    setModules((prev) => {
      const next = { ...prev };
      for (const group of ARIA_MODULE_GROUPS) {
        for (const mod of group.modules) next[mod.id] = value;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const activeCount = Object.values(modules).filter(Boolean).length;
  const totalCount = Object.keys(modules).length;

  return { modules, toggle, setGroupAll, setAll, activeCount, totalCount };
}
