import imageCompression from "browser-image-compression";
import { PDFDocument } from "pdf-lib";

export type CompressionStrategy =
  | "image-basic"
  | "image-heic-convert"
  | "pdf-optimize"
  | "passthrough";

export type CompressionResult = {
  outputFile: File;
  originalName: string;
  mimeType: string;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  strategy: CompressionStrategy;
  iterations: number;
  warnings: string[];
  timedOut: boolean;
  failed: boolean;
  failureReason?: string;
};

type CompressOptions = {
  targetBytes: number;
  absoluteCapBytes: number;
  signal?: AbortSignal;
  timeoutMs?: number;
};

const HEIC_MIMES = new Set(["image/heic", "image/heif"]);
const IMAGE_MIMES = new Set(["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"]);

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("compression-timeout")), timeoutMs);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

function toFile(blob: Blob, fileName: string, type: string): File {
  return new File([blob], fileName, { type });
}

async function compressImage(file: File, opts: CompressOptions): Promise<CompressionResult> {
  const warnings: string[] = [];
  const originalSize = file.size;
  let workingFile = file;
  let strategy: CompressionStrategy = "image-basic";

  if (HEIC_MIMES.has(file.type)) {
    try {
      const heic2anyModule = await import("heic2any");
      const heic2any = heic2anyModule.default;
      const convertedBlob = (await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.82,
      })) as Blob;
      const convertedName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
      workingFile = toFile(convertedBlob, convertedName, "image/jpeg");
      strategy = "image-heic-convert";
    } catch {
      return {
        outputFile: file,
        originalName: file.name,
        mimeType: file.type,
        originalSize,
        compressedSize: originalSize,
        ratio: 1,
        strategy,
        iterations: 0,
        warnings: ["HEIC conversion failed"],
        timedOut: false,
        failed: true,
        failureReason: "heic-convert-failed",
      };
    }
  }

  const maxSizeMB = Math.max(0.1, Math.min(opts.absoluteCapBytes, opts.targetBytes) / (1024 * 1024));
  const compressorPromise = imageCompression(workingFile, {
    maxSizeMB,
    maxWidthOrHeight: 2200,
    useWebWorker: true,
    initialQuality: 0.82,
    signal: opts.signal,
  });
  try {
    const compressedBlob = await withTimeout(compressorPromise, opts.timeoutMs ?? 12000);
    const outputFile = toFile(compressedBlob, workingFile.name, compressedBlob.type || workingFile.type);
    if (outputFile.size >= workingFile.size) {
      warnings.push("compression-not-beneficial");
      return {
        outputFile: workingFile,
        originalName: file.name,
        mimeType: workingFile.type,
        originalSize,
        compressedSize: workingFile.size,
        ratio: workingFile.size / Math.max(1, originalSize),
        strategy,
        iterations: 1,
        warnings,
        timedOut: false,
        failed: false,
      };
    }
    return {
      outputFile,
      originalName: file.name,
      mimeType: outputFile.type,
      originalSize,
      compressedSize: outputFile.size,
      ratio: outputFile.size / Math.max(1, originalSize),
      strategy,
      iterations: 1,
      warnings,
      timedOut: false,
      failed: false,
    };
  } catch (e: any) {
    return {
      outputFile: file,
      originalName: file.name,
      mimeType: file.type,
      originalSize,
      compressedSize: file.size,
      ratio: 1,
      strategy,
      iterations: 1,
      warnings,
      timedOut: e?.message === "compression-timeout",
      failed: true,
      failureReason: e?.message || "image-compression-failed",
    };
  }
}

async function compressPdf(file: File, opts: CompressOptions): Promise<CompressionResult> {
  const warnings: string[] = [];
  const originalSize = file.size;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await PDFDocument.load(bytes);
    const out = await withTimeout(
      pdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false,
      }),
      opts.timeoutMs ?? 12000
    );
    const compressedFile = new File([out], file.name, { type: "application/pdf" });
    if (compressedFile.size >= file.size) {
      warnings.push("pdf-optimization-not-beneficial");
      return {
        outputFile: file,
        originalName: file.name,
        mimeType: file.type,
        originalSize,
        compressedSize: file.size,
        ratio: 1,
        strategy: "pdf-optimize",
        iterations: 1,
        warnings,
        timedOut: false,
        failed: false,
      };
    }
    return {
      outputFile: compressedFile,
      originalName: file.name,
      mimeType: compressedFile.type,
      originalSize,
      compressedSize: compressedFile.size,
      ratio: compressedFile.size / Math.max(1, originalSize),
      strategy: "pdf-optimize",
      iterations: 1,
      warnings,
      timedOut: false,
      failed: false,
    };
  } catch (e: any) {
    return {
      outputFile: file,
      originalName: file.name,
      mimeType: file.type,
      originalSize,
      compressedSize: file.size,
      ratio: 1,
      strategy: "pdf-optimize",
      iterations: 1,
      warnings,
      timedOut: e?.message === "compression-timeout",
      failed: true,
      failureReason: e?.message || "pdf-compression-failed",
    };
  }
}

export async function compressUploadFile(file: File, opts: CompressOptions): Promise<CompressionResult> {
  if (IMAGE_MIMES.has(file.type)) {
    return compressImage(file, opts);
  }
  if (file.type === "application/pdf") {
    return compressPdf(file, opts);
  }
  return {
    outputFile: file,
    originalName: file.name,
    mimeType: file.type,
    originalSize: file.size,
    compressedSize: file.size,
    ratio: 1,
    strategy: "passthrough",
    iterations: 0,
    warnings: ["unsupported-for-compression"],
    timedOut: false,
    failed: false,
  };
}

export function shouldUseServerFallback(result: CompressionResult, remainingBudgetBytes: number): boolean {
  if (result.compressedSize <= remainingBudgetBytes) return false;
  return result.failed || result.timedOut || result.compressedSize > remainingBudgetBytes;
}
