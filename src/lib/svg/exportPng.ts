import { downloadBlob } from "@/lib/utils/downloadFile";
import { cleanupPngWhiteResidual } from "./pngResidualCleanup";

export async function exportSvgToPng(
  svgText: string,
  options: {
    width: number;
    height: number;
    scale: number;
    transparent: boolean;
    cleanWhiteResidual?: boolean;
    residualBackgroundColor?: string | null;
    residualTolerance?: number;
  },
  fileName: string,
): Promise<void> {
  const { width, height, scale, transparent } = options;
  const canvasWidth = width * scale;
  const canvasHeight = height * scale;

  // Check for external images
  if (svgText.includes("<image") && (svgText.includes("http://") || svgText.includes("https://"))) {
    throw new Error("SVG contains external images and cannot be exported to canvas.");
  }

  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to create canvas context.");

    // Clear canvas (transparent by default)
    if (!transparent) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Draw SVG
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

    // Best-effort edge-connected white residual cleanup for transparent output.
    if (transparent && options.cleanWhiteResidual !== false) {
      try {
        cleanupPngWhiteResidual(canvas, {
          backgroundColor: options.residualBackgroundColor || "#FFFFFF",
          tolerance: options.residualTolerance ?? 24,
          haloRadius: 1,
        });
      } catch {
        // Never fail export because of cleanup.
      }
    }

    // Convert to PNG blob
    const pngBlob = await canvasToBlob(canvas, "image/png");
    downloadBlob(pngBlob, fileName);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load SVG as image."));
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert canvas to blob."));
      },
      type,
      1.0,
    );
  });
}
