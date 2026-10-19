import { BatchAutomationOptions, BatchLogEntry } from "./batchTypes";
import { parseSvg } from "@/lib/svg/parseSvg";
import { serializeSvg } from "@/lib/svg/serializeSvg";
import { assignElementIds } from "@/lib/svg/assignElementIds";
import { normalizeSvgToSize } from "@/lib/svg/normalizeSvgSize";
import { quickCleanSvgWithDefaultOptions, getTopLevelVisualGroups } from "@/lib/svg/quickCleanPipeline";
import { removeWhiteBackground } from "@/lib/svg/removeWhiteBackground";

export type PrepareReviewResult = {
  ok: boolean;
  doc?: Document;
  svgText?: string;
  fileName: string;
  inputPath: string;
  beforeSize: number;
  afterSize?: number;
  bgColor?: string | null;
  matchedCount: number;
  autoDeletedCount: number;
  ambiguousCount: number;
  preservedNearWhite: number;
  removedColors: Record<string, number>;
  error?: string | null;
  warning?: string | null;
};

/**
 * Stage 1 of the batch pipeline, shared by direct export and manual review:
 * parse → quick clean → auto white-background removal → normalize 2500.
 * No file is written here.
 */
export async function prepareSingleSvgForReview(
  file: File,
  path: string,
  options: BatchAutomationOptions,
  addLog: (entry: Omit<BatchLogEntry, "timestamp">) => void,
): Promise<PrepareReviewResult> {
  const fileName = file.name;
  const base: PrepareReviewResult = {
    ok: false,
    fileName,
    inputPath: path,
    beforeSize: 0,
    matchedCount: 0,
    autoDeletedCount: 0,
    ambiguousCount: 0,
    preservedNearWhite: 0,
    removedColors: {},
  };

  addLog({ level: "process", message: `Processing: ${fileName}`, fileName });

  const svgText = await file.text();
  base.beforeSize = svgText.length;

  if (!svgText.includes("<svg") || !svgText.includes("</svg>")) {
    base.error = "Invalid SVG file.";
    addLog({ level: "error", message: `${fileName}: Invalid SVG file.`, fileName });
    return base;
  }

  let doc = parseSvg(svgText);
  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg") {
    base.error = "No root <svg> element found.";
    addLog({ level: "error", message: `${fileName}: No root <svg> element.`, fileName });
    return base;
  }

  assignElementIds(doc);

  if (options.quickClean) {
    const cleaned = quickCleanSvgWithDefaultOptions(doc);
    doc = cleaned.doc;
    addLog({ level: "info", message: `${fileName}: [QUICK CLEAN] using manual default quick clean`, fileName });
    addLog({ level: "info", message: `${fileName}: [QUICK CLEAN] removed empty paths: ${cleaned.result.removedEmptyPaths + cleaned.result.removedPathsWithoutD}`, fileName });
    addLog({ level: "info", message: `${fileName}: [QUICK CLEAN] removed empty groups: ${cleaned.result.removedEmptyGroups}`, fileName });
    addLog({ level: "info", message: `${fileName}: [QUICK CLEAN] result serialized`, fileName });
  }

  const cleanedSvgText = serializeSvg(doc);
  doc = parseSvg(cleanedSvgText);
  addLog({ level: "info", message: `${fileName}: [REPARSE] cleaned document parsed again`, fileName });

  assignElementIds(doc);

  const allPaths = doc.querySelectorAll("path");
  const topLevelGroups = getTopLevelVisualGroups(doc);
  addLog({ level: "info", message: `${fileName}: [LAYER] root groups after quick clean: ${topLevelGroups.length}`, fileName });
  addLog({ level: "info", message: `${fileName}: [DEBUG] Total paths after quick clean: ${allPaths.length}`, fileName });

  if (topLevelGroups.length > 1) {
    addLog({ level: "warning", message: `${fileName}: [WARNING] Multiple top-level groups detected after quick clean.`, fileName });
  }

  // Context-aware white background removal (BEFORE normalize so that
  // edge-touch heuristics run against the original viewBox).
  const shouldRemoveBg = options.removeWhiteBackground || options.removeSameFillAsFirstPath;
  if (shouldRemoveBg) {
    const bgResult = removeWhiteBackground(doc, {
      mode: options.backgroundMode ?? "balanced",
      whiteSensitivity: options.whiteTolerance,
      colorTolerance: options.backgroundColorTolerance,
      onlyDeleteIfWhiteLike: options.onlyDeleteIfWhiteLike,
    });

    if (bgResult.skipped) {
      base.warning = bgResult.warning;
      addLog({ level: "warning", message: `${fileName}: [BG] ${bgResult.warning}`, fileName });
    } else {
      base.bgColor = bgResult.normalizedFill;
      base.matchedCount = bgResult.matchedCount;
      base.autoDeletedCount = bgResult.deletedCount;
      base.ambiguousCount = bgResult.ambiguousCount;
      base.preservedNearWhite = bgResult.preservedNearWhite;
      base.removedColors = bgResult.removedColors;

      addLog({ level: "color", message: `${fileName}: [BG] Main background: ${bgResult.normalizedFill} (score ${Math.round(bgResult.mainScore)})`, fileName });
      const removedSummary = Object.entries(bgResult.removedColors)
        .map(([c, n]) => `${c} x${n}`)
        .join(", ");
      addLog({ level: "delete", message: `${fileName}: [BG] Removed vector background: ${bgResult.deletedCount} elements${removedSummary ? ` (${removedSummary})` : ""}.`, fileName });
      if (bgResult.ambiguousCount > 0) {
        addLog({ level: "warning", message: `${fileName}: [BG] Ambiguous near-white elements preserved: ${bgResult.ambiguousCount}.`, fileName });
        if (!base.warning) {
          base.warning = `${bgResult.ambiguousCount} ambiguous near-white elements preserved.`;
        }
      }
      if (bgResult.preservedNearWhite > 0) {
        addLog({ level: "info", message: `${fileName}: [BG] Preserved near-white foreground: ${bgResult.preservedNearWhite} elements.`, fileName });
      }
    }
  }

  if (options.autoResize2500) {
    normalizeSvgToSize(doc, {
      targetWidth: 2500,
      targetHeight: 2500,
      mode: "contain",
    });
    addLog({ level: "info", message: `${fileName}: Normalized to 2500x2500.`, fileName });
  }

  const finalSvgText = serializeSvg(doc);
  base.ok = true;
  base.doc = doc;
  base.svgText = finalSvgText;
  base.afterSize = finalSvgText.length;
  return base;
}
