import { normalizeColor } from "@/lib/utils/colorUtils";

function parseStyleValue(style: string | null, prop: string): string | null {
  if (!style) return null;
  const regex = new RegExp(`${prop}\\s*:\\s*([^;]+)`);
  const match = style.match(regex);
  return match ? match[1].trim() : null;
}

export function getElementFill(element: Element): string | null {
  const fillAttr = element.getAttribute("fill");
  if (fillAttr && fillAttr !== "inherit" && fillAttr !== "") return fillAttr;

  const style = element.getAttribute("style");
  const fromStyle = parseStyleValue(style, "fill");
  if (fromStyle && fromStyle !== "inherit" && fromStyle !== "") return fromStyle;

  return null;
}

export function getElementStroke(element: Element): string | null {
  const strokeAttr = element.getAttribute("stroke");
  if (strokeAttr && strokeAttr !== "none" && strokeAttr !== "inherit" && strokeAttr !== "") return strokeAttr;

  const style = element.getAttribute("style");
  const fromStyle = parseStyleValue(style, "stroke");
  if (fromStyle && fromStyle !== "none" && fromStyle !== "inherit" && fromStyle !== "") return fromStyle;

  return null;
}

export function getElementOpacity(element: Element): string | null {
  const opacityAttr = element.getAttribute("opacity");
  if (opacityAttr && opacityAttr !== "") return opacityAttr;

  const fillOpacity = element.getAttribute("fill-opacity");
  if (fillOpacity && fillOpacity !== "") return fillOpacity;

  const style = element.getAttribute("style");
  const fromStyle = parseStyleValue(style, "opacity");
  if (fromStyle && fromStyle !== "") return fromStyle;

  return null;
}

export function getElementDisplay(element: Element): string | null {
  const display = element.getAttribute("display");
  if (display && display !== "") return display;

  const style = element.getAttribute("style");
  const fromStyle = parseStyleValue(style, "display");
  if (fromStyle && fromStyle !== "") return fromStyle;

  return null;
}

export function getElementVisibility(element: Element): string | null {
  const visibility = element.getAttribute("visibility");
  if (visibility && visibility !== "") return visibility;

  const style = element.getAttribute("style");
  const fromStyle = parseStyleValue(style, "visibility");
  if (fromStyle && fromStyle !== "") return fromStyle;

  return null;
}

export function getElementColorInfo(element: Element): {
  fill: string | null;
  stroke: string | null;
  opacity: string | null;
  normalizedFill: string | null;
  normalizedStroke: string | null;
} {
  const fill = getElementFill(element);
  const stroke = getElementStroke(element);
  const opacity = getElementOpacity(element);

  return {
    fill,
    stroke,
    opacity,
    normalizedFill: normalizeColor(fill),
    normalizedStroke: normalizeColor(stroke),
  };
}
