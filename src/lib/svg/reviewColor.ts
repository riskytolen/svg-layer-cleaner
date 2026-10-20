import { isExcludedElement } from "./resolveElementFill";
import { normalizeReviewColorInput, mergeInlineColor } from "./reviewColorCore";
import type { ReviewColorProperty } from "./reviewColorCore";

/**
 * Elements whose fill/stroke mapping is meaningful for manual recoloring.
 * Groups recolor by inheritance, text/image/basics cover the rest.
 */
const COLORABLE_TAGS = new Set([
  "path",
  "rect",
  "circle",
  "ellipse",
  "polygon",
  "polyline",
  "line",
  "text",
  "g",
]);

export type ApplyColorResult = {
  changed: number;
  skipped: number;
  changedIds: string[];
  skippedIds: string[];
};

function cssEscapeValue(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/"/g, '\\"');
}

/**
 * Apply one hex color as the fill/stroke of every given `data-layer-id`.
 *
 * Safety: skips the root svg, containers (defs, clipPath, mask, pattern,
 * gradients, symbol), elements flagged `data-system-layer` / `data-locked`,
 * and non-paintable tags. Nothing is deleted; only color declarations change.
 *
 * Color is written as BOTH a presentation attribute and an inline style
 * declaration, so CSS-class and parent-inherited colors are overridden.
 */
export function applyColorToLayers(
  doc: Document,
  layerIds: readonly string[],
  property: ReviewColorProperty,
  color: string,
): ApplyColorResult {
  const result: ApplyColorResult = {
    changed: 0,
    skipped: 0,
    changedIds: [],
    skippedIds: [],
  };

  const hex = normalizeReviewColorInput(color);
  if (!hex) {
    result.skippedIds = [...layerIds];
    result.skipped = layerIds.length;
    return result;
  }

  for (const id of layerIds) {
    let element: Element | null = null;
    try {
      element = doc.querySelector(`[data-layer-id="${cssEscapeValue(id)}"]`);
    } catch {
      element = null;
    }

    if (!element || element === doc.documentElement) {
      result.skipped++;
      result.skippedIds.push(id);
      continue;
    }

    const tag = element.tagName.toLowerCase();
    if (!COLORABLE_TAGS.has(tag) || isExcludedElement(element)) {
      result.skipped++;
      result.skippedIds.push(id);
      continue;
    }

    element.setAttribute(property, hex);
    element.setAttribute("style", mergeInlineColor(element.getAttribute("style"), property, hex));
    result.changed++;
    result.changedIds.push(id);
  }

  return result;
}
