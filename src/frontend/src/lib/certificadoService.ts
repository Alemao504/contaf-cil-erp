// Certificado Digital Service — ContaFácil ERP
// Parte 3: Upload e armazenamento seguro de certificados digitais

const CRYPTO_SALT = "contafacil-cert-v1";

export async function encryptPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(CRYPTO_SALT),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("contafacil-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(password),
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptPassword(encryptedB64: string): Promise<string> {
  const enc = new TextEncoder();
  const combined = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(CRYPTO_SALT),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("contafacil-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );
  return new TextDecoder().decode(decrypted);
}

export function parseCertificadoInfo(file: File): {
  nome: string;
  tamanho: number;
  tipo: "A1" | "A3";
} {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const tipo: "A1" | "A3" = ext === "pfx" || ext === "p12" ? "A1" : "A3";
  return { nome: file.name, tamanho: file.size, tipo };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip the data URL prefix
      resolve(result.split(",")[1] ?? result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function isExpirando(validade: string): boolean {
  const exp = new Date(validade).getTime();
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return exp - now < thirtyDays && exp - now > 0;
}

export function statusCertificado(validade: string): "ativo" | "expirado" {
  return new Date(validade).getTime() > Date.now() ? "ativo" : "expirado";
}
