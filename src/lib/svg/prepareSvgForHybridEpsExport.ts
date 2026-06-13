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

const SYSTEM_CLIP_ID_MARKERS = [
  "__eps_clip",
  "__page_clip",
  "__export_clip",
  "__canvas_clip",
];

function removeAttributes(el: Element, attrs: string[]) {
  for (const attr of attrs) {
    el.removeAttribute(attr);
  }
}

function isSystemClipPath(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag !== "clippath" && tag !== "mask") return false;

  const id = (el.getAttribute("id") || "").toLowerCase();
  if (SYSTEM_CLIP_ID_MARKERS.some((m) => id.includes(m))) return true;

  if (el.getAttribute("data-system-layer") === "eps-clip") return true;
  if (el.getAttribute("data-export-helper") === "true") return true;
  if (el.getAttribute("data-generated-by") === "eps-export") return true;

  return false;
}

export function prepareSvgForHybridEpsExport(
  doc: Document,
  options?: {
    width?: number;
    height?: number;
    removeEditorData?: boolean;
  },
): string {
  const width = options?.width ?? 2500;
  const height = options?.height ?? 2500;
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

  // Process all elements
  const allElements = Array.from(clone.querySelectorAll("*"));

  // First pass: remove system clip paths/masks
  for (const el of allElements) {
    if (isSystemClipPath(el)) {
      el.parentNode?.removeChild(el);
    }
  }

  // Second pass: clean temp attributes
  for (const el of Array.from(clone.querySelectorAll("*"))) {
    removeAttributes(el, TEMP_ATTRS);
    removeAttributes(el, SYSTEM_ATTRS);
    if (removeEditorData) {
      removeAttributes(el, EDITOR_DATA_ATTRS);
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
