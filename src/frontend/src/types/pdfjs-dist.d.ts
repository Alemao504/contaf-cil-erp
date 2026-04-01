// Type shim for pdfjs-dist (loaded via CDN at runtime)
declare module "pdfjs-dist" {
  export const GlobalWorkerOptions: { workerSrc: string };
  export function getDocument(
    src: string | ArrayBuffer | Uint8Array | { data: ArrayBuffer },
  ): {
    promise: Promise<PDFDocumentProxy>;
  };
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNum: number): Promise<PDFPageProxy>;
    destroy(): void;
  }
  export interface PDFPageProxy {
    getTextContent(): Promise<{ items: Array<{ str: string }> }>;
  }
}
