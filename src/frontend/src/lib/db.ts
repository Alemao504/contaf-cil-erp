// IndexedDB service for ContaFácil ERP
import type { DocumentAnalysis } from "./claudeService";

const DB_NAME = "contafacil_db";
const DB_VERSION = 19;

export interface OcrResult {
  id: string; // docId
  clientId: string;
  fileName: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  analysis: DocumentAnalysis;
}

export interface CertificadoDigital {
  id: string;
  nome: string;
  tipo: "A1" | "A3";
  cnpj: string;
  razaoSocial: string;
  validade: string;
  armazenado: string;
  tamanho: number;
  status: "ativo" | "expirado" | "pendente";
  dadosCertificado: string; // base64 do arquivo
  senhaCriptografada?: string;
}

export interface PatrimonioBem {
  id: string;
  code: string;
  desc: string;
  group: string;
  acquisition: string;
  original: number;
  life: string;
  rate: string;
  accumulated: number;
  current: number;
  status: string;
  serie?: string;
  localizacao?: string;
  responsavel?: string;
  fornecedor?: string;
  numeroNF?: string;
  observacoes?: string;
  cliente?: string;
}

export interface PatrimonioCategoria {
  id: string;
  name: string;
  rate: number; // percent per year
  lifeYears: number;
  custom?: boolean;
}

const STORES: {
  name: string;
  keyPath: string;
  indexes?: { name: string; keyPath: string }[];
}[] = [
  { name: "clients", keyPath: "id" },
  {
    name: "journal_entries",
    keyPath: "id",
    indexes: [{ name: "clientId", keyPath: "clientId" }],
  },
  {
    name: "documents_local",
    keyPath: "id",
    indexes: [{ name: "clientId", keyPath: "clientId" }],
  },
  {
    name: "notas_fiscais",
    keyPath: "id",
    indexes: [{ name: "clientId", keyPath: "clientId" }],
  },
  { name: "agenda_items", keyPath: "id" },
  { name: "configuracoes", keyPath: "key" },
  {
    name: "ocr_results",
    keyPath: "id",
    indexes: [{ name: "clientId", keyPath: "clientId" }],
  },
  {
    name: "certificados_digitais",
    keyPath: "id",
    indexes: [{ name: "tipo", keyPath: "tipo" }],
  },
  {
    name: "workflow_items",
    keyPath: "id",
    indexes: [
      { name: "clientId", keyPath: "clientId" },
      { name: "status_atual", keyPath: "status_atual" },
      { name: "nivel_aprovacao", keyPath: "nivel_aprovacao" },
    ],
  },
  {
    name: "simulacoes_tributarias",
    keyPath: "id",
    indexes: [{ name: "clientId", keyPath: "clientId" }],
  },
  {
    name: "fraude_alertas",
    keyPath: "id",
    indexes: [
      { name: "clientId", keyPath: "clientId" },
      { name: "nivel", keyPath: "nivel" },
      { name: "status", keyPath: "status" },
    ],
  },
  {
    name: "notas_livres",
    keyPath: "id",
    indexes: [
      { name: "clientId", keyPath: "clientId" },
      { name: "tags", keyPath: "tags" },
    ],
  },
  {
    name: "orcamento_centros",
    keyPath: "id",
    indexes: [{ name: "status", keyPath: "status" }],
  },
  {
    name: "orcamento_lancamentos",
    keyPath: "id",
    indexes: [
      { name: "centroId", keyPath: "centroId" },
      { name: "ano", keyPath: "ano" },
    ],
  },
  {
    name: "documentos_assinados",
    keyPath: "id",
    indexes: [
      { name: "clientId", keyPath: "clientId" },
      { name: "status", keyPath: "status" },
    ],
  },
  {
    name: "aria_aprendizado",
    keyPath: "id",
    indexes: [
      { name: "clienteId", keyPath: "clienteId" },
      { name: "tipo", keyPath: "tipo" },
    ],
  },
  { name: "backup_historico", keyPath: "id" },
  {
    name: "patrimonio_bens",
    keyPath: "id",
    indexes: [
      { name: "group", keyPath: "group" },
      { name: "status", keyPath: "status" },
    ],
  },
  { name: "patrimonio_categorias", keyPath: "id" },
  { name: "patrimonio_depreciacao", keyPath: "id" },
  { name: "lixeira_itens", keyPath: "id" },
  {
    name: "notificacoes_lembretes",
    keyPath: "id",
    indexes: [
      { name: "clienteId", keyPath: "clienteId" },
      { name: "status", keyPath: "status" },
    ],
  },
  {
    name: "notificacoes_historico",
    keyPath: "id",
    indexes: [{ name: "clienteNome", keyPath: "clienteNome" }],
  },
  // v16 — Gestão de Contratos
  {
    name: "contratos",
    keyPath: "id",
    indexes: [
      { name: "clienteId", keyPath: "clienteId" },
      { name: "status", keyPath: "status" },
    ],
  },
  {
    name: "contrato_faturas",
    keyPath: "id",
    indexes: [
      { name: "contratoId", keyPath: "contratoId" },
      { name: "mesReferencia", keyPath: "mesReferencia" },
      { name: "status", keyPath: "status" },
    ],
  },
  // v17 — BI Studio
  { name: "bi_metricas", keyPath: "id" },
  { name: "bi_widgets", keyPath: "id" },
  // v18 — IRPF
  {
    name: "irpf_declaracoes",
    keyPath: "id",
    indexes: [
      { name: "clienteId", keyPath: "clienteId" },
      { name: "ano", keyPath: "ano" },
    ],
  },
  // v19 — ARIA Memória
  {
    name: "aria_memoria",
    keyPath: "id",
    indexes: [
      { name: "tipo", keyPath: "tipo" },
      { name: "fonte", keyPath: "fonte" },
    ],
  },
  {
    name: "aria_perfil_clientes",
    keyPath: "id",
    indexes: [{ name: "clienteId", keyPath: "clienteId" }],
  },
];

