// ARIA MEMORY — Memoria Persistente via IndexedDB

const DB_NAME = "aria-brain-v1";
const DB_VERSION = 1;

type StoreName =
  | "patterns"
  | "corrections"
  | "clientProfiles"
  | "learnedRules"
  | "userActions";

export interface Pattern {
  key: string;
  value: string;
  context?: string;
  createdAt: string;
  updatedAt: string;
  useCount: number;
}

export interface Correction {
  id?: number;
  original: string;
  corrected: string;
  context: string;
  screen?: string;
  createdAt: string;
}

export interface ClientProfile {
  clientId: string;
  patterns: Record<string, string>;
  paymentBehavior: "pontual" | "atrasado" | "irregular";
  preferredDocTypes: string[];
  fiscalCalendar: string[];
  notes: string;
  updatedAt: string;
}

export interface LearnedRule {
  id?: number;
  source: string;
  rule: string;
  appliesTo: string;
  createdAt: string;
  active: boolean;
}

export interface UserAction {
  id?: number;
  action: string;
  screen: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface MemorySummary {
  patterns: number;
  corrections: number;
  clientProfiles: number;
  learnedRules: number;
  userActions: number;
}

const inMemoryStore: Record<StoreName, Map<string, unknown>> = {
  patterns: new Map(),
  corrections: new Map(),
  clientProfiles: new Map(),
  learnedRules: new Map(),
  userActions: new Map(),
};

let dbInstance: IDBDatabase | null = null;
let dbUnavailable = false;

async function getDB(): Promise<IDBDatabase | null> {
  if (dbUnavailable) return null;
  if (dbInstance) return dbInstance;
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      dbUnavailable = true;
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      dbUnavailable = true;
      resolve(null);
    };
    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const stores: {
        name: StoreName;
        keyPath: string;
        autoIncrement?: boolean;
      }[] = [
        { name: "patterns", keyPath: "key" },
        { name: "corrections", keyPath: "id", autoIncrement: true },
        { name: "clientProfiles", keyPath: "clientId" },
        { name: "learnedRules", keyPath: "id", autoIncrement: true },
        { name: "userActions", keyPath: "id", autoIncrement: true },
      ];
      for (const store of stores) {
        if (!db.objectStoreNames.contains(store.name)) {
          db.createObjectStore(store.name, {
            keyPath: store.keyPath,
            autoIncrement: store.autoIncrement,
          });
        }
      }
    };
  });
}

async function dbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await getDB();
  if (!db) return inMemoryStore[store].get(key) as T | undefined;
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => resolve(undefined);
  });
}

async function dbPut(store: StoreName, value: unknown): Promise<void> {
  const db = await getDB();
  if (!db) {
    const key =
      (value as Record<string, string>).key ||
      (value as Record<string, string>).clientId ||
      String(Date.now());
    inMemoryStore[store].set(key, value);
    return;
  }
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

async function dbGetAll<T>(store: StoreName): Promise<T[]> {
  const db = await getDB();
  if (!db) return Array.from(inMemoryStore[store].values()) as T[];
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => resolve([]);
  });
}

async function dbCount(store: StoreName): Promise<number> {
  const db = await getDB();
  if (!db) return inMemoryStore[store].size;
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });
}

export async function savePattern(
  key: string,
  value: string,
  context?: string,
): Promise<void> {
  const existing = await getPattern(key);
  const now = new Date().toISOString();
  const pattern: Pattern = {
    key,
    value,
    context,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    useCount: (existing?.useCount ?? 0) + 1,
  };
  await dbPut("patterns", pattern);
}

export async function getPattern(key: string): Promise<Pattern | undefined> {
  return dbGet<Pattern>("patterns", key);
}

export async function saveCorrection(
  original: string,
  corrected: string,
  context: string,
  screen?: string,
): Promise<void> {
  const correction: Correction = {
    original,
    corrected,
    context,
    screen,
    createdAt: new Date().toISOString(),
  };
  await dbPut("corrections", correction);
}

export async function getCorrections(): Promise<Correction[]> {
  return dbGetAll<Correction>("corrections");
}

export async function saveClientProfile(
  clientId: string,
  profile: Partial<ClientProfile>,
): Promise<void> {
  const existing = await getClientProfile(clientId);
  const merged: ClientProfile = {
    clientId,
    patterns: {},
    paymentBehavior: "pontual",
    preferredDocTypes: [],
    fiscalCalendar: [],
    notes: "",
    ...existing,
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  await dbPut("clientProfiles", merged);
}

export async function getClientProfile(
  clientId: string,
): Promise<ClientProfile | undefined> {
  return dbGet<ClientProfile>("clientProfiles", clientId);
}

export async function logUserAction(
  action: string,
  screen: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  const entry: UserAction = {
    action,
    screen,
    details,
    timestamp: new Date().toISOString(),
  };
  await dbPut("userActions", entry);
}

export async function getUserActions(): Promise<UserAction[]> {
  return dbGetAll<UserAction>("userActions");
}

export async function saveLearnedRule(
  source: string,
  rule: string,
  appliesTo: string,
): Promise<void> {
  const entry: LearnedRule = {
    source,
    rule,
    appliesTo,
    createdAt: new Date().toISOString(),
    active: true,
  };
  await dbPut("learnedRules", entry);
}

export async function getLearnedRules(): Promise<LearnedRule[]> {
  return dbGetAll<LearnedRule>("learnedRules");
}

export async function getMemorySummary(): Promise<MemorySummary> {
  const [patterns, corrections, clientProfiles, learnedRules, userActions] =
    await Promise.all([
      dbCount("patterns"),
      dbCount("corrections"),
      dbCount("clientProfiles"),
      dbCount("learnedRules"),
      dbCount("userActions"),
    ]);
  return { patterns, corrections, clientProfiles, learnedRules, userActions };
}

export async function clearMemory(store?: StoreName): Promise<void> {
  const db = await getDB();
  const storesToClear: StoreName[] = store
    ? [store]
    : [
        "patterns",
        "corrections",
        "clientProfiles",
        "learnedRules",
        "userActions",
      ];
  if (!db) {
    for (const s of storesToClear) inMemoryStore[s].clear();
    return;
  }
  return new Promise((resolve) => {
    const tx = db.transaction(storesToClear, "readwrite");
    for (const s of storesToClear) tx.objectStore(s).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}
