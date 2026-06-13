export function getCleanFileName(
  originalFileName: string | null,
  extension: string,
): string {
  let base = originalFileName || "svg-export";

  // Remove extension
  const lastDot = base.lastIndexOf(".");
  if (lastDot > 0) {
    base = base.substring(0, lastDot);
  }

  // Clean special characters, keep alphanumeric, dash, underscore
  base = base.replace(/[^a-zA-Z0-9\-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  if (!base) base = "svg-export";

  return `cleaned-${base}.${extension}`;
}
