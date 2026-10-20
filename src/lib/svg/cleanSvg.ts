import { CleanSvgOptions, CleanSvgResult } from "@/types/svg";

const EDITOR_ATTR_PREFIXES = [
  "sodipodi:", "inkscape:", "serif:", "sketch:", "adobe:",
];

const EDITOR_ATTR_NAMES = [
  "data-name", "data-original", "data-old-color",
];

const PROTECTED_ATTRS = new Set([
  "id", "class", "style", "fill", "stroke", "d", "transform",
  "viewBox", "width", "height", "data-layer-id", "data-locked",
]);

const STRUCTURAL_TAGS = new Set([
  "svg", "defs", "clippath", "mask", "lineargradient",
  "radialgradient", "pattern", "symbol", "image", "use",
]);

const VISUAL_TAGS = new Set([
  "path", "circle", "rect", "ellipse", "polygon", "polyline", "line", "text",
]);

function parseStyleValue(style: string | null, prop: string): string | null {
  if (!style) return null;
  const regex = new RegExp(`${prop}\\s*:\\s*([^;]+)`);
  const match = style.match(regex);
  return match ? match[1].trim() : null;
}

function isHidden(element: Element): boolean {
  const display = element.getAttribute("display");
  if (display === "none") return true;

  const visibility = element.getAttribute("visibility");
  if (visibility === "hidden") return true;

  const opacity = element.getAttribute("opacity");
  if (opacity === "0") return true;

  const style = element.getAttribute("style");
  if (style) {
    if (parseStyleValue(style, "display") === "none") return true;
    if (parseStyleValue(style, "visibility") === "hidden") return true;
    if (parseStyleValue(style, "opacity") === "0") return true;
  }

  return false;
}

function hasFillOrStroke(element: Element): boolean {
  const tag = element.tagName.toLowerCase();

  const fill = element.getAttribute("fill");
  const stroke = element.getAttribute("stroke");
  const style = element.getAttribute("style");

  const fillFromStyle = style ? parseStyleValue(style, "fill") : null;
  const strokeFromStyle = style ? parseStyleValue(style, "stroke") : null;

  const effectiveFill = fill || fillFromStyle;
  const effectiveStroke = stroke || strokeFromStyle;

  if (effectiveFill && effectiveFill !== "none") return true;
  if (effectiveStroke && effectiveStroke !== "none") return true;

  // text elements are visible even without fill/stroke (default black)
  if (tag === "text") return true;

  return false;
}

function isEmptyGroup(element: Element): boolean {
  if (element.tagName.toLowerCase() !== "g") return false;

  // Never remove artwork transform group
  if (element.getAttribute("data-system-layer") === "artwork-transform") return false;

  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];
    const tag = child.tagName.toLowerCase();

    // structural tags are not visual
    if (STRUCTURAL_TAGS.has(tag)) continue;

    // if there's any child with visual content, group is not empty
    if (VISUAL_TAGS.has(tag)) {
      // check if it's a valid visual element
      if (tag === "path") {
        const d = child.getAttribute("d");
        if (d && d.trim() !== "") return false;
        // invalid empty path still counts as "no visual content" here;
        // removeEmptyPaths/delete-empty-paths handles the node itself.
        continue;
      }
      return false;
    }

    // nested group
    if (tag === "g" && !isEmptyGroup(child)) return false;
  }

  return true;
}

function isEmptyDefs(element: Element): boolean {
  if (element.tagName.toLowerCase() !== "defs") return false;
  return element.children.length === 0;
}

export function removeComments(doc: Document): number {
  let count = 0;
  const walker = doc.createTreeWalker(
    doc,
    NodeFilter.SHOW_COMMENT,
    null,
  );

  const comments: Comment[] = [];
  let node: Comment | null;
  while ((node = walker.nextNode() as Comment | null)) {
    comments.push(node);
  }

  for (const comment of comments) {
    comment.parentNode?.removeChild(comment);
    count++;
  }

  return count;
}

export function removeMetadata(doc: Document): number {
  let count = 0;
  const metadataEls = doc.querySelectorAll("metadata");
  for (const el of Array.from(metadataEls)) {
    el.parentNode?.removeChild(el);
    count++;
  }
  return count;
}

export function removeHiddenElements(doc: Document): number {
  let count = 0;
  const allElements = doc.querySelectorAll("*");
  const toRemove: Element[] = [];

  for (const el of Array.from(allElements)) {
    const tag = el.tagName.toLowerCase();

    // don't remove structural tags
    if (STRUCTURAL_TAGS.has(tag)) continue;
    if (tag === "svg") continue;

    // never remove artwork transform group
    if (el.getAttribute("data-system-layer") === "artwork-transform") continue;

    if (isHidden(el)) {
      toRemove.push(el);
    }
  }

  for (const el of toRemove) {
    el.parentNode?.removeChild(el);
    count++;
  }

  return count;
}

export function removePathsWithoutD(doc: Document): number {
  let count = 0;
  const paths = doc.querySelectorAll("path");

  for (const path of Array.from(paths)) {
    if (!path.hasAttribute("d")) {
      path.parentNode?.removeChild(path);
      count++;
    }
  }

  return count;
}

export function removeEmptyPaths(doc: Document): number {
  let count = 0;
  const paths = doc.querySelectorAll("path");

  for (const path of Array.from(paths)) {
    const d = path.getAttribute("d");
    if (d !== null && d.trim() === "") {
      path.parentNode?.removeChild(path);
      count++;
    }
  }

  return count;
}

