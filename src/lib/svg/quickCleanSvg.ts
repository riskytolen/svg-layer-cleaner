import { CleanSvgResult } from "@/types/svg";

function isEmptyPath(el: Element): boolean {
  if (el.tagName.toLowerCase() !== "path") return false;
  const d = el.getAttribute("d");
  if (!d || d.trim() === "" || d.trim() === "M0 0") return true;
  return false;
}

function isEmptyGroup(el: Element): boolean {
  if (el.tagName.toLowerCase() !== "g") return false;
  if (el.getAttribute("data-system-layer")) return false;
  if (el.children.length === 0) return true;
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i];
    const tag = child.tagName.toLowerCase();
    if (tag !== "text" && tag !== "tspan") return false;
    if (child.textContent?.trim()) return false;
  }
  return true;
}

function removeEmptyPaths(doc: Document): number {
  let count = 0;
  const allPaths = doc.querySelectorAll("path");
  for (const path of Array.from(allPaths)) {
    if (isEmptyPath(path)) {
      path.parentNode?.removeChild(path);
      count++;
    }
  }
  return count;
}

function removePathsWithoutD(doc: Document): number {
  let count = 0;
  const allPaths = doc.querySelectorAll("path");
  for (const path of Array.from(allPaths)) {
    if (!path.hasAttribute("d")) {
      path.parentNode?.removeChild(path);
      count++;
    }
  }
  return count;
}

function removeEmptyGroups(doc: Document): number {
  let count = 0;
  let maxIter = 100;
  while (maxIter-- > 0) {
    const groups = doc.querySelectorAll("g");
    let removed = false;
    for (const g of Array.from(groups)) {
      if (isEmptyGroup(g)) {
        g.parentNode?.removeChild(g);
        count++;
        removed = true;
      }
    }
    if (!removed) break;
  }
  return count;
}

function removeComments(doc: Document): number {
  let count = 0;
  const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_COMMENT, null);
  const comments: Node[] = [];
  while (walker.nextNode()) {
    comments.push(walker.currentNode);
  }
  for (const comment of comments) {
    comment.parentNode?.removeChild(comment);
    count++;
  }
  return count;
}

function removeMetadata(doc: Document): number {
  let count = 0;
  const metadatas = doc.querySelectorAll("metadata");
  for (const m of Array.from(metadatas)) {
    m.parentNode?.removeChild(m);
    count++;
  }
  return count;
}

function removeEmptyDefs(doc: Document): number {
  let count = 0;
  const defs = doc.querySelectorAll("defs");
  for (const d of Array.from(defs)) {
    if (d.children.length === 0) {
      d.parentNode?.removeChild(d);
      count++;
    }
  }
  return count;
}

export function quickCleanSvg(doc: Document): CleanSvgResult {
  const before = doc.documentElement.outerHTML.length;

  const removedEmptyPaths = removeEmptyPaths(doc);
  const removedPathsWithoutD = removePathsWithoutD(doc);
  const removedEmptyGroups = removeEmptyGroups(doc);
  const removedComments = removeComments(doc);
  const removedMetadata = removeMetadata(doc);
  const removedEmptyDefs = removeEmptyDefs(doc);

  const after = doc.documentElement.outerHTML.length;

  const totalRemoved = removedEmptyPaths + removedPathsWithoutD + removedEmptyGroups +
    removedComments + removedMetadata + removedEmptyDefs;

  return {
    beforeSize: before,
    afterSize: after,
    reducedSize: before - after,
    reducedPercentage: before > 0 ? Math.round(((before - after) / before) * 100) : 0,
    removedEmptyGroups,
    removedEmptyPaths,
    removedPathsWithoutD,
    removedComments,
    removedMetadata,
    removedHiddenElements: 0,
    removedElementsWithoutFillAndStroke: 0,
    removedEmptyDefs,
    removedEditorAttributes: 0,
    totalRemoved,
  };
}
