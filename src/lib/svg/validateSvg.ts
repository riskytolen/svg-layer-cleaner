const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function validateSvgFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".svg")) {
    return "File harus berformat SVG.";
  }

  if (file.type && file.type !== "image/svg+xml" && !file.type.includes("svg")) {
    return "File harus berformat SVG.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Ukuran file terlalu besar. Maksimal 10MB.";
  }

  return null;
}

export function validateSvgDocument(doc: Document): string | null {
  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg") {
    return "SVG tidak valid: root element bukan <svg>.";
  }

  const hasContent = Array.from(root.children).length > 0 || (root.textContent?.trim().length ?? 0) > 0;
  if (!hasContent) {
    return "SVG kosong atau tidak memiliki konten.";
  }

  return null;
}
