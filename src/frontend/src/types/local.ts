export interface Client {
  id: string;
  name: string;
  cnpj: string;
  regime: string;
  active: boolean;
}

export interface AccountPlanEntry {
  code: string;
  name: string;
  accountType: string;
}

export interface LocalJournalEntry {
  id: string;
  clientId: string;
  entryDate: string;
  debitCode: string;
  creditCode: string;
  description: string;
  valueInCents: number;
  docId: string;
  status: "pendente" | "conciliado" | "aprovado";
}

const STORAGE_KEY = "contafacil_clients";

const DEFAULT_CLIENTS: Client[] = [
  {
    id: "client-1",
    name: "Empresa Alfa Ltda",
    cnpj: "12.345.678/0001-99",
    regime: "Simples Nacional",
    active: true,
  },
  {
    id: "client-2",
    name: "Tech Solutions SA",
    cnpj: "98.765.432/0001-10",
    regime: "Lucro Presumido",
    active: true,
  },
  {
    id: "client-3",
    name: "Construtora Beta Ltda",
    cnpj: "11.222.333/0001-44",
    regime: "Lucro Real",
    active: true,
  },
  {
    id: "client-4",
    name: "Comercial Gama ME",
    cnpj: "44.555.666/0001-77",
    regime: "Simples Nacional",
    active: true,
  },
  {
    id: "client-5",
    name: "Serviços Delta EPP",
    cnpj: "77.888.999/0001-55",
    regime: "Simples Nacional",
    active: true,
  },
];

export function loadClients(): Client[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Client[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  saveClients(DEFAULT_CLIENTS);
  return DEFAULT_CLIENTS;
}

export function saveClients(clients: Client[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  } catch {}
}
