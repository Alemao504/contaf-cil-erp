import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Document,
  JournalEntry,
  ProcessingResult,
  UserProfile,
} from "../backend";
import {
  type AccountPlanEntry,
  DEFAULT_ACCOUNT_PLAN,
} from "../lib/accountPlan";
import {
  deleteRecord,
  getAllByIndex,
  getAllRecords,
  putRecord,
} from "../lib/db";
import {
  type Client,
  type LocalJournalEntry,
  loadClients,
  saveClients,
} from "../types/local";
import { useActor } from "./useActor";

export type { Client, AccountPlanEntry, LocalJournalEntry };

// ─── Clients (IndexedDB) ──────────────────────────────────────────────────────

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => getAllRecords<Client>("clients"),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: Client) => {
      await putRecord("clients", client);
      const existing = loadClients();
      saveClients([...existing.filter((c) => c.id !== client.id), client]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: Client) => {
      await putRecord("clients", client);
      const existing = loadClients();
      saveClients(existing.map((c) => (c.id === client.id ? client : c)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteRecord("clients", id);
      const existing = loadClients();
      saveClients(existing.filter((c) => c.id !== id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

// ─── Journal Entries (IndexedDB) ──────────────────────────────────────────────

export function useLivroDiario(clientId: string | null) {
  return useQuery<LocalJournalEntry[]>({
    queryKey: ["livroDiario", clientId],
    queryFn: async () =>
      clientId
        ? getAllByIndex<LocalJournalEntry>(
            "journal_entries",
            "clientId",
            clientId,
          )
        : [],
    enabled: !!clientId,
  });
}

export function useJournalEntries(clientId: string | null) {
  return useQuery<LocalJournalEntry[]>({
    queryKey: ["journalEntries", clientId],
    queryFn: async () =>
      clientId
        ? getAllByIndex<LocalJournalEntry>(
            "journal_entries",
            "clientId",
            clientId,
          )
        : [],
    enabled: !!clientId,
  });
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      entry: Omit<LocalJournalEntry, "status"> & {
        valueInCents: bigint | number;
      },
    ) => {
      const record: LocalJournalEntry = {
        ...entry,
        valueInCents: Number(entry.valueInCents),
        status: "conciliado",
      };
      await putRecord("journal_entries", record);
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["journalEntries", v.clientId] });
      qc.invalidateQueries({ queryKey: ["livroDiario", v.clientId] });
    },
  });
}

// ─── Financial reports (stub) ─────────────────────────────────────────────────

interface BalancoItem {
  code: string;
  name: string;
  value: number;
}
interface BalancoData {
  assets: BalancoItem[];
  liabilities: BalancoItem[];
  patrimonio: BalancoItem[];
}
interface DREItem {
  code: string;
  name: string;
  value: number;
}
interface DREData {
  receitas: DREItem[];
  despesas: DREItem[];
}

export function useBalanco(_clientId: string | null) {
  return useQuery<BalancoData>({
    queryKey: ["balanco", _clientId],
    queryFn: async () => ({ assets: [], liabilities: [], patrimonio: [] }),
    enabled: !!_clientId,
  });
}

export function useDRE(_clientId: string | null) {
  return useQuery<DREData>({
    queryKey: ["dre", _clientId],
    queryFn: async () => ({ receitas: [], despesas: [] }),
    enabled: !!_clientId,
  });
}

interface BalanceteAccount {
  code: string;
  name: string;
  accountType: string;
}
interface BalanceteEntry {
  code: string;
  name: string;
  debit: number;
  credit: number;
  balance: number;
}
interface BalanceteData {
  entries: BalanceteEntry[];
  accounts: BalanceteAccount[];
}

export function useBalancete(_clientId: string | null) {
  return useQuery<BalanceteData>({
    queryKey: ["balancete", _clientId],
    queryFn: async () => ({ entries: [], accounts: [] }),
    enabled: !!_clientId,
  });
}

// ─── Account Plan (localStorage) ─────────────────────────────────────────────

const ACCOUNT_PLAN_KEY = "contafacil_accountPlan";

function loadAccountPlan(clientId: string): AccountPlanEntry[] {
  try {
    const raw = localStorage.getItem(`${ACCOUNT_PLAN_KEY}_${clientId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as AccountPlanEntry[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_ACCOUNT_PLAN;
}

export function useAccountPlan(clientId: string | null) {
  return useQuery<AccountPlanEntry[]>({
    queryKey: ["accountPlan", clientId],
    queryFn: () => (clientId ? loadAccountPlan(clientId) : []),
    enabled: !!clientId,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useAddAccountEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      clientId,
      entry,
    }: { clientId: string; entry: AccountPlanEntry }) => {
      const plan = loadAccountPlan(clientId);
      const next = [...plan.filter((e) => e.code !== entry.code), entry];
      localStorage.setItem(
        `${ACCOUNT_PLAN_KEY}_${clientId}`,
        JSON.stringify(next),
      );
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["accountPlan", v.clientId] }),
  });
}

// ─── Documents (backend) ─────────────────────────────────────────────────────

export function useDocuments() {
  const { actor, isFetching } = useActor();
  return useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: async () => (actor ? actor.getAllDocuments() : []),
    enabled: !!actor && !isFetching,
  });
}

export function useAddDocument() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: Document) => {
      if (!actor) throw new Error("No actor");
      await actor.addDocument(doc);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

// ─── User Profile (backend) ───────────────────────────────────────────────────

export function useSaveProfile() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("No actor");
      await actor.saveCallerUserProfile(profile);
    },
  });
}

// ─── AI Processing (backend) ─────────────────────────────────────────────────

export function useProcessDocument() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      docId,
      clientId,
      claudeApiKey,
    }: {
      docId: string;
      clientId: string;
      claudeApiKey: string;
    }): Promise<ProcessingResult> => {
      if (!actor) throw new Error("No actor");
      return actor.processDocumentWithAI(docId, clientId, claudeApiKey);
    },
  });
}

export function useConfirmJournalEntries() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      docId,
      clientId,
      entries,
    }: { docId: string; clientId: string; entries: JournalEntry[] }) => {
      if (!actor) throw new Error("No actor");
      await actor.confirmJournalEntries(docId, clientId, entries);
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["journalEntries", v.clientId] });
      qc.invalidateQueries({ queryKey: ["livroDiario", v.clientId] });
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