let dbInstance: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store.name)) {
          const os = db.createObjectStore(store.name, {
            keyPath: store.keyPath,
          });
          if (store.indexes) {
            for (const idx of store.indexes) {
              os.createIndex(idx.name, idx.keyPath, { unique: false });
            }
          }
        }
      }
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("IndexedDB blocked"));
  });
}

export async function getAllRecords<T>(store: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(store, "readonly")
      .objectStore(store)
      .getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function getRecord<T>(
  store: string,
  id: string,
): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(store, "readonly")
      .objectStore(store)
      .get(id);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function putRecord(store: string, item: object): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(store, "readwrite")
      .objectStore(store)
      .put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function addRecord(store: string, item: object): Promise<void> {
  return putRecord(store, item);
}

export async function deleteRecord(store: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(store, "readwrite")
      .objectStore(store)
      .delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllByIndex<T>(
  store: string,
  indexName: string,
  value: string,
): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const index = db
      .transaction(store, "readonly")
      .objectStore(store)
      .index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function clearStore(store: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(store, "readwrite")
      .objectStore(store)
      .clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function migrateFromLocalStorage(): Promise<void> {
  if (localStorage.getItem("contafacil_migrated") === "1") return;
  try {
    const raw = localStorage.getItem("contafacil_clients");
    const defaultClients = [
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
        name: "Servi\u00e7os Delta EPP",
        cnpj: "77.888.999/0001-55",
        regime: "Simples Nacional",
        active: true,
      },
    ];
    const clients = raw ? (JSON.parse(raw) as object[]) : defaultClients;
    const list =
      Array.isArray(clients) && clients.length > 0 ? clients : defaultClients;
    for (const client of list) await putRecord("clients", client);
    localStorage.setItem("contafacil_migrated", "1");
  } catch (err) {
    console.warn("Migration from localStorage failed:", err);
  }
}

export async function getStorageStats(): Promise<Record<string, number>> {
  const counts = await Promise.all(
    STORES.map(async (s) => {
      try {
        const recs = await getAllRecords(s.name);
        return { name: s.name, count: recs.length };
      } catch {
        return { name: s.name, count: 0 };
      }
    }),
  );
  return Object.fromEntries(counts.map((c) => [c.name, c.count]));
}

// ---- Certificado Digital convenience functions ----

export async function saveCertificado(cert: CertificadoDigital): Promise<void> {
  return putRecord("certificados_digitais", cert);
}

export async function getCertificado(
  id: string,
): Promise<CertificadoDigital | undefined> {
  return getRecord<CertificadoDigital>("certificados_digitais", id);
}

export async function getAllCertificados(): Promise<CertificadoDigital[]> {
  return getAllRecords<CertificadoDigital>("certificados_digitais");
}

export async function deleteCertificado(id: string): Promise<void> {
  return deleteRecord("certificados_digitais", id);
}

// ---- saveRecord alias (used by some pages) ----
export async function saveRecord(store: string, item: object): Promise<void> {
  return putRecord(store, item);
}
