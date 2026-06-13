import { SvgDocumentInfo } from "@/types/svg";

const COLOR_ATTRS = ["fill", "stroke"];
const STYLE_COLOR_REGEX = /(?:fill|stroke)\s*:\s*([^;]+)/gi;

function extractColors(element: Element): Set<string> {
  const colors = new Set<string>();

  for (const attr of COLOR_ATTRS) {
    const val = element.getAttribute(attr);
    if (val && val !== "none" && val !== "inherit" && val !== "currentColor" && val !== "transparent") {
      if (val.startsWith("#") || val.startsWith("rgb")) {
        colors.add(val);
      }
    }
  }

  const style = element.getAttribute("style");
  if (style) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(STYLE_COLOR_REGEX);
    while ((match = regex.exec(style)) !== null) {
      const color = match[1].trim();
      if (color !== "none" && color !== "inherit" && color !== "currentColor" && color !== "transparent") {
        if (color.startsWith("#") || color.startsWith("rgb")) {
          colors.add(color);
        }
      }
    }
  }

  for (let i = 0; i < element.children.length; i++) {
    const childColors = extractColors(element.children[i]);
    childColors.forEach((c) => colors.add(c));
  }

  return colors;
}

function countByTag(doc: Document, tag: string): number {
  return doc.querySelectorAll(tag).length;
}

export function getSvgDocumentInfo(
  doc: Document,
  fileName: string,
  fileSize: number,
): SvgDocumentInfo {
  const root = doc.documentElement;
  const width = root.getAttribute("width") || null;
  const height = root.getAttribute("height") || null;
  const viewBox = root.getAttribute("viewBox") || null;

  const allElements = doc.querySelectorAll("*");
  const colors = extractColors(root);

  return {
    fileName,
    fileSize,
    width,
    height,
    viewBox,
    totalElements: allElements.length,
    totalGroups: countByTag(doc, "g"),
    totalPaths: countByTag(doc, "path"),
    totalColors: colors.size,
  };
}
