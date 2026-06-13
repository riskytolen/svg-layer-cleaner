const TAG_NAMES = new Set([
  "svg", "g", "path", "circle", "rect", "ellipse",
  "polygon", "polyline", "line", "text", "image",
  "defs", "clipPath", "mask", "use", "symbol",
  "linearGradient", "radialGradient", "pattern",
]);

const DATA_LAYER_ID_PREFIX = "layer-";

let idCounter = 0;

export function resetIdCounter(): void {
  idCounter = 0;
}

export function assignElementIds(doc: Document): Document {
  resetIdCounter();

  const allElements = doc.querySelectorAll("*");
  for (const el of Array.from(allElements)) {
    const tag = el.tagName.toLowerCase();
    if (TAG_NAMES.has(tag) || tag === "svg") {
      if (!el.hasAttribute("data-layer-id")) {
        el.setAttribute("data-layer-id", `${DATA_LAYER_ID_PREFIX}${idCounter++}`);
      }
    }
  }

  return doc;
}

export function generateLayerId(): string {
  return `${DATA_LAYER_ID_PREFIX}${idCounter++}`;
}
