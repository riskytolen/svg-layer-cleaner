"use client";

import { useRef, useEffect, useCallback } from "react";
import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { ZoomIn, ZoomOut, Maximize, Moon, Grid3X3, Sun } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const SVG_CANVAS_SIZE = 2500;

const CANVAS_BG: Record<string, React.CSSProperties> = {
  black: { background: "#020617" },
  white: { background: "#ffffff" },
  checkerboard: {
    background: "repeating-conic-gradient(#334155 0% 25%, #0f172a 0% 50%) 50% / 20px 20px",
  },
};

export function BatchReviewPreview() {
  const reviewItems = useBatchAutomationStore((s) => s.reviewItems);
  const activeReviewId = useBatchAutomationStore((s) => s.activeReviewId);
  const reviewSelectedLayerId = useBatchAutomationStore((s) => s.reviewSelectedLayerId);
  const reviewSelectedLayerIds = useBatchAutomationStore((s) => s.reviewSelectedLayerIds);
  const selectReviewLayer = useBatchAutomationStore((s) => s.selectReviewLayer);
  const toggleReviewLayer = useBatchAutomationStore((s) => s.toggleReviewLayer);
  const deselectReviewLayer = useBatchAutomationStore((s) => s.deselectReviewLayer);
  const reviewSelectionMode = useBatchAutomationStore((s) => s.reviewSelectionMode);
  const setReviewSelectionMode = useBatchAutomationStore((s) => s.setReviewSelectionMode);
  const reviewPickColorMode = useBatchAutomationStore((s) => s.reviewPickColorMode);
  const setReviewPickColorMode = useBatchAutomationStore((s) => s.setReviewPickColorMode);
  const pickReviewColor = useBatchAutomationStore((s) => s.pickReviewColor);
  const deselectReviewLayers = useBatchAutomationStore((s) => s.deselectReviewLayers);
  const reviewCanvas = useBatchAutomationStore((s) => s.options.reviewCanvas);
  const updateOptions = useBatchAutomationStore((s) => s.updateOptions);

  const item = reviewItems.find((r) => r.id === activeReviewId) || null;
  const svgText = item?.svgText || null;

  const viewportRef = useRef<HTMLDivElement>(null);
  const transformLayerRef = useRef<HTMLDivElement>(null);
  const zoomLabelRef = useRef<HTMLSpanElement>(null);

  // Refs are the source of truth. Transform is applied directly to the DOM
  // so pan/zoom never triggers a React re-render of the heavy SVG.
  const zoomRef = useRef(0.2);
  const panRef = useRef({ x: 0, y: 0 });
  const transformRafRef = useRef<number | null>(null);
  const highlightedElsRef = useRef<Element[]>([]);
  const lastFittedReviewIdRef = useRef<string | null>(null);
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    moved: false,
    downLayerId: null as string | null,
    button: 0,
    marquee: false,
  });
  // Area-deselect marquee rectangle, driven directly through the DOM so
  // pointermove never triggers a React re-render while dragging.
  const marqueeRef = useRef<HTMLDivElement>(null);

  const applyTransform = useCallback(() => {
    const layer = transformLayerRef.current;
    if (layer) {
      const { x, y } = panRef.current;
      const z = zoomRef.current;
      layer.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${z})`;
    }
    const label = zoomLabelRef.current;
    if (label) {
      label.textContent = `${Math.round(zoomRef.current * 100)}%`;
    }
  }, []);

  const scheduleTransform = useCallback(() => {
    if (transformRafRef.current !== null) return;
    transformRafRef.current = requestAnimationFrame(() => {
      transformRafRef.current = null;
      applyTransform();
    });
  }, [applyTransform]);

  useEffect(() => {
    return () => {
      if (transformRafRef.current !== null) {
        cancelAnimationFrame(transformRafRef.current);
        transformRafRef.current = null;
      }
    };
  }, []);

  const zoomAt = useCallback(
    (newZoom: number, centerX: number, centerY: number) => {
      const clamped = Math.max(0.05, Math.min(newZoom, 8));
      const prevZoom = zoomRef.current;
      if (prevZoom === 0) return;
      const scale = clamped / prevZoom;
      const prevPan = panRef.current;
      panRef.current = {
        x: centerX - (centerX - prevPan.x) * scale,
        y: centerY - (centerY - prevPan.y) * scale,
      };
      zoomRef.current = clamped;
      scheduleTransform();
    },
    [scheduleTransform],
  );

  const setViewportCursor = useCallback((grabbing: boolean) => {
    const el = viewportRef.current;
    if (el) el.style.cursor = grabbing
      ? "grabbing"
      : reviewSelectionMode !== "select" || reviewPickColorMode
        ? "crosshair"
        : "grab";
  }, [reviewSelectionMode, reviewPickColorMode]);

  // Marquee rectangle from two viewport-relative corner positions.
  const updateMarqueeRect = useCallback((aX: number, aY: number, bX: number, bY: number) => {
    const el = marqueeRef.current;
    const container = viewportRef.current;
    if (!el || !container) return;
    const rect = container.getBoundingClientRect();
    const left = Math.min(aX, bX) - rect.left;
    const top = Math.min(aY, bY) - rect.top;
    const width = Math.abs(bX - aX);
    const height = Math.abs(bY - aY);
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
  }, []);

  // Release every selected object whose box intersects the dragged rectangle.
  const applyAreaDeselect = useCallback(
    (aX: number, aY: number, bX: number, bY: number) => {
      const container = viewportRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const boxLeft = Math.min(aX, bX) - rect.left;
      const boxTop = Math.min(aY, bY) - rect.top;
      const boxRight = Math.max(aX, bX) - rect.left;
      const boxBottom = Math.max(aY, bY) - rect.top;
      const svgEl = container.querySelector("svg");
      if (!svgEl) return;
      const removeIds: string[] = [];
      for (const id of reviewSelectedLayerIds) {
        const el = svgEl.querySelector(`[data-layer-id="${CSS.escape(id)}"]`);
        if (!el) continue;
        const elRect = el.getBoundingClientRect();
        const elLeft = elRect.left - rect.left;
        const elTop = elRect.top - rect.top;
        // Intersection counts touch contact: any overlap releases the object.
        const intersects = !(
          elLeft + elRect.width < boxLeft ||
          elLeft > boxRight ||
          elTop + elRect.height < boxTop ||
          elTop > boxBottom
        );
        if (intersects && !removeIds.includes(id)) removeIds.push(id);
      }
      if (removeIds.length > 0) deselectReviewLayers(removeIds);
    },
    [reviewSelectedLayerIds, deselectReviewLayers],
  );

  const hideMarquee = useCallback(() => {
    if (marqueeRef.current) marqueeRef.current.style.display = "none";
  }, []);

  // Fit only when the active asset changes, never on manual SVG edits.
  useEffect(() => {
    if (!activeReviewId || !svgText || !viewportRef.current) return;
    if (lastFittedReviewIdRef.current === activeReviewId) return;
    lastFittedReviewIdRef.current = activeReviewId;
    const raf = requestAnimationFrame(() => {
      if (!viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const fit = Math.max(0.05, Math.min((rect.width - 96) / SVG_CANVAS_SIZE, (rect.height - 96) / SVG_CANVAS_SIZE, 1));
      zoomRef.current = fit;
      panRef.current = {
        x: (rect.width - SVG_CANVAS_SIZE * fit) / 2,
        y: (rect.height - SVG_CANVAS_SIZE * fit) / 2,
      };
      applyTransform();
    });
    return () => cancelAnimationFrame(raf);
  }, [activeReviewId, svgText, applyTransform]);

  // Keep the direct DOM transform in sync after React re-renders
  // (asset change, delete/undo, canvas switch) without extra renders.
  useEffect(() => {
    applyTransform();
  }, [svgText, activeReviewId, applyTransform]);

  // Apply selection highlights without scanning the whole SVG each time.
  useEffect(() => {
    for (const el of highlightedElsRef.current) {
      el.classList.remove("svg-layer-selected", "svg-layer-multi-selected");
    }
    highlightedElsRef.current = [];
    const container = viewportRef.current;
    if (!container) return;
    const svgEl = container.querySelector("svg");
    if (!svgEl) return;
    const next: Element[] = [];
    for (const id of reviewSelectedLayerIds) {
      // CSS.escape guards against special chars in generated ids.
      const el = svgEl.querySelector(`[data-layer-id="${CSS.escape(id)}"]`);
      if (el) {
        el.classList.add("svg-layer-multi-selected");
        next.push(el);
      }
    }
    if (reviewSelectedLayerId) {
      const el = svgEl.querySelector(`[data-layer-id="${CSS.escape(reviewSelectedLayerId)}"]`);
      if (el) {
        el.classList.add("svg-layer-selected");
        if (!next.includes(el)) next.push(el);
      }
    }
    highlightedElsRef.current = next;
  }, [reviewSelectedLayerId, reviewSelectedLayerIds, svgText]);

  const getLayerIdFromTarget = useCallback((target: EventTarget | null) => {
    const el = target as Element | null;
    if (!el || typeof (el as Element).getAttribute !== "function") return null;
    const direct = (el as Element).getAttribute?.("data-layer-id");
    if (direct) return direct;
    return (el as Element).closest?.("[data-layer-id]")?.getAttribute("data-layer-id") || null;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.isPrimary === false) return;
      // Only left button / touch / pen. Allow middle-button pan as well.
      if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 1) return;

      if (reviewSelectionMode === "area-subtract" && (e.pointerType !== "mouse" || e.button === 0)) {
        dragRef.current = {
          active: true,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          startPanX: panRef.current.x,
          startPanY: panRef.current.y,
          moved: false,
          downLayerId: null,
          button: e.button,
          marquee: true,
        };
        if (marqueeRef.current) {
          marqueeRef.current.style.display = "block";
          marqueeRef.current.style.left = "0px";
          marqueeRef.current.style.top = "0px";
          marqueeRef.current.style.width = "0px";
          marqueeRef.current.style.height = "0px";
        }
        return;
      }

      // Capture the layer under the pointer BEFORE any pointer-capture retargeting.
      const downLayerId = getLayerIdFromTarget(e.target);
      dragRef.current = {
        active: true,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
        moved: false,
        downLayerId,
        button: e.button,
        marquee: false,
      };
      setViewportCursor(true);
      // NOTE: capture is deferred until the pointer moves past the click
      // threshold, so clicks keep their native target for selection.
    },
    [getLayerIdFromTarget, setViewportCursor, reviewSelectionMode],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.active || e.pointerId !== drag.pointerId) return;
      if (drag.marquee) {
        // 4px threshold: below = no-op, above = draw the rectangle.
        if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 4) {
          drag.moved = true;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // ignore - capture is best-effort
          }
        }
        if (!drag.moved) return;
        updateMarqueeRect(drag.startX, drag.startY, e.clientX, e.clientY);
        return;
      }
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      // 4px threshold: below = click/select, above = pan.
      if (!drag.moved && Math.hypot(dx, dy) > 4) {
        drag.moved = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore - capture is best-effort
        }
      }
      if (!drag.moved) return;
      panRef.current = { x: drag.startPanX + dx, y: drag.startPanY + dy };
      scheduleTransform();
    },
    [scheduleTransform, updateMarqueeRect],
  );

  const endPointerDrag = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.active || e.pointerId !== drag.pointerId) return;
      drag.active = false;
      setViewportCursor(false);
      try {
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
      if (drag.marquee) {
        hideMarquee();
        // Treat as click/select when the pointer barely moved.
        if (drag.moved && e.type !== "pointercancel") {
          applyAreaDeselect(drag.startX, drag.startY, e.clientX, e.clientY);
        }
        return;
      }
      // Treat as click/select when the pointer barely moved.
      if (!drag.moved && drag.button === 0 && e.type !== "pointercancel") {
        let layerId = drag.downLayerId;
        if (!layerId && typeof document !== "undefined" && typeof document.elementFromPoint === "function") {
          try {
            const elAtPoint = document.elementFromPoint(e.clientX, e.clientY);
            layerId = getLayerIdFromTarget(elAtPoint);
          } catch {
            // ignore
          }
        }
        if (!layerId) layerId = getLayerIdFromTarget(e.target);
        if (!layerId) return;
        if (reviewPickColorMode) {
          pickReviewColor(layerId);
          return;
        }
        if (reviewSelectionMode === "subtract") deselectReviewLayer(layerId);
        else if (reviewSelectionMode === "area-subtract") {
          // A click without drag never deselects in area mode; ignore it.
          return;
        }
        else if (e.ctrlKey || e.metaKey || e.shiftKey) toggleReviewLayer(layerId);
        else selectReviewLayer(layerId);
      }
    },
    [getLayerIdFromTarget, selectReviewLayer, setViewportCursor, toggleReviewLayer, deselectReviewLayer, reviewSelectionMode, reviewPickColorMode, pickReviewColor, hideMarquee, applyAreaDeselect],
  );

  // Esc exits the color picker so a stray pipette cannot swallow later clicks.
  useEffect(() => {
    if (!reviewPickColorMode && reviewSelectionMode !== "area-subtract") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (reviewPickColorMode) setReviewPickColorMode(false);
      if (reviewSelectionMode === "area-subtract") setReviewSelectionMode("select");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reviewPickColorMode, reviewSelectionMode, setReviewPickColorMode, setReviewSelectionMode]);

  // Leaving area mode always drops any half-drawn marquee.
  useEffect(() => {
    if (reviewSelectionMode === "area-subtract") return;
    hideMarquee();
    dragRef.current.marquee = false;
    dragRef.current.active = false;
  }, [reviewSelectionMode, hideMarquee]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      // Delta-based factor: small trackpad deltas zoom smoothly,
      // large mouse-wheel notches keep the previous snappy feel.
      const sensitivity = e.ctrlKey ? 0.01 : 0.0016;
      let factor = Math.exp(-e.deltaY * sensitivity);
      // Clamp per-event jump so a fast flick never jumps wildly.
      if (factor > 1.25) factor = 1.25;
      else if (factor < 0.8) factor = 0.8;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const prevZoom = zoomRef.current;
      const clamped = Math.max(0.05, Math.min(prevZoom * factor, 8));
      if (clamped === prevZoom) return;
      const scale = clamped / prevZoom;
      const prevPan = panRef.current;
      panRef.current = {
        x: mouseX - (mouseX - prevPan.x) * scale,
        y: mouseY - (mouseY - prevPan.y) * scale,
      };
      zoomRef.current = clamped;
      scheduleTransform();
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [scheduleTransform]);

  const fitView = useCallback(() => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const fit = Math.max(0.05, Math.min((rect.width - 96) / SVG_CANVAS_SIZE, (rect.height - 96) / SVG_CANVAS_SIZE, 1));
    zoomRef.current = fit;
    panRef.current = {
      x: (rect.width - SVG_CANVAS_SIZE * fit) / 2,
      y: (rect.height - SVG_CANVAS_SIZE * fit) / 2,
    };
    scheduleTransform();
  }, [scheduleTransform]);

  const zoomBy = useCallback(
    (factor: number) => {
      const el = viewportRef.current;
      const rect = el?.getBoundingClientRect();
      const cx = rect ? rect.width / 2 : 300;
      const cy = rect ? rect.height / 2 : 300;
      zoomAt(zoomRef.current * factor, cx, cy);
    },
    [zoomAt],
  );

  const canvasButtons = [
    { value: "black", label: "Black", icon: Moon },
    { value: "checkerboard", label: "Check", icon: Grid3X3 },
    { value: "white", label: "White", icon: Sun },
  ] as const;

  return (
    <div className="rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col h-full max-h-[720px]">
      {/* Preview toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-wrap">
        <span className="text-[12.5px] font-bold truncate" title={item?.fileName || ""}>
          {item?.fileName || "No asset selected"}
        </span>
        {item && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            auto −{item.autoDeletedCount}
            {item.manualDeletedCount > 0 && ` · manual −${item.manualDeletedCount}`}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <div className="flex items-center gap-0.5 bg-[#191a1e] rounded-md p-0.5 mr-1">
            {canvasButtons.map((b) => (
              <button
                key={b.value}
                title={`${b.label} canvas`}
                onClick={() => updateOptions({ reviewCanvas: b.value })}
                className={cn(
                  "p-1.5 rounded-[5px] transition-all cursor-pointer",
                  reviewCanvas === b.value
                    ? "bg-[#33333a] text-orange-300 shadow-[inset_0_0_0_1px_#45454e]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <b.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
          <button
            onClick={() => zoomBy(1 / 1.15)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span
            ref={zoomLabelRef}
            className="text-[11px] font-semibold tabular-nums w-11 text-center"
          >
            {Math.round(zoomRef.current * 100)}%
          </span>
          <button
            onClick={() => zoomBy(1.15)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={fitView}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Fit to view"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={viewportRef}
        className="relative flex-1 min-h-[420px] overflow-hidden select-none"
        style={{ ...CANVAS_BG[reviewCanvas], cursor: reviewSelectionMode !== "select" || reviewPickColorMode ? "crosshair" : "grab", touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointerDrag}
        onPointerCancel={endPointerDrag}
      >
        {/* Area-deselect marquee rectangle (positioned via direct DOM writes) */}
        <div
          ref={marqueeRef}
          className="pointer-events-none absolute z-10 hidden border-2 border-violet-400 bg-violet-500/20"
          style={{ display: "none" }}
        />
        {svgText ? (
          <div
            ref={transformLayerRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transformOrigin: "top left",
              transform: `translate3d(${panRef.current.x}px, ${panRef.current.y}px, 0) scale(${zoomRef.current})`,
              willChange: "transform",
            }}
          >
            <div
              style={{
                width: SVG_CANVAS_SIZE,
                height: SVG_CANVAS_SIZE,
                background: "transparent",
                boxShadow: "0 2px 24px rgba(0,0,0,0.45)",
                outline: "1px solid rgba(255,255,255,0.15)",
              }}
              dangerouslySetInnerHTML={{ __html: svgText }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-slate-400">Prepare a review queue to start.</p>
          </div>
        )}

        {item?.status === "skipped" && (
          <div className="absolute top-3 left-3 px-3 py-2 rounded-xl bg-amber-500/95 text-white shadow-lg pointer-events-none">
            <p className="text-xs font-bold leading-none">Rejected asset</p>
            <p className="text-[10px] font-medium mt-1 text-white/90">Excluded from export</p>
          </div>
        )}

        {/* Hint */}
        {svgText && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-[calc(100%-24px)] px-3 py-1.5 rounded-full bg-black/60 text-[11px] text-white/90 text-center pointer-events-none">
            {reviewPickColorMode
              ? "Pipette active · click an object to copy its color (selection kept) · Esc to stop"
              : reviewSelectionMode === "area-subtract"
                ? "Area deselect · drag a box over selected objects to release them · Esc to finish"
                : reviewSelectionMode === "subtract"
                  ? "Click selected objects to deselect · other selections are kept · drag to pan"
                  : "Click to select · Ctrl/Cmd or Shift+click to add/remove · drag to pan · scroll to zoom"}
          </div>
        )}
      </div>
    </div>
  );
}
