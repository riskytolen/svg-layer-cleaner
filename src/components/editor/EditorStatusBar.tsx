"use client";

import { useSvgLayerStore } from "@/store/svgLayerStore";

/** Compact status strip: document, selection and zoom info for the manual editor. */
export function EditorStatusBar() {
  const documentInfo = useSvgLayerStore((s) => s.documentInfo);
  const layers = useSvgLayerStore((s) => s.layers);
  const selectedLayerIds = useSvgLayerStore((s) => s.selectedLayerIds);
  const selectedLayerId = useSvgLayerStore((s) => s.selectedLayerId);
  const zoom = useSvgLayerStore((s) => s.zoom);
  const lastActionSummary = useSvgLayerStore((s) => s.lastActionSummary);

  return (
    <div className="status-strip shrink-0">
      {documentInfo ? (
        <span className="flex items-center gap-1.5 min-w-0" title={documentInfo.fileName}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-foreground/80 font-medium truncate max-w-[220px]">{documentInfo.fileName}</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
          No document open
        </span>
      )}

      <span className="h-3 w-px bg-[#35353b] shrink-0" />

      <span className="tabular-nums">
        {layers.length} layer{layers.length > 1 ? "s" : ""}
      </span>

      <span className="h-3 w-px bg-[#35353b] shrink-0" />

      <span className="tabular-nums">
        {selectedLayerIds.length} selected{selectedLayerId && selectedLayerIds.length > 1 ? " · active 1" : ""}
      </span>

      <span className="h-3 w-px bg-[#35353b] shrink-0" />

      <span className="tabular-nums font-medium text-foreground/70">{Math.round(zoom * 100)}%</span>

      {lastActionSummary && (
        <span className="ml-auto min-w-0 truncate text-foreground/60" title={lastActionSummary}>
          {lastActionSummary}
        </span>
      )}
    </div>
  );
}
