import { putRecord } from "./db";

/**
 * Starts camera stream and attaches to a video element.
 */
export async function startCamera(
  videoEl: HTMLVideoElement,
  facingMode: "environment" | "user",
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode },
    audio: false,
  });
  videoEl.srcObject = stream;
  try {
    await videoEl.play();
  } catch {
    // autoPlay attribute handles playback, ignore
  }
  return stream;
}

/**
 * Stops all tracks on a media stream.
 */
export function stopCamera(stream: MediaStream | null): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

/**
 * Captures the current frame from a video element into a new canvas.
 */
export function captureFrame(videoEl: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

/**
 * Applies a high-contrast black-and-white document filter in-place.
 * Uses luminance threshold: pixels above 128 → white, below → black.
 */
export function applyDocumentFilter(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const val = lum > 128 ? 255 : 0;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    // alpha unchanged
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Applies a sharpening kernel [0,-1,0,-1,5,-1,0,-1,0] as a photo filter.
 */
export function applyPhotoFilter(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  const src = ctx.getImageData(0, 0, width, height);
  const dst = ctx.createImageData(width, height);
  const s = src.data;
  const d = dst.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        // Copy edges unchanged
        d[idx] = s[idx];
        d[idx + 1] = s[idx + 1];
        d[idx + 2] = s[idx + 2];
        d[idx + 3] = s[idx + 3];
      } else {
        // Sharpen: 5*center - top - bottom - left - right
        for (let c = 0; c < 3; c++) {
          const val =
            5 * s[idx + c] -
            s[((y - 1) * width + x) * 4 + c] -
            s[((y + 1) * width + x) * 4 + c] -
            s[(y * width + x - 1) * 4 + c] -
            s[(y * width + x + 1) * 4 + c];
          d[idx + c] = Math.max(0, Math.min(255, val));
        }
        d[idx + 3] = 255;
      }
    }
  }
  ctx.putImageData(dst, 0, 0);
}

/**
 * Rotates a canvas 90 degrees in the given direction, returning a new canvas.
 */
export function rotateCanvas(
  canvas: HTMLCanvasElement,
  direction: "left" | "right",
): HTMLCanvasElement {
  const rotated = document.createElement("canvas");
  rotated.width = canvas.height;
  rotated.height = canvas.width;
  const ctx = rotated.getContext("2d");
  if (!ctx) return canvas;
  ctx.translate(rotated.width / 2, rotated.height / 2);
  ctx.rotate(direction === "right" ? Math.PI / 2 : -Math.PI / 2);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return rotated;
}

/**
 * Converts a canvas to a PNG Blob.
 */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to convert canvas to PNG blob"));
    }, "image/png");
  });
}

export interface DigitalizedDoc {
  id: string;
  clientId: string;
  fileName: string;
  tipo: string;
  dataUrl: string;
  tamanho: number;
  createdAt: string;
}

/**
 * Saves a digitalized document to IndexedDB store 'documents_local'.
 * Returns the generated document ID.
 */
export async function saveDigitalizedDoc(
  canvas: HTMLCanvasElement,
  fileName: string,
  clientId: string,
): Promise<string> {
  const id = `dig_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const dataUrl = canvas.toDataURL("image/png");
  // Approximate byte size from base64 length
  const tamanho = Math.round((dataUrl.length * 3) / 4);
  const record: DigitalizedDoc = {
    id,
    clientId,
    fileName,
    tipo: "digitalizado",
    dataUrl,
    tamanho,
    createdAt: new Date().toISOString(),
  };
  await putRecord("documents_local", record);
  return id;
}
