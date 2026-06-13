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
  "data-system-layer",
  "data-deletable",
];

function removeAttributes(el: Element, attrs: string[]) {
  for (const attr of attrs) {
    el.removeAttribute(attr);
  }
}

function removeTempStyles(el: Element) {
  const style = el.getAttribute("style");
  if (!style) return;

  // Remove outline and selection-related inline styles
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

export function prepareSvgForExport(
  doc: Document,
  options?: {
    removeEditorData?: boolean;
    removeSelectionData?: boolean;
    keepLayerIds?: boolean;
    removeBackground?: boolean;
  },
): string {
  const clone = doc.cloneNode(true) as Document;
  const root = clone.documentElement;

  // Ensure root SVG dimensions
  root.setAttribute("width", "2500");
  root.setAttribute("height", "2500");
  root.setAttribute("viewBox", "0 0 2500 2500");

  if (!root.hasAttribute("xmlns")) {
    root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  // Remove white background if requested (for transparent export)
  if (options?.removeBackground) {
    const bg = clone.querySelector('[data-system-layer="white-background"]');
    if (bg) bg.parentNode?.removeChild(bg);
  }

  // Process all elements
  const allElements = clone.querySelectorAll("*");
  for (const el of Array.from(allElements)) {
    // Always remove temp UI attributes
    removeAttributes(el, TEMP_ATTRS);

    // Remove temp styles and classes
    removeTempStyles(el);
    removeTempClasses(el);

    // Optionally remove editor data attributes
    if (options?.removeEditorData && !options?.keepLayerIds) {
      removeAttributes(el, EDITOR_DATA_ATTRS);
    }

    // Remove system marker attributes from final output
    removeAttributes(el, SYSTEM_ATTRS);
  }

  // Serialize
  const serializer = new XMLSerializer();
  let svgText = serializer.serializeToString(root);

  // Ensure proper XML declaration
  if (!svgText.startsWith("<?xml")) {
    svgText = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgText;
  }

  return svgText;
}
