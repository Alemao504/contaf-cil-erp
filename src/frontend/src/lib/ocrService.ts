// OCR Service — extract text from files in the browser
// pdfjs-dist is loaded from CDN at runtime via window.pdfjsLib

interface PdfjsLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(src: { data: ArrayBuffer }): { promise: Promise<PdfDocProxy> };
}
interface PdfDocProxy {
  numPages: number;
  getPage(n: number): Promise<PdfPageProxy>;
  destroy(): void;
}
interface PdfPageProxy {
  getTextContent(): Promise<{ items: Array<{ str: string }> }>;
}

function getPdfJs(): PdfjsLib | null {
  const w = window as unknown as { pdfjsLib?: PdfjsLib };
  if (w.pdfjsLib) return w.pdfjsLib;
  return null;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") return extractFromPdf(file);
  if (ext === "xml") return extractFromXml(file);
  if (["txt", "csv"].includes(ext)) return file.text();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    return extractFromImage(file);
  if (["doc", "docx"].includes(ext)) return extractFromDocx(file);
  return "";
}

async function extractFromPdf(file: File): Promise<string> {
  try {
    const pdfjsLib = getPdfJs();
    if (!pdfjsLib) return "";
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      pages.push(pageText);
    }
    return pages.join("\n");
  } catch (err) {
    console.warn("PDF extraction failed:", err);
    return "";
  }
}

async function extractFromXml(file: File): Promise<string> {
  try {
    const text = await file.text();
    return text
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

function extractFromImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(`[IMAGE_BASE64]${reader.result as string}`);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

async function extractFromDocx(file: File): Promise<string> {
  try {
    const text = await file.text();
    const readable = text
      .replace(/[^\x20-\x7E\u00C0-\u024F\n]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return readable.length > 20 ? readable : "";
  } catch {
    return "";
  }
}
