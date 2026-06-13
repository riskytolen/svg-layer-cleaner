import { CleanSvgResult } from "@/types/svg";
import { cleanSvgDocument } from "./cleanSvg";
import { serializeSvg } from "./serializeSvg";
import { parseSvg } from "./parseSvg";
import { DEFAULT_QUICK_CLEAN_OPTIONS } from "./cleanDefaults";

export type QuickCleanPipelineResult = {
  doc: Document;
  svgText: string;
  result: CleanSvgResult;
};

/**
 * Single source of truth for Quick Clean pipeline.
 * Used by both manual button and batch automation.
 *
 * Steps:
 * 1. Clean the document using default options
 * 2. Serialize to SVG text
 * 3. Re-parse into fresh Document (ensures clean DOM)
 */
export function quickCleanSvgWithDefaultOptions(
  doc: Document,
): QuickCleanPipelineResult {
  // Step 1: Run clean on existing document
  const result = cleanSvgDocument(doc, DEFAULT_QUICK_CLEAN_OPTIONS);

  // Step 2: Serialize
  const svgText = serializeSvg(doc);

  // Step 3: Re-parse into fresh Document
  const freshDoc = parseSvg(svgText);

  return {
    doc: freshDoc,
    svgText,
    result,
  };
}

/**
 * Debug function to compare manual vs batch quick clean output.
 * Returns true if outputs are identical.
 */
export function compareQuickCleanOutputs(svgText: string): boolean {
  // Process 1: manual path
  const docA = parseSvg(svgText);
  const resultA = quickCleanSvgWithDefaultOptions(docA);

  // Process 2: batch path (same function)
  const docB = parseSvg(svgText);
  const resultB = quickCleanSvgWithDefaultOptions(docB);

  const textA = resultA.svgText.replace(/\s+/g, " ").trim();
  const textB = resultB.svgText.replace(/\s+/g, " ").trim();

  if (textA !== textB) {
    console.warn("[QUICK CLEAN DEBUG] Manual and Batch Quick Clean output are different.");
    return false;
  }

  return true;
}

/**
 * Get top-level visual groups under root SVG.
 * Used for debug logging.
 */
export function getTopLevelVisualGroups(doc: Document): Element[] {
  const root = doc.documentElement;
  if (!root) return [];

  const groups: Element[] = [];
  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i];
    const tag = child.tagName.toLowerCase();
    if (tag === "g") {
      groups.push(child);
    }
  }
  return groups;
}
