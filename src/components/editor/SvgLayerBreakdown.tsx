"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { Toolbar } from "./Toolbar";
import { SvgPreview } from "./SvgPreview";
import { LayerPanel } from "./LayerPanel";
import { LayerDetailPanel } from "./LayerDetailPanel";
import { ColorGroupPanel } from "./ColorGroupPanel";
import { CleanSvgPanel } from "./CleanSvgPanel";
import { CleanSummaryDialog } from "./CleanSummaryDialog";
import { DocumentInfoPanel } from "./DocumentInfoPanel";
import { EmptyState } from "./EmptyState";
import { ResizeSettingsPanel } from "./ResizeSettingsPanel";
import { CanvasControls } from "./CanvasControls";
import { useSvgLayerStore } from "@/store/svgLayerStore";
import { useToast } from "@/components/ui/use-toast";

export function SvgLayerBreakdown() {
  const svgText = useSvgLayerStore((s) => s.svgText);
  const documentInfo = useSvgLayerStore((s) => s.documentInfo);
  const uploadSvg = useSvgLayerStore((s) => s.uploadSvg);
  const deleteSelectedLayers = useSvgLayerStore((s) => s.deleteSelectedLayers);
  const undo = useSvgLayerStore((s) => s.undo);
  const redo = useSvgLayerStore((s) => s.redo);
  const selectedLayerIds = useSvgLayerStore((s) => s.selectedLayerIds);
  const lastActionSummary = useSvgLayerStore((s) => s.lastActionSummary);
  const lastCleanResult = useSvgLayerStore((s) => s.lastCleanResult);
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [showCleanSummary, setShowCleanSummary] = useState(false);

  // Show toast on lastActionSummary change
  useEffect(() => {
    if (!lastActionSummary) return;
    const isError = lastActionSummary.includes("tidak bisa") || lastActionSummary.includes("terkunci");
    toast({
      title: lastActionSummary,
      variant: isError ? "destructive" : "default",
    });
  }, [lastActionSummary, toast]);

  // Show clean summary dialog when clean completes
  useEffect(() => {
    if (lastCleanResult && lastCleanResult.totalRemoved > 0) {
      setShowCleanSummary(true);
    }
  }, [lastCleanResult]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const isInput =
        tagName === "input" ||
        tagName === "textarea" ||
        target.isContentEditable;

      if (isInput) return;

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          deleteSelectedLayers();
        }
      }

      // Ctrl+Z / Cmd+Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z = Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }

      // Ctrl+Y / Cmd+Y = Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLayerIds, deleteSelectedLayers, undo, redo]);

  const handleFile = useCallback(
    async (file: File) => {
      await uploadSvg(file);
      const currentError = useSvgLayerStore.getState().error;
      if (currentError) {
        toast({
          variant: "destructive",
          title: "Upload Gagal",
          description: currentError,
        });
      } else if (useSvgLayerStore.getState().documentInfo) {
        const resizeResult = useSvgLayerStore.getState().resizeResult;
        toast({
          variant: "success",
          title: "Upload Berhasil",
          description: resizeResult?.resized
            ? "SVG resized to 2500x2500 px."
            : "File SVG berhasil dibaca.",
        });
      }
    },
    [uploadSvg, toast],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <div
      className="h-screen flex flex-col bg-background overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Toolbar */}
      <Toolbar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {svgText ? (
          <>
            {/* Left Sidebar - Layer Panel */}
            <aside className="w-80 bg-card border-r border-border flex flex-col shrink-0">
              <div className="px-3 py-2 border-b border-border">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Layers
                </h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <LayerPanel />
              </div>
              <DocumentInfoPanel />
            </aside>

            {/* Center - SVG Preview */}
            <main className="flex-1 overflow-hidden relative preview-viewport">
              <SvgPreview />
              <CanvasControls />
            </main>

            {/* Right Sidebar - Layer Detail + Color Group + Resize + Clean SVG */}
            <aside className="w-80 bg-card border-l border-border flex flex-col shrink-0">
              <div className="flex-1 overflow-hidden border-b border-border">
                <div className="px-3 py-2 border-b border-border">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Layer Details
                  </h2>
                </div>
                <LayerDetailPanel />
              </div>
              <div className="flex-1 overflow-hidden border-b border-border">
                <div className="px-3 py-2 border-b border-border">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Color Selection
                  </h2>
                </div>
                <ColorGroupPanel />
              </div>
              <div className="flex-none overflow-hidden border-b border-border">
                <div
                  id="resize-settings-panel-trigger"
                  className="px-3 py-2 border-b border-border cursor-pointer"
                >
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Canvas Size
                  </h2>
                </div>
                <ResizeSettingsPanel />
              </div>
              <div className="flex-1 overflow-hidden">
                <CleanSvgPanel />
              </div>
            </aside>
          </>
        ) : (
          <main
            className="flex-1 flex items-center justify-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <EmptyState />
          </main>
        )}
      </div>

      {/* Clean Summary Dialog */}
      <CleanSummaryDialog
        open={showCleanSummary}
        result={lastCleanResult}
        onClose={() => setShowCleanSummary(false)}
      />
    </div>
  );
}
