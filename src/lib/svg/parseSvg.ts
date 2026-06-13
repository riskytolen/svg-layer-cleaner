import { assignElementIds } from "./assignElementIds";

export function parseSvg(svgText: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText.trim(), "image/svg+xml");

  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error("SVG tidak valid atau rusak.");
  }

  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg") {
    throw new Error("File tidak memiliki root element <svg>.");
  }

  return assignElementIds(doc);
}
