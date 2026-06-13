const capitalizeTag = (tag: string): string => {
  const map: Record<string, string> = {
    g: "Group",
    path: "Path",
    circle: "Circle",
    rect: "Rect",
    ellipse: "Ellipse",
    polygon: "Polygon",
    polyline: "Polyline",
    line: "Line",
    text: "Text",
    image: "Image",
    defs: "Defs",
    clipPath: "Clip Path",
    mask: "Mask",
    use: "Use",
    symbol: "Symbol",
    linearGradient: "Linear Gradient",
    radialGradient: "Radial Gradient",
    pattern: "Pattern",
    svg: "SVG Root",
  };
  return map[tag] || tag.charAt(0).toUpperCase() + tag.slice(1);
};

export function getElementName(element: Element, index: number): string {
  const id = element.getAttribute("id");
  if (id) return id;

  const inkscapeLabel = element.getAttribute("inkscape:label");
  if (inkscapeLabel) return inkscapeLabel;

  const dataName = element.getAttribute("data-name");
  if (dataName) return dataName;

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  const tag = element.tagName.toLowerCase();

  if (tag === "text") {
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length > 0) {
      return textContent.slice(0, 30);
    }
  }

  const label = capitalizeTag(tag);
  return `${label} ${index + 1}`;
}
