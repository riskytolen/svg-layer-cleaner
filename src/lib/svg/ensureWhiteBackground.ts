const BG_ID = "__system_white_background__";
const BG_SYSTEM_ATTR = "data-system-layer";
const BG_SYSTEM_VALUE = "white-background";

function isWhiteBackground(el: Element): boolean {
  return (
    el.getAttribute("id") === BG_ID ||
    el.getAttribute(BG_SYSTEM_ATTR) === BG_SYSTEM_VALUE
  );
}

export function ensureWhiteBackground(
  doc: Document,
  options?: {
    width?: number;
    height?: number;
    fill?: string;
  },
): Document {
  const width = options?.width ?? 2500;
  const height = options?.height ?? 2500;
  const fill = options?.fill ?? "#FFFFFF";

  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg") return doc;

  // Check if already exists
  const existing = doc.getElementById(BG_ID);
  if (existing) {
    // Update attributes if needed
    existing.setAttribute("d", `M0 0 H${width} V${height} H0 Z`);
    existing.setAttribute("fill", fill);
    return doc;
  }

  // Also check by data-system-layer
  const byAttr = root.querySelector(`[${BG_SYSTEM_ATTR}="${BG_SYSTEM_VALUE}"]`);
  if (byAttr) {
    byAttr.setAttribute("d", `M0 0 H${width} V${height} H0 Z`);
    byAttr.setAttribute("fill", fill);
    return doc;
  }

  // Create background path
  const path = doc.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("id", BG_ID);
  path.setAttribute(BG_SYSTEM_ATTR, BG_SYSTEM_VALUE);
  path.setAttribute("data-layer-id", "system-white-background");
  path.setAttribute("data-locked", "true");
  path.setAttribute("data-deletable", "false");
  path.setAttribute("d", `M0 0 H${width} V${height} H0 Z`);
  path.setAttribute("fill", fill);
  path.setAttribute("stroke", "none");

  // Insert after defs/style, before artwork
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
    root.insertBefore(path, insertBefore);
  } else {
    root.appendChild(path);
  }

  return doc;
}
