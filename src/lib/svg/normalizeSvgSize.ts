import { SvgResizeOptions, SvgResizeResult, defaultSvgResizeOptions } from "@/types/svg";

const SYSTEM_LAYER_ATTR = "data-system-layer";
const SYSTEM_LAYER_VALUE = "artwork-transform";
const SYSTEM_LAYER_ID = "system-artwork-transform";

const NON_VISUAL_TAGS = new Set([
  "defs", "style", "title", "desc", "metadata", "script",
]);

function parseSvgDimension(value: string | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;

  // percentage - can't reliably convert without viewport context
  if (trimmed.endsWith("%")) return null;

  // strip known units
  const numeric = trimmed.replace(/(px|pt|em|rem|cm|mm|in|pc)$/i, "").trim();
  const num = parseFloat(numeric);
  return isNaN(num) ? null : num;
}

function isNonVisualTag(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  return NON_VISUAL_TAGS.has(tag);
}

function isArtworkTransformGroup(el: Element): boolean {
  return (
    el.tagName.toLowerCase() === "g" &&
    el.getAttribute(SYSTEM_LAYER_ATTR) === SYSTEM_LAYER_VALUE
  );
}

function hasArtworkTransformGroup(doc: Document): boolean {
  return !!doc.querySelector(`[${SYSTEM_LAYER_ATTR}="${SYSTEM_LAYER_VALUE}"]`);
}

