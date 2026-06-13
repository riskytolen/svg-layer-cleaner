import { normalizeColor } from "@/lib/utils/colorUtils";

const EXCLUDED_CONTAINER_TAGS = new Set(["defs", "clippath", "mask", "pattern", "lineargradient", "radialgradient", "symbol", "svg"]);

export function extractCssFillRules(doc: Document): Record<string, string> {
  const rules: Record<string, string> = {};
  const styleTags = doc.querySelectorAll("style");

  for (const styleTag of Array.from(styleTags)) {
    const text = styleTag.textContent || "";
    // Match: .cls-1 { fill: #FFFFFF; } or .cls-1{fill:#000}
    const ruleRegex = /\.([a-zA-Z_][\w-]*)\s*\{[^}]*fill\s*:\s*([^;}{]+)/g;
    let match;
    while ((match = ruleRegex.exec(text)) !== null) {
      const className = match[1];
      const fillValue = match[2].trim();
      if (!rules[className]) {
        rules[className] = fillValue;
      }
    }
  }

  return rules;
}

function getInlineStyleFill(element: Element): string | null {
  const style = element.getAttribute("style");
  if (!style) return null;

  const match = style.match(/fill\s*:\s*([^;]+)/i);
  if (match) {
    return match[1].trim();
  }
  return null;
}

function getAttributeFill(element: Element): string | null {
  const fill = element.getAttribute("fill");
  if (fill) return fill;
  return null;
}

function getClassFill(element: Element, cssRules: Record<string, string>): string | null {
  const classAttr = element.getAttribute("class");
  if (!classAttr) return null;

  const classes = classAttr.split(/\s+/).filter(Boolean);
  for (const cls of classes) {
    if (cssRules[cls]) {
      return cssRules[cls];
    }
  }
  return null;
}

function getParentFill(element: Element): string | null {
  let current = element.parentElement;
  while (current && current !== element.ownerDocument.documentElement) {
    const tag = current.tagName.toLowerCase();
    if (EXCLUDED_CONTAINER_TAGS.has(tag)) break;

    // Check inline style first (highest priority after element's own)
    const inlineFill = getInlineStyleFill(current);
    if (inlineFill && normalizeColor(inlineFill)) {
      return inlineFill;
    }

    // Check attribute fill
    const attrFill = getAttributeFill(current);
    if (attrFill && normalizeColor(attrFill)) {
      return attrFill;
    }

    current = current.parentElement;
  }
  return null;
}

export function resolveElementFill(
  element: Element,
  cssRules: Record<string, string>,
): string | null {
  // 1. Direct attribute fill
  const attrFill = getAttributeFill(element);
  if (attrFill) {
    const normalized = normalizeColor(attrFill);
    if (normalized) return normalized;
    // fill="none" or invalid -> skip
    if (attrFill.toLowerCase() === "none") return null;
  }

  // 2. Inline style fill
  const inlineFill = getInlineStyleFill(element);
  if (inlineFill) {
    const normalized = normalizeColor(inlineFill);
    if (normalized) return normalized;
    if (inlineFill.toLowerCase() === "none") return null;
  }

  // 3. CSS class fill
  const classFill = getClassFill(element, cssRules);
  if (classFill) {
    const normalized = normalizeColor(classFill);
    if (normalized) return normalized;
  }

  // 4. Parent group fill (walk up)
  const parentFill = getParentFill(element);
  if (parentFill) {
    const normalized = normalizeColor(parentFill);
    if (normalized) return normalized;
  }

  return null;
}

export function isElementVisible(element: Element): boolean {
  const display = element.getAttribute("display");
  if (display === "none") return false;

  const visibility = element.getAttribute("visibility");
  if (visibility === "hidden") return false;

  const opacity = element.getAttribute("opacity");
  if (opacity === "0") return false;

  return true;
}

export function isExcludedElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (EXCLUDED_CONTAINER_TAGS.has(tag)) return true;
  if (el.closest("defs")) return true;
  if (el.closest("clippath")) return true;
  if (el.closest("mask")) return true;
  if (el.getAttribute("data-system-layer")) return true;
  if (el.getAttribute("data-locked") === "true") return true;
  return false;
}

export function debugFirstPaths(doc: Document, limit: number = 10): void {
  const cssRules = extractCssFillRules(doc);
  const paths = doc.querySelectorAll("path");
  const results: any[] = [];

  for (let i = 0; i < Math.min(paths.length, limit); i++) {
    const path = paths[i];
    const classAttr = path.getAttribute("class") || "";
    const classes = classAttr.split(/\s+/).filter(Boolean);

    let classFill: string | null = null;
    for (const cls of classes) {
      if (cssRules[cls]) {
        classFill = cssRules[cls];
        break;
      }
    }

    let parentFill: string | null = null;
    let current = path.parentElement;
    while (current && current !== doc.documentElement) {
      const pFill = current.getAttribute("fill");
      if (pFill && normalizeColor(pFill)) {
        parentFill = pFill;
        break;
      }
      current = current.parentElement;
    }

    results.push({
      index: i + 1,
      tag: path.tagName.toLowerCase(),
      rawFill: path.getAttribute("fill"),
      inlineStyleFill: getInlineStyleFill(path),
      className: classAttr,
      classFill,
      parentFill,
      resolvedFill: resolveElementFill(path, cssRules),
    });
  }

  console.table(results);
}
