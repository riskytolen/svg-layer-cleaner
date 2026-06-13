import { FirstPathScope } from "@/lib/batch/batchTypes";
import { resolveElementFill, extractCssFillRules, isExcludedElement, isElementVisible } from "./resolveElementFill";

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

function findMainGroup1(doc: Document): Element | null {
  // Try multiple naming conventions
  let group = findGroupByName(doc, "group 1");
  if (!group) group = findGroupByName(doc, "group-1");
  if (!group) group = findGroupByName(doc, "group1");

  // Fallback: first <g> at root level
  if (!group) {
    const root = doc.documentElement;
    const allGs = root.querySelectorAll(":scope > g, :scope > * > g");
    for (const g of Array.from(allGs)) {
      if (!isExcludedElement(g)) {
        group = g;
        break;
      }
    }
  }

  return group;
}

function collectPathsInElement(el: Element): Element[] {
  const paths: Element[] = [];
  const allPaths = el.querySelectorAll("path");
  for (const path of Array.from(allPaths)) {
    if (!isExcludedElement(path) && isElementVisible(path)) {
      paths.push(path);
    }
  }
  return paths;
}

function findFirstPathInElement(el: Element): Element | null {
  const paths = el.querySelectorAll("path");
  for (const path of Array.from(paths)) {
    if (!isExcludedElement(path)) return path;
  }
  return null;
}

/**
 * Original function for batch automation with scope parameter.
 */
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
    let group = findMainGroup1(doc);

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

/**
 * Post-quick-clean function: finds the first valid path with a resolvable fill.
 * Walks through all path candidates and returns the first one with a fill.
 */
export function findFirstProcessablePathAfterClean(
  doc: Document,
): Element | null {
  const cssRules = extractCssFillRules(doc);
  const root = doc.documentElement;
  if (!root) return null;

  // Collect all candidate paths
  const candidates: Element[] = [];

  // Priority 1: paths in Group 1
  const group = findMainGroup1(doc);
  if (group) {
    candidates.push(...collectPathsInElement(group));
  }

  // Priority 2: all paths in document
  const allPaths = root.querySelectorAll("path");
  for (const path of Array.from(allPaths)) {
    if (!candidates.includes(path) && !isExcludedElement(path) && isElementVisible(path)) {
      candidates.push(path);
    }
  }

  // Find first path with a resolved fill
  for (const path of candidates) {
    const fill = resolveElementFill(path, cssRules);
    if (fill) {
      return path;
    }
  }

  // No path with fill found - return first path anyway (will trigger skip with warning)
  if (candidates.length > 0) {
    return candidates[0];
  }

  return null;
}
