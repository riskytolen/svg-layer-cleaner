import { normalizeColor } from "@/lib/utils/colorUtils";

const EXCLUDED_TAGS = new Set([
  "svg", "defs", "clippath", "mask", "lineargradient", "radialgradient", "pattern", "symbol",
]);

function getElementColor(element: Element, mode: "fill" | "stroke"): string | null {
  const attr = element.getAttribute(mode);
  if (attr) {
    const norm = normalizeColor(attr);
    if (norm) return norm;
  }

  const style = element.getAttribute("style");
  if (style) {
    const regex = new RegExp(`${mode}\\s*:\\s*([^;]+)`);
    const match = style.match(regex);
    if (match) {
      const norm = normalizeColor(match[1].trim());
      if (norm) return norm;
    }
  }

  return null;
}

function isExcludedElement(element: Element): boolean {
  const tag = element.tagName.toLowerCase();
  if (EXCLUDED_TAGS.has(tag)) return true;
  if (element.getAttribute("data-system-layer") === "white-background") return true;
  if (element.getAttribute("data-deletable") === "false") return true;
  const display = element.getAttribute("display");
  if (display === "none") return true;
  return false;
}

function collectAllElements(doc: Document): Element[] {
  const allElements = doc.querySelectorAll("[data-layer-id]");
  return Array.from(allElements).filter((el) => {
    if (isExcludedElement(el)) return false;
    if (el === doc.documentElement) return false;
    return true;
  });
}

export function findElementsBySameFillColor(
  doc: Document,
  sourceLayerId: string,
): string[] {
  const sourceEl = doc.querySelector(`[data-layer-id="${sourceLayerId}"]`);
  if (!sourceEl) return [];

  const sourceColor = getElementColor(sourceEl, "fill");
  if (!sourceColor) return [];

  const ids: string[] = [];
  const allElements = collectAllElements(doc);

  for (const el of allElements) {
    const elColor = getElementColor(el, "fill");
    if (elColor === sourceColor) {
      ids.push(el.getAttribute("data-layer-id") || "");
    }
  }

  return ids.filter(Boolean);
}

export function findElementsBySameStrokeColor(
  doc: Document,
  sourceLayerId: string,
): string[] {
  const sourceEl = doc.querySelector(`[data-layer-id="${sourceLayerId}"]`);
  if (!sourceEl) return [];

  const sourceColor = getElementColor(sourceEl, "stroke");
  if (!sourceColor) return [];

  const ids: string[] = [];
  const allElements = collectAllElements(doc);

  for (const el of allElements) {
    const elColor = getElementColor(el, "stroke");
    if (elColor === sourceColor) {
      ids.push(el.getAttribute("data-layer-id") || "");
    }
  }

  return ids.filter(Boolean);
}

export function findElementsBySameFillAndStrokeColor(
  doc: Document,
  sourceLayerId: string,
): string[] {
  const sourceEl = doc.querySelector(`[data-layer-id="${sourceLayerId}"]`);
  if (!sourceEl) return [];

  const sourceFill = getElementColor(sourceEl, "fill");
  const sourceStroke = getElementColor(sourceEl, "stroke");

  if (!sourceFill && !sourceStroke) return [];

  const ids: string[] = [];
  const allElements = collectAllElements(doc);

  for (const el of allElements) {
    const elFill = getElementColor(el, "fill");
    const elStroke = getElementColor(el, "stroke");

    if (elFill === sourceFill && elStroke === sourceStroke) {
      ids.push(el.getAttribute("data-layer-id") || "");
    }
  }

  return ids.filter(Boolean);
}

export type SelectByColorOptions = {
  fill?: string | null;
  stroke?: string | null;
  mode: "fill" | "stroke" | "fill-and-stroke";
};

export function findElementsByColor(
  doc: Document,
  options: SelectByColorOptions,
): string[] {
  const { mode } = options;
  const ids: string[] = [];
  const allElements = collectAllElements(doc);

  for (const el of allElements) {
    if (mode === "fill") {
      const normalizedFill = normalizeColor(options.fill);
      if (!normalizedFill) continue;
      const elFill = getElementColor(el, "fill");
      if (elFill === normalizedFill) {
        ids.push(el.getAttribute("data-layer-id") || "");
      }
    } else if (mode === "stroke") {
      const normalizedStroke = normalizeColor(options.stroke);
      if (!normalizedStroke) continue;
      const elStroke = getElementColor(el, "stroke");
      if (elStroke === normalizedStroke) {
        ids.push(el.getAttribute("data-layer-id") || "");
      }
    } else if (mode === "fill-and-stroke") {
      const normalizedFill = normalizeColor(options.fill);
      const normalizedStroke = normalizeColor(options.stroke);
      const elFill = getElementColor(el, "fill");
      const elStroke = getElementColor(el, "stroke");
      if (elFill === normalizedFill && elStroke === normalizedStroke) {
        ids.push(el.getAttribute("data-layer-id") || "");
      }
    }
  }

  return ids.filter(Boolean);
}
