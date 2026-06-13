const SYSTEM_MARKERS = [
  "__eps_page_bounds__",
  "__eps_clip",
  "__page_clip",
  "__export_clip",
  "__canvas_clip",
];

export function sanitizeEpsOutput(
  epsText: string,
  options?: {
    removeGeneratedClip?: boolean;
    removePageBoundsMarkers?: boolean;
  },
): string {
  const removeGeneratedClip = options?.removeGeneratedClip ?? true;
  const removePageBoundsMarkers = options?.removePageBoundsMarkers ?? true;

  let result = epsText;

  if (removePageBoundsMarkers) {
    // Remove PostScript comments referencing system markers
    for (const marker of SYSTEM_MARKERS) {
      const regex = new RegExp(`%%.*${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*\\n`, "gi");
      result = result.replace(regex, "");
    }

    // Remove any PostScript text/string containing system markers
    for (const marker of SYSTEM_MARKERS) {
      const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const stringRegex = new RegExp(`\\((?:[^()]*${escaped}[^()]*)\\)`, "gi");
      result = result.replace(stringRegex, '()');
    }
  }

  if (removeGeneratedClip) {
    // Remove clip instructions that reference system markers
    for (const marker of SYSTEM_MARKERS) {
      const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Remove "clip" or "cl" commands preceded by paths referencing system markers
      // This is conservative - only remove if marker is in nearby context
      const clipContextRegex = new RegExp(
        `\\(.*${escaped}.*\\)[\\s\\S]{0,50}(?:clip|cl)\\b`,
        "gi",
      );
      result = result.replace(clipContextRegex, "");
    }
  }

  return result;
}
