"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { useSvgLayerStore } from "@/store/svgLayerStore";

function prepareSvgForPreview(svgText: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const root = doc.documentElement;

  if (!root || root.tagName.toLowerCase() !== "svg") return svgText;

  const hasWidth = root.hasAttribute("width");
  const hasHeight = root.hasAttribute("height");
  const hasViewBox = root.hasAttribute("viewBox");

  if (!hasWidth || !hasHeight) {
    if (hasViewBox) {
      const viewBox = root.getAttribute("viewBox") || "";
      const parts = viewBox.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        const [, , w, h] = parts;
        root.setAttribute("width", String(w));
        root.setAttribute("height", String(h));
      }
    }
    if (!hasWidth) root.setAttribute("width", "100%");
    if (!hasHeight) root.setAttribute("height", "100%");
  }

  root.removeAttribute("style");

  const serializer = new XMLSerializer();
  return serializer.serializeToString(root);
}

export function SvgPreview() {
  const svgText = useSvgLayerStore((s) => s.svgText);
  const selectedLayerId = useSvgLayerStore((s) => s.selectedLayerId);
  const selectedLayerIds = useSvgLayerStore((s) => s.selectedLayerIds);
  const selectLayer = useSvgLayerStore((s) => s.selectLayer);
  const toggleLayerSelection = useSvgLayerStore((s) => s.toggleLayerSelection);
  const containerRef = useRef<HTMLDivElement>(null);

  const processedSvg = useMemo(
    () => (svgText ? prepareSvgForPreview(svgText) : null),
    [svgText],
  );

  const handleSvgClick = useCallback(
    (e: MouseEvent) => {
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
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("click", handleSvgClick);
    return () => container.removeEventListener("click", handleSvgClick);
  }, [handleSvgClick, processedSvg]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const svgEl = container.querySelector("svg");
    if (!svgEl) return;

    // Clear all highlights
    svgEl.querySelectorAll("[data-layer-id]").forEach((el) => {
      el.classList.remove("svg-layer-selected", "svg-layer-multi-selected");
    });

    // Apply multi-select highlights
    for (const id of selectedLayerIds) {
      const el = svgEl.querySelector(`[data-layer-id="${id}"]`);
      if (el) {
        el.classList.add("svg-layer-multi-selected");
      }
    }

    // Apply single-select highlight (overrides multi)
    if (selectedLayerId) {
      const el = svgEl.querySelector(
        `[data-layer-id="${selectedLayerId}"]`,
      );
      if (el) {
        el.classList.add("svg-layer-selected");
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
  }, [selectedLayerId, selectedLayerIds, processedSvg]);

  if (!processedSvg) return null;

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto"
      style={{
        background:
          "repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 50% / 20px 20px",
      }}
    >
      <div
        className="min-w-full min-h-full flex items-center justify-center p-4"
        dangerouslySetInnerHTML={{ __html: processedSvg }}
      />
    </div>
  );
}
