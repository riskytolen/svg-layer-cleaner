"use client";

import { useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSvgLayerStore } from "@/store/svgLayerStore";

export function CanvasControls() {
  const zoom = useSvgLayerStore((s) => s.zoom);
  const fitZoom = useSvgLayerStore((s) => s.fitZoom);
  const setZoom = useSvgLayerStore((s) => s.setZoom);
  const fitToScreen = useSvgLayerStore((s) => s.fitToScreen);

  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(zoom * 1.2, 8));
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(zoom / 1.2, 0.05));
  }, [zoom, setZoom]);

  const handleFitToScreen = useCallback(() => {
    const viewport = document.querySelector(".preview-viewport");
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    fitToScreen(rect.width, rect.height);
  }, [fitToScreen]);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
  }, [setZoom]);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-card border border-border rounded-lg shadow-lg px-1 py-1 z-10">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleZoomOut}
        title="Zoom Out"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </Button>

      <span className="text-xs text-muted-foreground font-mono w-10 text-center tabular-nums">
        {zoomPercent}%
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleZoomIn}
        title="Zoom In"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </Button>

      <div className="w-px h-4 bg-border mx-0.5" />

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleFitToScreen}
        title="Fit to Screen"
      >
        <Maximize className="w-3.5 h-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleResetZoom}
        title="Reset Zoom (100%)"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
