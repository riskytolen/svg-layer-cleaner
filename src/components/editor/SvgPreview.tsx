"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useSvgLayerStore } from "@/store/svgLayerStore";

const SVG_CANVAS_SIZE = 2500;

export function SvgPreview() {
  const svgText = useSvgLayerStore((s) => s.svgText);
  const selectedLayerId = useSvgLayerStore((s) => s.selectedLayerId);
  const selectedLayerIds = useSvgLayerStore((s) => s.selectedLayerIds);
  const selectLayer = useSvgLayerStore((s) => s.selectLayer);
  const toggleLayerSelection = useSvgLayerStore((s) => s.toggleLayerSelection);
  const zoom = useSvgLayerStore((s) => s.zoom);
  const panX = useSvgLayerStore((s) => s.panX);
  const panY = useSvgLayerStore((s) => s.panY);
  const setPan = useSvgLayerStore((s) => s.setPan);
  const setZoom = useSvgLayerStore((s) => s.setZoom);
  const resetPreviewViewport = useSvgLayerStore((s) => s.resetPreviewViewport);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0, moved: false });

  // Fit to screen on upload or svgText change
  useEffect(() => {
    if (!svgText || !viewportRef.current) return;
    const raf = requestAnimationFrame(() => {
      if (!viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      resetPreviewViewport(rect.width, rect.height);
    });
    return () => cancelAnimationFrame(raf);
  }, [svgText, resetPreviewViewport]);

  // Apply selection highlights
  useEffect(() => {
    const container = viewportRef.current;
    if (!container) return;

    const svgEl = container.querySelector("svg");
    if (!svgEl) return;

    svgEl.querySelectorAll("[data-layer-id]").forEach((el) => {
      el.classList.remove("svg-layer-selected", "svg-layer-multi-selected");
    });

    for (const id of selectedLayerIds) {
      const el = svgEl.querySelector(`[data-layer-id="${id}"]`);
      if (el) el.classList.add("svg-layer-multi-selected");
    }

    if (selectedLayerId) {
      const el = svgEl.querySelector(`[data-layer-id="${selectedLayerId}"]`);
      if (el) el.classList.add("svg-layer-selected");
    }
  }, [selectedLayerId, selectedLayerIds, svgText]);

  // Handle SVG element click for layer selection
  const handleSvgClick = useCallback(
    (e: MouseEvent) => {
      // Ignore if we were panning
      if (panStartRef.current.moved) return;

      const target = e.target as Element;
      const layerId =
        target.getAttribute("data-layer-id") ||
        target.closest("[data-layer-id]")?.getAttribute("data-layer-id");
      if (!layerId) return;

      if (e.ctrlKey || e.metaKey) {
        toggleLayerSelection(layerId);
      } else {
        selectLayer(layerId);
      }
    },
    [selectLayer, toggleLayerSelection],
  );

  useEffect(() => {
    const container = viewportRef.current;
    if (!container) return;
    container.addEventListener("click", handleSvgClick);
    return () => container.removeEventListener("click", handleSvgClick);
  }, [handleSvgClick, svgText]);

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan with middle button or space+left (handled in keyboard)
      // For simplicity: left click on viewport background pans
      const target = e.target as Element;
      // Don't pan if clicking on an SVG element with data-layer-id
      if (target.closest("[data-layer-id]")) return;

      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPanX: panX,
        startPanY: panY,
        moved: false,
      };
      setIsPanning(true);
    },
    [panX, panY],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;

      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        panStartRef.current.moved = true;
      }

      setPan(
        panStartRef.current.startPanX + dx,
        panStartRef.current.startPanY + dy,
      );
    },
    [isPanning, setPan],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Attach wheel listener with passive: false for preventDefault
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const currentZoom = useSvgLayerStore.getState().zoom;
      const currentPanX = useSvgLayerStore.getState().panX;
      const currentPanY = useSvgLayerStore.getState().panY;
      const newZoom = Math.max(0.05, Math.min(currentZoom * delta, 8));

      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scale = newZoom / currentZoom;
      const newPanX = mouseX - (mouseX - currentPanX) * scale;
      const newPanY = mouseY - (mouseY - currentPanY) * scale;

      setZoom(newZoom);
      setPan(newPanX, newPanY);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [setZoom, setPan]);

  if (!svgText) return null;

  return (
    <div
      ref={viewportRef}
      className="w-full h-full overflow-hidden relative select-none"
      style={{
        background:
          "repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 50% / 20px 20px",
        cursor: isPanning ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Canvas layer with transform */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transformOrigin: "top left",
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          willChange: "transform",
        }}
      >
        {/* SVG canvas at actual 2500x2500 size */}
        <div
          style={{
            width: SVG_CANVAS_SIZE,
            height: SVG_CANVAS_SIZE,
            background: "white",
            boxShadow: "0 2px 20px rgba(0,0,0,0.15)",
          }}
          dangerouslySetInnerHTML={{ __html: svgText }}
        />
      </div>
    </div>
  );
}
