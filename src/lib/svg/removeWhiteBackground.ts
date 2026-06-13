const BG_ID = "__system_white_background__";
const BG_SYSTEM_ATTR = "data-system-layer";
const BG_SYSTEM_VALUE = "white-background";

export function removeWhiteBackground(doc: Document): Document {
  // Find by id
  const byId = doc.getElementById(BG_ID);
  if (byId) {
    byId.parentNode?.removeChild(byId);
  }

  // Also find by data-system-layer (fallback)
  const byAttr = doc.querySelector(`[${BG_SYSTEM_ATTR}="${BG_SYSTEM_VALUE}"]`);
  if (byAttr && byAttr !== byId) {
    byAttr.parentNode?.removeChild(byAttr);
  }

  return doc;
}
