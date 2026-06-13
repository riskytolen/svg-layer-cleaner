import { FirstPathScope } from "@/lib/batch/batchTypes";

const EXCLUDED_TAGS = new Set(["defs", "clippath", "mask", "pattern", "lineargradient", "radialgradient", "symbol"]);

function isExcludedElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (EXCLUDED_TAGS.has(tag)) return true;
  if (el.closest("defs")) return true;
  if (el.closest("clippath")) return true;
  if (el.closest("mask")) return true;
  if (el.getAttribute("data-system-layer")) return true;
  if (el.getAttribute("data-locked") === "true") return true;
  return false;
}

function findGroupByName(doc: Document, name: string): Element | null {
  const allGs = doc.querySelectorAll("g");
  for (const g of Array.from(allGs)) {
    const id = (g.getAttribute("id") || "").toLowerCase();
    const dataId = (g.getAttribute("data-layer-id") || "").toLowerCase();
    const nameAttr = (g.getAttribute("data-name") || "").toLowerCase();
    if (id.includes(name) || dataId.includes(name) || nameAttr.includes(name)) {
      return g;
    }
  }
  return null;
}

function findFirstPathInElement(el: Element): Element | null {
  const paths = el.querySelectorAll("path");
  for (const path of Array.from(paths)) {
    if (!isExcludedElement(path)) return path;
  }
  return null;
}

export function findFirstPathInGroup(
  doc: Document,
  options: {
    scope: FirstPathScope;
  },
): Element | null {
  const { scope } = options;
  const root = doc.documentElement;
  if (!root) return null;

  if (scope === "group-1") {
    // Try to find "Group 1" by name/id
    let group = findGroupByName(doc, "group 1");
    if (!group) {
      group = findGroupByName(doc, "group-1");
    }
    if (!group) {
      group = findGroupByName(doc, "group1");
    }

    // Fallback: first <g> inside root
    if (!group) {
      const allGs = root.querySelectorAll(":scope > g, :scope > * > g");
      for (const g of Array.from(allGs)) {
        if (!isExcludedElement(g)) {
          group = g;
          break;
        }
      }
    }

    if (group) {
      const path = findFirstPathInElement(group);
      if (path) return path;
    }

    // Fallback to first path in document
    return findFirstPathInElement(root);
  }

  if (scope === "first-group") {
    const allGs = root.querySelectorAll("g");
    for (const g of Array.from(allGs)) {
      if (!isExcludedElement(g)) {
        const path = findFirstPathInElement(g);
        if (path) return path;
      }
    }
    return findFirstPathInElement(root);
  }

  // scope === "document"
  return findFirstPathInElement(root);
}