export function normalizeSvgToSize(
  doc: Document,
  options?: Partial<SvgResizeOptions>,
): SvgResizeResult {
  const opts: SvgResizeOptions = { ...defaultSvgResizeOptions, ...options };
  const root = doc.documentElement;

  // 1. Read old dimensions
  const oldWidth = root.getAttribute("width");
  const oldHeight = root.getAttribute("height");
  const oldViewBox = root.getAttribute("viewBox");

  // 2. Parse old viewBox
  let originalMinX = 0;
  let originalMinY = 0;
  let originalWidth: number | null = null;
  let originalHeight: number | null = null;

  if (oldViewBox) {
    const parts = oldViewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
      originalMinX = parts[0];
      originalMinY = parts[1];
      originalWidth = parts[2];
      originalHeight = parts[3];
    }
  }

  // 3. If no viewBox, try width/height
  if (originalWidth === null || originalHeight === null) {
    const w = parseSvgDimension(oldWidth);
    const h = parseSvgDimension(oldHeight);
    if (w !== null && h !== null) {
      originalWidth = w;
      originalHeight = h;
      originalMinX = 0;
      originalMinY = 0;
    }
  }

  // 4. Fallback - can't determine size, set to target
  if (originalWidth === null || originalHeight === null || originalWidth <= 0 || originalHeight <= 0) {
    originalWidth = opts.targetWidth;
    originalHeight = opts.targetHeight;
    originalMinX = 0;
    originalMinY = 0;
  }

  const originalAspectRatio = originalWidth / originalHeight;
  const targetAspectRatio = opts.targetWidth / opts.targetHeight;

  // 5. Check if already at target size (no transform needed)
  if (
    Math.abs(originalWidth - opts.targetWidth) < 0.01 &&
    Math.abs(originalHeight - opts.targetHeight) < 0.01 &&
    Math.abs(originalMinX) < 0.01 &&
    Math.abs(originalMinY) < 0.01 &&
    hasArtworkTransformGroup(doc)
  ) {
    return {
      oldWidth,
      oldHeight,
      oldViewBox,
      newWidth: opts.targetWidth,
      newHeight: opts.targetHeight,
      newViewBox: `0 0 ${opts.targetWidth} ${opts.targetHeight}`,
      scale: 1,
      translateX: 0,
      translateY: 0,
      originalAspectRatio,
      targetAspectRatio,
      resized: false,
    };
  }

  // 6. Calculate scale
  let scale: number;
  const paddingW = opts.padding * 2;
  const paddingH = opts.padding * 2;
  const availableWidth = opts.targetWidth - paddingW;
  const availableHeight = opts.targetHeight - paddingH;

  switch (opts.mode) {
    case "contain":
      scale = Math.min(
        availableWidth / originalWidth,
        availableHeight / originalHeight,
      );
      break;
    case "cover":
      scale = Math.max(
        availableWidth / originalWidth,
        availableHeight / originalHeight,
      );
      break;
    case "stretch":
      // stretch ignores aspect ratio - not useful for scaling uniform group
      scale = Math.min(
        availableWidth / originalWidth,
        availableHeight / originalHeight,
      );
      break;
  }

  // 7. Calculate translate for centering
  const scaledWidth = originalWidth * scale;
  const scaledHeight = originalHeight * scale;

  let translateX = (opts.targetWidth - scaledWidth) / 2 - originalMinX * scale;
  let translateY = (opts.targetHeight - scaledHeight) / 2 - originalMinY * scale;

  if (opts.padding) {
    translateX += opts.padding;
    translateY += opts.padding;
  }

  // 8. Set root SVG dimensions
  root.setAttribute("width", String(opts.targetWidth));
  root.setAttribute("height", String(opts.targetHeight));
  root.setAttribute("viewBox", `0 0 ${opts.targetWidth} ${opts.targetHeight}`);
  if (!root.hasAttribute("xmlns")) {
    root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  // 9. Handle existing artwork transform group
  const existingGroup = doc.querySelector(
    `[${SYSTEM_LAYER_ATTR}="${SYSTEM_LAYER_VALUE}"]`,
  );

  if (existingGroup) {
    // Update transform on existing group
    existingGroup.setAttribute(
      "transform",
      `translate(${translateX} ${translateY}) scale(${scale})`,
    );
    return {
      oldWidth,
      oldHeight,
      oldViewBox,
      newWidth: opts.targetWidth,
      newHeight: opts.targetHeight,
      newViewBox: `0 0 ${opts.targetWidth} ${opts.targetHeight}`,
      scale,
      translateX,
      translateY,
      originalAspectRatio,
      targetAspectRatio,
      resized: true,
    };
  }

  // 10. Collect children to wrap
  const childrenToWrap: Element[] = [];
  const structuralChildren: Element[] = [];

  for (let i = root.children.length - 1; i >= 0; i--) {
    const child = root.children[i];
    if (isNonVisualTag(child) || isArtworkTransformGroup(child)) {
      continue;
    }
    childrenToWrap.push(child);
  }

  // Reverse to preserve original order
  childrenToWrap.reverse();

  if (childrenToWrap.length === 0) {
    // Nothing to wrap, just set dimensions
    return {
      oldWidth,
      oldHeight,
      oldViewBox,
      newWidth: opts.targetWidth,
      newHeight: opts.targetHeight,
      newViewBox: `0 0 ${opts.targetWidth} ${opts.targetHeight}`,
      scale,
      translateX,
      translateY,
      originalAspectRatio,
      targetAspectRatio,
      resized: true,
    };
  }

  // 11. Create artwork transform group
  const g = doc.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute(SYSTEM_LAYER_ATTR, SYSTEM_LAYER_VALUE);
  g.setAttribute("data-layer-id", SYSTEM_LAYER_ID);
  g.setAttribute(
    "transform",
    `translate(${translateX} ${translateY}) scale(${scale})`,
  );

  // Move children into group
  for (const child of childrenToWrap) {
    root.removeChild(child);
    g.appendChild(child);
  }

  // Insert group after defs/style/title/desc/metadata
  let insertBefore: Element | null = null;
  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i];
    if (!isNonVisualTag(child) && !isArtworkTransformGroup(child)) {
      insertBefore = child;
      break;
    }
  }

  if (insertBefore) {
    root.insertBefore(g, insertBefore);
  } else {
    root.appendChild(g);
  }

  return {
    oldWidth,
    oldHeight,
    oldViewBox,
    newWidth: opts.targetWidth,
    newHeight: opts.targetHeight,
    newViewBox: `0 0 ${opts.targetWidth} ${opts.targetHeight}`,
    scale,
    translateX,
    translateY,
    originalAspectRatio,
    targetAspectRatio,
    resized: true,
  };
}
