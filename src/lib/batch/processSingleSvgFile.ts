import { BatchAutomationOptions, BatchFileResult, BatchLogEntry } from "./batchTypes";
import { serializeSvg } from "@/lib/svg/serializeSvg";
import { prepareSingleSvgForReview } from "./prepareSingleSvgForReview";
import { exportDocToOutputFormats } from "./exportReviewedSvgFile";

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
    bgRemoved: 0,
    ambiguousCount: 0,
    preservedNearWhite: 0,
    removedColors: {},
    residualPixelsRemoved: 0,
    haloPixelsSoftened: 0,
    exportedFormats: [],
    startedAt: Date.now(),
  };

  try {
    // Stage 1: parse → quick clean → auto BG removal → normalize (shared with review mode).
    const prepared = await prepareSingleSvgForReview(file, path, options, addLog);
    result.beforeSize = prepared.beforeSize;

    if (!prepared.ok || !prepared.doc) {
      result.status = "failed";
      result.error = prepared.error || "Failed to prepare SVG.";
      return result;
    }

    result.path1Fill = prepared.bgColor;
    result.normalizedFill = prepared.bgColor;
    result.bgColor = prepared.bgColor;
    result.matchedCount = prepared.matchedCount;
    result.deletedCount = prepared.autoDeletedCount;
    result.bgRemoved = prepared.autoDeletedCount;
    result.ambiguousCount = prepared.ambiguousCount;
    result.preservedNearWhite = prepared.preservedNearWhite;
    result.removedColors = prepared.removedColors;
    if (prepared.warning) result.warning = prepared.warning;
    result.afterSize = prepared.afterSize;

    // Dry run: skip export
    if (options.dryRun) {
      result.status = "success";
      result.exportedFormats = [];
      addLog({ level: "success", message: `${fileName}: Dry run complete.`, fileName });
      return result;
    }

    // Stage 2: export to selected formats (shared with review mode).
    const baseName = fileName.replace(/\.svg$/i, "");
    const exported = await exportDocToOutputFormats(
      prepared.doc,
      baseName,
      options.outputFolderHandle!,
      options,
      addLog,
      prepared.bgColor,
      fileName,
    );

    result.outputNames = exported.outputNames;
    result.exportedFormats = exported.exportedFormats;
    result.residualPixelsRemoved = exported.residualPixelsRemoved;
    result.haloPixelsSoftened = exported.haloPixelsSoftened;
    // Refresh serialized size from the final doc state.
    try {
      result.afterSize = serializeSvg(prepared.doc).length;
    } catch {
      // Keep earlier afterSize on unexpected serialize failure.
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
