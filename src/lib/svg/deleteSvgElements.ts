export type DeleteResult = {
  deletedCount: number;
  skippedCount: number;
  skippedRootCount: number;
  skippedLockedCount: number;
  skippedSystemLayerCount: number;
  deletedIds: string[];
};

function isRootElement(doc: Document, el: Element): boolean {
  return el === doc.documentElement;
}

function isLocked(el: Element): boolean {
  return el.getAttribute("data-locked") === "true";
}

function isSystemLayer(el: Element): boolean {
  return el.getAttribute("data-system-layer") === "artwork-transform";
}

function isAlreadyRemoved(el: Element): boolean {
  return !el.parentNode;
}

function countChildElements(el: Element): number {
  let count = 0;
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i];
    if (child.hasAttribute("data-layer-id")) {
      count++;
    }
    count += countChildElements(child);
  }
  return count;
}

export function deleteElementByLayerId(
  doc: Document,
  layerId: string,
): { deleted: boolean; childCount: number; wasRoot: boolean; wasLocked: boolean } {
  const el = doc.querySelector(`[data-layer-id="${layerId}"]`);

  if (!el) {
    return { deleted: false, childCount: 0, wasRoot: false, wasLocked: false };
  }

  if (isRootElement(doc, el)) {
    return { deleted: false, childCount: 0, wasRoot: true, wasLocked: false };
  }

  if (isSystemLayer(el)) {
    return { deleted: false, childCount: 0, wasRoot: false, wasLocked: false };
  }

  if (isLocked(el)) {
    return { deleted: false, childCount: 0, wasRoot: false, wasLocked: true };
  }

  const childCount = el.tagName.toLowerCase() === "g" ? countChildElements(el) : 0;
  el.parentNode?.removeChild(el);

  return { deleted: true, childCount, wasRoot: false, wasLocked: false };
}

export function deleteElementsByLayerIds(
  doc: Document,
  layerIds: string[],
): DeleteResult {
  const result: DeleteResult = {
    deletedCount: 0,
    skippedCount: 0,
    skippedRootCount: 0,
    skippedLockedCount: 0,
    skippedSystemLayerCount: 0,
    deletedIds: [],
  };

  const processed = new Set<string>();

  for (const layerId of layerIds) {
    if (processed.has(layerId)) continue;
    processed.add(layerId);

    const el = doc.querySelector(`[data-layer-id="${layerId}"]`);

    if (!el) {
      result.skippedCount++;
      continue;
    }

    if (isRootElement(doc, el)) {
      result.skippedRootCount++;
      continue;
    }

    if (isSystemLayer(el)) {
      result.skippedSystemLayerCount++;
      continue;
    }

    if (isLocked(el)) {
      result.skippedLockedCount++;
      continue;
    }

    el.parentNode?.removeChild(el);
    result.deletedCount++;
    result.deletedIds.push(layerId);
  }

  return result;
}

export function collectChildIds(doc: Document, layerId: string): string[] {
  const el = doc.querySelector(`[data-layer-id="${layerId}"]`);
  if (!el) return [];

  const ids: string[] = [];
  const descendants = el.querySelectorAll("[data-layer-id]");
  for (const desc of Array.from(descendants)) {
    ids.push(desc.getAttribute("data-layer-id") || "");
  }
  return ids.filter(Boolean);
}
