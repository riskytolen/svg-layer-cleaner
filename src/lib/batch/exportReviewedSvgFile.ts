import { BatchAutomationOptions, BatchLogEntry, ExportFormat } from "./batchTypes";
import { serializeSvg } from "@/lib/svg/serializeSvg";
import { cleanupPngWhiteResidual } from "@/lib/svg/pngResidualCleanup";
import { prepareSvgForExport } from "@/lib/svg/prepareSvgForExport";
import { prepareSvgForEpsExport } from "@/lib/svg/prepareSvgForEpsExport";

export type ExportReviewedResult = {
  outputNames: string[];
  exportedFormats: ExportFormat[];
  residualPixelsRemoved: number;
  haloPixelsSoftened: number;
};

/**
 * Stage 2 of the batch pipeline: export an (optionally manually reviewed)
 * document to the selected formats. Used by both direct batch export and
 * the manual review "Export Reviewed Batch" action.
 */
export async function exportDocToOutputFormats(
  doc: Document,
  baseName: string,
  outputHandle: any,
  options: BatchAutomationOptions,
  addLog: (entry: Omit<BatchLogEntry, "timestamp">) => void,
  bgColor: string | null | undefined,
  fileNameForLog?: string,
): Promise<ExportReviewedResult> {
  const fileName = fileNameForLog || `${baseName}.svg`;
  const out: ExportReviewedResult = {
    outputNames: [],
    exportedFormats: [],
    residualPixelsRemoved: 0,
    haloPixelsSoftened: 0,
  };

  for (const format of options.exportFormats) {
    try {
      switch (format) {
        case "svg": {
          const svgOutput = prepareSvgForExport(doc, {
            removeEditorData: false,
            keepLayerIds: false,
          });
          const blob = new Blob([svgOutput], { type: "image/svg+xml;charset=utf-8" });
          await saveToOutputFolder(outputHandle, "svg", `cleaned-${baseName}.svg`, blob, options.overwriteExisting);
          out.outputNames.push(`cleaned-${baseName}.svg`);
          out.exportedFormats.push("svg");
          addLog({ level: "export", message: `${fileName}: SVG saved.`, fileName });
          break;
        }
        case "png": {
          const svgForPng = prepareSvgForExport(doc, {
            removeEditorData: false,
            keepLayerIds: false,
          });
          const { blob: pngBlob, removedPixels, haloPixels } = await convertSvgToPng(
            svgForPng,
            2500,
            2500,
            options.pngTransparent,
            {
              cleanResidual: options.cleanPngResidual && options.pngTransparent,
              backgroundColor: bgColor || "#FFFFFF",
              tolerance: options.pngResidualTolerance,
            },
          );
          out.residualPixelsRemoved += removedPixels;
          out.haloPixelsSoftened += haloPixels;
          if (removedPixels > 0 || haloPixels > 0) {
            addLog({ level: "export", message: `${fileName}: [PNG] Residual pixels removed: ${removedPixels}, halo softened: ${haloPixels}.`, fileName });
          }
          await saveToOutputFolder(outputHandle, "png", `cleaned-${baseName}.png`, pngBlob, options.overwriteExisting);
          out.outputNames.push(`cleaned-${baseName}.png`);
          out.exportedFormats.push("png");
          addLog({ level: "export", message: `${fileName}: PNG saved.`, fileName });
          break;
        }
        case "jpg": {
          const svgForJpg = prepareSvgForExport(doc, {
            removeEditorData: false,
            keepLayerIds: false,
          });
          const jpgBlob = await convertSvgToJpg(svgForJpg, 2500, 2500, options.jpgQuality);
          await saveToOutputFolder(outputHandle, "jpg", `cleaned-${baseName}.jpg`, jpgBlob, options.overwriteExisting);
          out.outputNames.push(`cleaned-${baseName}.jpg`);
          out.exportedFormats.push("jpg");
          addLog({ level: "export", message: `${fileName}: JPG saved.`, fileName });
          break;
        }
        case "eps": {
          const epsSvg = prepareSvgForEpsExport(doc, {
            width: 2500,
            height: 2500,
            backgroundColor: "#FFFFFF",
            addPageBounds: true,
            removeEditorData: true,
          });
          const epsBlob = await callEpsApi(epsSvg, `cleaned-${baseName}.eps`);
          await saveToOutputFolder(outputHandle, "eps", `cleaned-${baseName}.eps`, epsBlob, options.overwriteExisting);
          out.outputNames.push(`cleaned-${baseName}.eps`);
          out.exportedFormats.push("eps");
          addLog({ level: "export", message: `${fileName}: EPS saved.`, fileName });
          break;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog({ level: "error", message: `${fileName}: ${format.toUpperCase()} export failed: ${msg}`, fileName });
    }
  }

  return out;
}

/** Serialize the current state of a reviewed document. */
export function serializeReviewDoc(doc: Document): string {
  return serializeSvg(doc);
}

async function convertSvgToPng(
  svgText: string,
  width: number,
  height: number,
  transparent: boolean,
  residual?: { cleanResidual: boolean; backgroundColor: string | null; tolerance: number },
): Promise<{ blob: Blob; removedPixels: number; haloPixels: number }> {
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    if (!transparent) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(img, 0, 0, width, height);

    let removedPixels = 0;
    let haloPixels = 0;
    if (residual?.cleanResidual && transparent) {
      try {
        const cleanup = cleanupPngWhiteResidual(canvas, {
          backgroundColor: residual.backgroundColor || "#FFFFFF",
          tolerance: residual.tolerance,
          haloRadius: 1,
        });
        removedPixels = cleanup.removedPixels;
        haloPixels = cleanup.haloPixelsSoftened;
      } catch {
        // Residual cleanup is best-effort; never fail the export because of it.
      }
    }

    return { blob: await canvasToBlob(canvas, "image/png"), removedPixels, haloPixels };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function convertSvgToJpg(
  svgText: string,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    return await canvasToBlob(canvas, "image/jpeg", quality);
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

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert canvas to blob."));
      },
      type,
      quality ?? 1.0,
    );
  });
}

async function callEpsApi(svgText: string, fileName: string): Promise<Blob> {
  const response = await fetch("/api/export-eps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ svgText, fileName }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "EPS export failed.");
  }

  return await response.blob();
}

async function saveToOutputFolder(
  outputHandle: any,
  format: string,
  fileName: string,
  blob: Blob,
  overwrite: boolean,
): Promise<void> {
  const dirHandle = await outputHandle.getDirectoryHandle(format, { create: true });

  let finalName = fileName;
  if (!overwrite) {
    let counter = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await dirHandle.getFileHandle(finalName);
        const baseName = fileName.replace(/\.[^.]+$/, "");
        const ext = fileName.match(/\.[^.]+$/)?.[0] || "";
        finalName = `${baseName}-${counter}${ext}`;
        counter++;
      } catch {
        break;
      }
    }
  }

  const fileHandle = await dirHandle.getFileHandle(finalName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}