export function removeElementsWithoutFillAndStroke(doc: Document): number {
  let count = 0;
  const allElements = doc.querySelectorAll("*");
  const toRemove: Element[] = [];

  for (const el of Array.from(allElements)) {
    const tag = el.tagName.toLowerCase();

    if (!VISUAL_TAGS.has(tag)) continue;
    if (STRUCTURAL_TAGS.has(tag)) continue;
    if (tag === "svg") continue;

    // never remove artwork transform group
    if (el.getAttribute("data-system-layer") === "artwork-transform") continue;

    if (!hasFillOrStroke(el)) {
      toRemove.push(el);
    }
  }

  for (const el of toRemove) {
    el.parentNode?.removeChild(el);
    count++;
  }

  return count;
}

export function removeEmptyGroups(doc: Document): number {
  let totalRemoved = 0;
  let removed: number;

  // run multiple passes to handle nested empty groups
  do {
    removed = 0;
    const groups = doc.querySelectorAll("g");

    for (const group of Array.from(groups)) {
      // don't touch root
      if (group === doc.documentElement as Element) continue;

      if (isEmptyGroup(group)) {
        group.parentNode?.removeChild(group);
        removed++;
      }
    }
    totalRemoved += removed;
  } while (removed > 0);

  return totalRemoved;
}

export function removeEmptyDefs(doc: Document): number {
  let count = 0;
  const defsList = doc.querySelectorAll("defs");

  for (const defs of Array.from(defsList)) {
    if (isEmptyDefs(defs)) {
      defs.parentNode?.removeChild(defs);
      count++;
    }
  }

  return count;
}

export function removeEditorAttributes(doc: Document): number {
  let count = 0;
  const allElements = doc.querySelectorAll("*");

  for (const el of Array.from(allElements)) {
    const attrsToRemove: string[] = [];

    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];

      if (PROTECTED_ATTRS.has(attr.name)) continue;
      if (attr.name.startsWith("data-layer-id")) continue;
      if (attr.name.startsWith("data-locked")) continue;

      // check prefix-based editor attributes
      const isEditorAttr = EDITOR_ATTR_PREFIXES.some((prefix) =>
        attr.name.startsWith(prefix),
      );
      if (isEditorAttr) {
        attrsToRemove.push(attr.name);
        continue;
      }

      // check specific editor attribute names
      if (EDITOR_ATTR_NAMES.includes(attr.name)) {
        attrsToRemove.push(attr.name);
      }
    }

    for (const attrName of attrsToRemove) {
      el.removeAttribute(attrName);
      count++;
    }
  }

  return count;
}

export function optimizeSvgWhitespace(svgText: string): string {
  // remove comments that might have been left
  let result = svgText.replace(/<!--[\s\S]*?-->/g, "");

  // collapse multiple newlines
  result = result.replace(/\n\s*\n/g, "\n");

  // remove trailing whitespace on lines
  result = result.replace(/[ \t]+$/gm, "");

  // collapse multiple spaces (but not inside attributes)
  result = result.replace(/>\s+</g, "><");

  return result.trim();
}

export function cleanSvgDocument(
  doc: Document,
  options: CleanSvgOptions,
): CleanSvgResult {
  const serializer = new XMLSerializer();
  const beforeSize = new TextEncoder().encode(serializer.serializeToString(doc)).length;

  const result: CleanSvgResult = {
    removedEmptyPaths: 0,
    removedPathsWithoutD: 0,
    removedEmptyGroups: 0,
    removedComments: 0,
    removedMetadata: 0,
    removedHiddenElements: 0,
    removedElementsWithoutFillAndStroke: 0,
    removedEmptyDefs: 0,
    removedEditorAttributes: 0,
    beforeSize,
    afterSize: 0,
    reducedSize: 0,
    reducedPercentage: 0,
    totalRemoved: 0,
  };

  // 1. comments
  if (options.removeComments) {
    result.removedComments = removeComments(doc);
  }

  // 2. metadata
  if (options.removeMetadata) {
    result.removedMetadata = removeMetadata(doc);
  }

  // 3. hidden elements
  if (options.removeHiddenElements) {
    result.removedHiddenElements = removeHiddenElements(doc);
  }

  // 4. paths without d
  if (options.removePathsWithoutD) {
    result.removedPathsWithoutD = removePathsWithoutD(doc);
  }

  // 5. empty paths
  if (options.removeEmptyPaths) {
    result.removedEmptyPaths = removeEmptyPaths(doc);
  }

  // 6. elements without fill and stroke
  if (options.removeElementsWithoutFillAndStroke) {
    result.removedElementsWithoutFillAndStroke = removeElementsWithoutFillAndStroke(doc);
  }

  // 7. empty groups (must run after other removals)
  if (options.removeEmptyGroups) {
    result.removedEmptyGroups = removeEmptyGroups(doc);
  }

  // 8. empty defs
  if (options.removeEmptyDefs) {
    result.removedEmptyDefs = removeEmptyDefs(doc);
  }

  // 9. editor attributes
  if (options.removeEditorAttributes) {
    result.removedEditorAttributes = removeEditorAttributes(doc);
  }

  // 10. optimize whitespace
  let svgText = serializer.serializeToString(doc);
  if (options.optimizeWhitespace) {
    svgText = optimizeSvgWhitespace(svgText);
  }

  const afterSize = new TextEncoder().encode(svgText).length;
  result.afterSize = afterSize;
  result.reducedSize = beforeSize - afterSize;
  result.reducedPercentage = beforeSize > 0
    ? Math.round((result.reducedSize / beforeSize) * 10000) / 100
    : 0;

  result.totalRemoved =
    result.removedEmptyPaths +
    result.removedPathsWithoutD +
    result.removedEmptyGroups +
    result.removedComments +
    result.removedMetadata +
    result.removedHiddenElements +
    result.removedElementsWithoutFillAndStroke +
    result.removedEmptyDefs +
    result.removedEditorAttributes;

  return result;
}
