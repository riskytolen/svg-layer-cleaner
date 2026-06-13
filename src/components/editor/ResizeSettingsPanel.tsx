"use client";

import { useSvgLayerStore } from "@/store/svgLayerStore";
import { Button } from "@/components/ui/button";
import { Maximize } from "lucide-react";

export function ResizeSettingsPanel() {
  const resizeOptions = useSvgLayerStore((s) => s.resizeOptions);
  const resizeResult = useSvgLayerStore((s) => s.resizeResult);
  const autoResizeOnUpload = useSvgLayerStore((s) => s.autoResizeOnUpload);
  const toggleAutoResizeOnUpload = useSvgLayerStore((s) => s.toggleAutoResizeOnUpload);
  const normalizeCurrentSvgTo2500 = useSvgLayerStore((s) => s.normalizeCurrentSvgTo2500);

  return (
    <div className="p-3 space-y-3 text-xs">
      <div className="flex items-center gap-2 mb-2">
        <Maximize className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Canvas Size</h3>
      </div>

      <p className="text-muted-foreground">
        SVG canvas is normalized to {resizeOptions.targetWidth} x {resizeOptions.targetHeight} px.
      </p>

      {/* Target Size */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-muted-foreground text-[11px]">Width</label>
          <div className="bg-muted rounded px-2 py-1 font-mono">
            {resizeOptions.targetWidth}
          </div>
        </div>
        <div>
          <label className="text-muted-foreground text-[11px]">Height</label>
          <div className="bg-muted rounded px-2 py-1 font-mono">
            {resizeOptions.targetHeight}
          </div>
        </div>
      </div>

      {/* Mode */}
      <div>
        <label className="text-muted-foreground text-[11px]">Mode</label>
        <div className="bg-muted rounded px-2 py-1 font-mono capitalize">
          {resizeOptions.mode}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Preserve aspect ratio</span>
          <span className="font-mono">{resizeOptions.preserveAspectRatio ? "Yes" : "No"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Center artwork</span>
          <span className="font-mono">{resizeOptions.center ? "Yes" : "No"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Padding</span>
          <span className="font-mono">{resizeOptions.padding}px</span>
        </div>
      </div>

      {/* Auto resize toggle */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-muted-foreground text-[11px]">Auto resize on upload</span>
        <button
          onClick={() => toggleAutoResizeOnUpload(!autoResizeOnUpload)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            autoResizeOnUpload ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              autoResizeOnUpload ? "translate-x-4.5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Apply button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full h-8"
        onClick={normalizeCurrentSvgTo2500}
      >
        <Maximize className="w-3.5 h-3.5 mr-1.5" />
        Apply 2500x2500 Canvas
      </Button>

      {/* Last resize info */}
      {resizeResult && resizeResult.resized && (
        <div className="bg-muted/50 rounded p-2 space-y-1 text-[11px] font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Original</span>
            <span>{resizeResult.oldWidth || "?"} x {resizeResult.oldHeight || "?"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">New</span>
            <span>{resizeResult.newWidth} x {resizeResult.newHeight}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Scale</span>
            <span>{resizeResult.scale.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Translate</span>
            <span>{resizeResult.translateX.toFixed(1)}, {resizeResult.translateY.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
