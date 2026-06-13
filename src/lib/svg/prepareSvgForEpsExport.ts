const TEMP_ATTRS = [
  "data-selected",
  "data-hovered",
  "data-active",
  "data-ui-highlight",
  "data-preview-only",
];

const EDITOR_DATA_ATTRS = [
  "data-layer-id",
  "data-original-id",
  "data-editor-id",
];

const SYSTEM_ATTRS = [
  "data-deletable",
];

const PAGE_BOUNDS_ID = "__eps_page_bounds__";

function removeAttributes(el: Element, attrs: string[]) {
  for (const attr of attrs) {
    el.removeAttribute(attr);
  }
}

function removeTempStyles(el: Element) {
  const style = el.getAttribute("style");
  if (!style) return;
  const cleaned = style
    .replace(/outline\s*:[^;]+;?/gi, "")
    .replace(/box-shadow\s*:[^;]+;?/gi, "")
    .replace(/filter\s*:[^;]+;?/gi, "")
    .trim();
  if (cleaned) {
    el.setAttribute("style", cleaned);
  } else {
    el.removeAttribute("style");
  }
}

function removeTempClasses(el: Element) {
  const cls = el.getAttribute("class");
  if (!cls) return;
  const cleaned = cls
    .split(/\s+/)
    .filter(
      (c) =>
        c &&
        !c.startsWith("svg-layer-") &&
        !c.startsWith("editor-") &&
        c !== "selected" &&
        c !== "hovered",
    )
    .join(" ");
  if (cleaned) {
    el.setAttribute("class", cleaned);
  } else {
    el.removeAttribute("class");
  }
}

export function prepareSvgForEpsExport(
  doc: Document,
  options?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    addPageBounds?: boolean;
    removeEditorData?: boolean;
  },
): string {
  const width = options?.width ?? 2500;
  const height = options?.height ?? 2500;
  const backgroundColor = options?.backgroundColor ?? "#FFFFFF";
  const addPageBounds = options?.addPageBounds ?? false;
  const removeEditorData = options?.removeEditorData ?? true;

  const clone = doc.cloneNode(true) as Document;
  const root = clone.documentElement;

  // Set root SVG dimensions with pt units for EPS
  root.setAttribute("width", `${width}pt`);
  root.setAttribute("height", `${height}pt`);
  root.setAttribute("viewBox", `0 0 ${width} ${height}`);

  if (!root.hasAttribute("xmlns")) {
    root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  // Process all elements - clean temp attributes
  const allElements = clone.querySelectorAll("*");
  for (const el of Array.from(allElements)) {
    removeAttributes(el, TEMP_ATTRS);
    removeAttributes(el, SYSTEM_ATTRS);
    removeTempStyles(el);
    removeTempClasses(el);
    if (removeEditorData) {
      removeAttributes(el, EDITOR_DATA_ATTRS);
    }
  }

  // Remove old page bounds rect if exists
  const existingBounds = clone.getElementById(PAGE_BOUNDS_ID);
  if (existingBounds) {
    existingBounds.parentNode?.removeChild(existingBounds);
  }

  // Add page bounds rectangle to force EPS BoundingBox to full canvas
  if (addPageBounds) {
    const rect = clone.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("id", PAGE_BOUNDS_ID);
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", String(width));
    rect.setAttribute("height", String(height));
    rect.setAttribute("fill", backgroundColor);
    rect.setAttribute("stroke", "none");

    // Insert after defs/style/title/desc/metadata
    let insertBefore: Element | null = null;
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      const tag = child.tagName.toLowerCase();
      if (tag === "defs" || tag === "style" || tag === "title" || tag === "desc" || tag === "metadata") {
        continue;
      }
      insertBefore = child;
      break;
    }

    if (insertBefore) {
      root.insertBefore(rect, insertBefore);
    } else {
      root.appendChild(rect);
    }
  }

  // Serialize
  const serializer = new XMLSerializer();
  let svgText = serializer.serializeToString(root);

  if (!svgText.startsWith("<?xml")) {
    svgText = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgText;
  }

  return svgText;
}
