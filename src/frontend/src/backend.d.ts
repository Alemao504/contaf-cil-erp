import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface http_header {
    value: string;
    name: string;
}
export interface ProcessingResult {
    status: string;
    totalValue: bigint;
    cnpj: string;
    errorMessage: string;
    description: string;
    extractedType: string;
    suggestedEntries: Array<JournalEntry>;
    docDate: string;
    docId: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface JournalEntry {
    id: string;
    creditCode: string;
    entryDate: string;
    clientId: string;
    description: string;
    debitCode: string;
    docId: string;
    valueInCents: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Document {
    id: string;
    status: string;
    clientId: string;
    blob: ExternalBlob;
    year: bigint;
    extractedText: string;
    filename: string;
    docType: string;
}
export interface UserProfile {
    name: string;
    role: string;
    email: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDocument(document: Document): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    confirmJournalEntries(docId: string, clientId: string, entries: Array<JournalEntry>): Promise<void>;
    getAllDocuments(): Promise<Array<Document>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDocument(id: string): Promise<Document>;
    getProcessingResult(docId: string): Promise<ProcessingResult | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    processDocumentWithAI(docId: string, clientId: string, claudeApiKey: string): Promise<ProcessingResult>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
