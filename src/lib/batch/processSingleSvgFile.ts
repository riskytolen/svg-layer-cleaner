import { BatchAutomationOptions, BatchFileResult, BatchLogEntry } from "./batchTypes";
import { parseSvg } from "@/lib/svg/parseSvg";
import { serializeSvg } from "@/lib/svg/serializeSvg";
import { assignElementIds } from "@/lib/svg/assignElementIds";
import { normalizeSvgToSize } from "@/lib/svg/normalizeSvgSize";
import { quickCleanSvgWithDefaultOptions, getTopLevelVisualGroups } from "@/lib/svg/quickCleanPipeline";
import { removeSameFillAsFirstPath } from "@/lib/svg/removeSameFillAsFirstPath";
import { prepareSvgForExport } from "@/lib/svg/prepareSvgForExport";
import { prepareSvgForEpsExport } from "@/lib/svg/prepareSvgForEpsExport";

export async function processSingleSvgFile(
  file: File,
  path: string,
  options: BatchAutomationOptions,
  addLog: (entry: Omit<BatchLogEntry, "timestamp">) => void,
): Promise<BatchFileResult> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileName = file.name;

  const result: BatchFileResult = {
    id,
    fileName,
    inputPath: path,
    outputNames: [],
    status: "processing",
    matchedCount: 0,
    deletedCount: 0,
    exportedFormats: [],
    startedAt: Date.now(),
  };

  try {
    addLog({ level: "process", message: `Processing: ${fileName}`, fileName });

    // Step 1: Read file
    const svgText = await file.text();
    result.beforeSize = svgText.length;

    if (!svgText.includes("<svg") || !svgText.includes("</svg>")) {
      result.status = "failed";
      result.error = "Invalid SVG file.";
      addLog({ level: "error", message: `${fileName}: Invalid SVG file.`, fileName });
      return result;
    }

    // Step 2: Parse SVG
    let doc = parseSvg(svgText);
    const root = doc.documentElement;
    if (!root || root.tagName.toLowerCase() !== "svg") {
      result.status = "failed";
      result.error = "No root <svg> element found.";
      addLog({ level: "error", message: `${fileName}: No root <svg> element.`, fileName });
      return result;
    }

    // Step 3: Normalize to 2500x2500
    if (options.autoResize2500) {
      normalizeSvgToSize(doc, {
        targetWidth: 2500,
        targetHeight: 2500,
        mode: "contain",
      });
      addLog({ level: "info", message: `${fileName}: Normalized to 2500x2500.`, fileName });
    }

    // Step 4: Assign IDs before quick clean
    assignElementIds(doc);

    // Step 5: Quick Clean using the SAME function as manual button
    if (options.quickClean) {
      const cleaned = quickCleanSvgWithDefaultOptions(doc);
      doc = cleaned.doc;
      addLog({ level: "info", message: `${fileName}: [QUICK CLEAN] using manual default quick clean`, fileName });
      addLog({ level: "info", message: `${fileName}: [QUICK CLEAN] removed empty paths: ${cleaned.result.removedEmptyPaths + cleaned.result.removedPathsWithoutD}`, fileName });
      addLog({ level: "info", message: `${fileName}: [QUICK CLEAN] removed empty groups: ${cleaned.result.removedEmptyGroups}`, fileName });
      addLog({ level: "info", message: `${fileName}: [QUICK CLEAN] result serialized`, fileName });
    }

    // Step 6: Re-parse after Quick Clean for fresh DOM
    const cleanedSvgText = serializeSvg(doc);
    doc = parseSvg(cleanedSvgText);
    addLog({ level: "info", message: `${fileName}: [REPARSE] cleaned document parsed again`, fileName });

    // Step 7: Re-assign IDs on clean DOM
    assignElementIds(doc);

    // Step 8: Debug - count paths and top-level groups
    const allPaths = doc.querySelectorAll("path");
    const topLevelGroups = getTopLevelVisualGroups(doc);
    addLog({ level: "info", message: `${fileName}: [LAYER] root groups after quick clean: ${topLevelGroups.length}`, fileName });
    addLog({ level: "info", message: `${fileName}: [DEBUG] Total paths after quick clean: ${allPaths.length}`, fileName });

    if (topLevelGroups.length > 1) {
      addLog({ level: "warning", message: `${fileName}: [WARNING] Multiple top-level groups detected after quick clean.`, fileName });
    }

    // Step 9: Remove same fill as first path
    if (options.removeSameFillAsFirstPath) {
      const removeResult = removeSameFillAsFirstPath(doc, {
        scope: options.firstPathScope,
        onlyDeleteIfWhiteLike: options.onlyDeleteIfWhiteLike,
        whiteTolerance: options.whiteTolerance,
      });

      if (removeResult.skipped) {
        result.warning = removeResult.warning;
        result.status = "skipped";
        addLog({ level: "warning", message: `${fileName}: ${removeResult.warning}`, fileName });
        return result;
      }

      result.path1Fill = removeResult.path1Fill;
      result.normalizedFill = removeResult.normalizedFill;
      result.matchedCount = removeResult.matchedCount;
      result.deletedCount = removeResult.deletedCount;

      addLog({ level: "color", message: `${fileName}: [COLOR] Path 1 fill: ${removeResult.normalizedFill}`, fileName });
      addLog({ level: "delete", message: `${fileName}: [DELETE] ${removeResult.deletedCount} elements deleted.`, fileName });
    }

    // Step 10: Serialize final SVG
    const finalSvgText = serializeSvg(doc);
    result.afterSize = finalSvgText.length;

    // Dry run: skip export
    if (options.dryRun) {
      result.status = "success";
      result.exportedFormats = [];
      addLog({ level: "success", message: `${fileName}: Dry run complete.`, fileName });
      return result;
    }

    // Step 11: Export to selected formats
    const baseName = fileName.replace(/\.svg$/i, "");

    for (const format of options.exportFormats) {
      try {
        switch (format) {
          case "svg": {
            const svgOutput = prepareSvgForExport(doc, {
              removeEditorData: false,
              keepLayerIds: false,
            });
            const blob = new Blob([svgOutput], { type: "image/svg+xml;charset=utf-8" });
            await saveToOutputFolder(options.outputFolderHandle!, "svg", `cleaned-${baseName}.svg`, blob, options.overwriteExisting);
            result.outputNames.push(`cleaned-${baseName}.svg`);
            result.exportedFormats.push("svg");
            addLog({ level: "export", message: `${fileName}: SVG saved.`, fileName });
            break;
          }
          case "png": {
            const svgForPng = prepareSvgForExport(doc, {
              removeEditorData: false,
              keepLayerIds: false,
            });
            const pngBlob = await convertSvgToPng(svgForPng, 2500, 2500, options.pngTransparent);
            await saveToOutputFolder(options.outputFolderHandle!, "png", `cleaned-${baseName}.png`, pngBlob, options.overwriteExisting);
            result.outputNames.push(`cleaned-${baseName}.png`);
            result.exportedFormats.push("png");
            addLog({ level: "export", message: `${fileName}: PNG saved.`, fileName });
            break;
          }
          case "jpg": {
            const svgForJpg = prepareSvgForExport(doc, {
              removeEditorData: false,
              keepLayerIds: false,
            });
            const jpgBlob = await convertSvgToJpg(svgForJpg, 2500, 2500, options.jpgQuality);
            await saveToOutputFolder(options.outputFolderHandle!, "jpg", `cleaned-${baseName}.jpg`, jpgBlob, options.overwriteExisting);
            result.outputNames.push(`cleaned-${baseName}.jpg`);
            result.exportedFormats.push("jpg");
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
            await saveToOutputFolder(options.outputFolderHandle!, "eps", `cleaned-${baseName}.eps`, epsBlob, options.overwriteExisting);
            result.outputNames.push(`cleaned-${baseName}.eps`);
            result.exportedFormats.push("eps");
            addLog({ level: "export", message: `${fileName}: EPS saved.`, fileName });
            break;
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog({ level: "error", message: `${fileName}: ${format.toUpperCase()} export failed: ${msg}`, fileName });
      }
    }

    result.status = "success";
    addLog({ level: "success", message: `${fileName} completed.`, fileName });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    result.status = "failed";
    result.error = msg;
    addLog({ level: "error", message: `${fileName} failed: ${msg}`, fileName });
  } finally {
    result.finishedAt = Date.now();
  }

  return result;
}

async function convertSvgToPng(
  svgText: string,
  width: number,
  height: number,
  transparent: boolean,
): Promise<Blob> {
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

    return await canvasToBlob(canvas, "image/png");
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
  // Ensure subfolder exists
  const dirHandle = await outputHandle.getDirectoryHandle(format, { create: true });

  // Check if file exists
  let finalName = fileName;
  if (!overwrite) {
    let counter = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await dirHandle.getFileHandle(finalName);
        // File exists, increment counter
        const baseName = fileName.replace(/\.[^.]+$/, "");
        const ext = fileName.match(/\.[^.]+$/)?.[0] || "";
        finalName = `${baseName}-${counter}${ext}`;
        counter++;
      } catch {
        // File doesn't exist, use this name
        break;
      }
    }
  }

  const fileHandle = await dirHandle.getFileHandle(finalName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}
