import { SvgLayer, SvgElementType } from "@/types/svg";
import { getElementName } from "./getElementName";
import { getElementColorInfo, getElementDisplay, getElementVisibility, getElementOpacity } from "./getElementColors";
import { getElementAttributes } from "./getElementAttributes";

const TAG_TYPE_MAP: Record<string, SvgElementType> = {
  svg: "svg",
  g: "group",
  path: "path",
  circle: "circle",
  rect: "rect",
  ellipse: "ellipse",
  polygon: "polygon",
  polyline: "polyline",
  line: "line",
  text: "text",
  image: "image",
  defs: "defs",
  clipPath: "clipPath",
  mask: "mask",
  use: "use",
  symbol: "symbol",
  linearGradient: "linearGradient",
  radialGradient: "radialGradient",
  pattern: "pattern",
};

const TRACKED_TAGS = new Set(Object.keys(TAG_TYPE_MAP));

function getElementType(tagName: string): SvgElementType {
  return TAG_TYPE_MAP[tagName] || "unknown";
}

function elementIsVisible(element: Element): boolean {
  const display = getElementDisplay(element);
  if (display === "none") return false;

  const visibility = getElementVisibility(element);
  if (visibility === "hidden") return false;

  const opacity = getElementOpacity(element);
  if (opacity === "0") return false;

  return true;
}

function countElementChildren(element: Element): number {
  let count = 0;
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];
    const tag = child.tagName.toLowerCase();
    if (TRACKED_TAGS.has(tag)) {
      count++;
      count += countElementChildren(child);
    }
  }
  return count;
}

function buildLayer(
  element: Element,
  parentId: string | null,
  depth: number,
  childIndex: number,
): SvgLayer | null {
  const tag = element.tagName.toLowerCase();
  if (!TRACKED_TAGS.has(tag)) return null;

  const dataLayerId = element.getAttribute("data-layer-id") || "";
  const elementId = element.getAttribute("id") || "";
  const tagName = element.tagName.toLowerCase();

  const isVisible = elementIsVisible(element);
  const colorInfo = getElementColorInfo(element);
  const opacity = getElementOpacity(element);
  const display = getElementDisplay(element);
  const visibility = getElementVisibility(element);

  const attrs = getElementAttributes(element);

  let pathData: string | null = null;
  if (tag === "path") {
    pathData = element.getAttribute("d") || null;
  }

  let textContent: string | null = null;
  if (tag === "text") {
    textContent = element.textContent?.trim() || null;
  }

  const children: SvgLayer[] = [];
  let childIdx = 0;
  for (let i = 0; i < element.children.length; i++) {
    const childEl = element.children[i];
    const childLayer = buildLayer(childEl, dataLayerId, depth + 1, childIdx);
    if (childLayer) {
      children.push(childLayer);
      childIdx++;
    }
  }

  const layer: SvgLayer = {
    id: dataLayerId,
    name: getElementName(element, childIndex),
    type: getElementType(tag),
    tagName,
    elementId,
    parentId,
    depth,
    index: childIndex,
    fill: colorInfo.fill,
    stroke: colorInfo.stroke,
    normalizedFill: colorInfo.normalizedFill,
    normalizedStroke: colorInfo.normalizedStroke,
    opacity,
    display,
    visibility,
    hasChildren: children.length > 0,
    children,
    attributes: attrs,
    isVisible,
    isSelected: false,
    isLocked: false,
    pathData,
    textContent,
    elementCount: children.length > 0 ? countElementChildren(element) : undefined,
  };

  return layer;
}

export function buildLayerTree(doc: Document): SvgLayer[] {
  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg") return [];

  const layers: SvgLayer[] = [];
  let childIdx = 0;

  const rootLayer = buildLayer(root, null, 0, 0);
  if (rootLayer) {
    layers.push(rootLayer);
    childIdx++;
  }

  return layers;
}
