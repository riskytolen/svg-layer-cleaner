"use client";

import { useState, useEffect, useRef } from "react";
import {
  Undo2,
  Redo2,
  Trash2,
  Download,
  Pipette,
  Sparkles,
  Zap,
  Maximize,
  Eraser,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { useSvgLayerStore } from "@/store/svgLayerStore";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { ExportDialog } from "./ExportDialog";

function ToolDivider() {
  return <div className="w-px h-5 bg-[#3a3a41] mx-1.5 shrink-0" />;
}

export function Toolbar() {
  const svgText = useSvgLayerStore((s) => s.svgText);
  const documentInfo = useSvgLayerStore((s) => s.documentInfo);
  const selectedLayerId = useSvgLayerStore((s) => s.selectedLayerId);
  const selectedLayerIds = useSvgLayerStore((s) => s.selectedLayerIds);
  const history = useSvgLayerStore((s) => s.history);
  const future = useSvgLayerStore((s) => s.future);
  const deleteSelectedLayers = useSvgLayerStore((s) => s.deleteSelectedLayers);
  const undo = useSvgLayerStore((s) => s.undo);
  const redo = useSvgLayerStore((s) => s.redo);
  const uploadSvg = useSvgLayerStore((s) => s.uploadSvg);
  const selectSameFillColor = useSvgLayerStore((s) => s.selectSameFillColor);
  const selectSameStrokeColor = useSvgLayerStore((s) => s.selectSameStrokeColor);
  const selectSameFillAndStrokeColor = useSvgLayerStore((s) => s.selectSameFillAndStrokeColor);
  const cleanSvg = useSvgLayerStore((s) => s.cleanSvg);
  const removeWhiteBackground = useSvgLayerStore((s) => s.removeWhiteBackground);
  const resetCleanOptions = useSvgLayerStore((s) => s.resetCleanOptions);
  const normalizeCurrentSvgTo2500 = useSvgLayerStore((s) => s.normalizeCurrentSvgTo2500);
  const isExporting = useSvgLayerStore((s) => s.isExporting);
  const [confirmMultiDelete, setConfirmMultiDelete] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const colorMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showColorMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (colorMenuRef.current && !colorMenuRef.current.contains(e.target as Node)) {
        setShowColorMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColorMenu]);

  const canDelete = selectedLayerIds.length > 0;
  const canUndo = history.length > 0;
  const canRedo = future.length > 0;
  const canSelectColor = !!selectedLayerId;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadSvg(file);
    e.target.value = "";
  };

  const handleDeleteClick = () => {
    if (!canDelete) return;
    if (selectedLayerIds.length > 1) {
      setConfirmMultiDelete(true);
    } else {
      deleteSelectedLayers();
    }
  };

  return (
    <>
      <div className="h-11 bg-[#1d1d21] border-b border-[#35353b] flex items-center px-2.5 shrink-0 gap-1.5 overflow-x-auto">
        {/* Document identity */}
        <div className="flex items-center gap-2 min-w-0 max-w-[240px]">
          <span className="text-xs font-semibold text-foreground/80 truncate" title={documentInfo?.fileName || ""}>
            {documentInfo ? documentInfo.fileName : "No document"}
          </span>
          {selectedLayerIds.length > 0 && (
            <Badge
              variant="secondary"
              className="shrink-0 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] px-1.5 py-0 h-[18px]"
            >
              {selectedLayerIds.length} sel
            </Badge>
          )}
        </div>

        <ToolDivider />

        {/* History */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
            disabled={!canUndo}
            onClick={undo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
            disabled={!canRedo}
            onClick={redo}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        <ToolDivider />

        {/* Select same color */}
        <div className="relative" ref={colorMenuRef}>
          <Button
            variant="outline"
            size="sm"
            disabled={!canSelectColor}
            onClick={() => setShowColorMenu(!showColorMenu)}
            className="h-7 border-[#3f3f47] bg-transparent hover:bg-white/5 hover:text-foreground text-[12px] font-medium px-2.5"
            title="Select all objects sharing a color"
          >
            <Pipette className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            Select Color
          </Button>
          {showColorMenu && canSelectColor && (
            <div className="absolute top-full left-0 mt-1 bg-[#2a2a2f] border border-[#43434c] rounded-lg shadow-2xl z-50 py-1 min-w-[190px]">
              <button
                className="w-full px-3 py-1.5 text-xs text-left text-foreground/90 hover:bg-white/5 flex items-center gap-2.5"
                onClick={() => {
                  selectSameFillColor();
                  setShowColorMenu(false);
                }}
              >
                <span className="w-3 h-3 rounded-sm bg-cyan-400/80 border border-cyan-300/50 shrink-0" />
                Select Same Fill
              </button>
              <button
                className="w-full px-3 py-1.5 text-xs text-left text-foreground/90 hover:bg-white/5 flex items-center gap-2.5"
                onClick={() => {
                  selectSameStrokeColor();
                  setShowColorMenu(false);
                }}
              >
                <span className="w-3 h-3 rounded-sm border-2 border-cyan-400/80 shrink-0" />
                Select Same Stroke
              </button>
              <button
                className="w-full px-3 py-1.5 text-xs text-left text-foreground/90 hover:bg-white/5 flex items-center gap-2.5"
                onClick={() => {
                  selectSameFillAndStrokeColor();
                  setShowColorMenu(false);
                }}
              >
                <Pipette className="w-3 h-3 text-cyan-400" />
                Select Same Fill + Stroke
              </button>
            </div>
          )}
        </div>

        <ToolDivider />

        {/* Cleaning tools */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={!svgText}
            onClick={cleanSvg}
            className="h-7 border-[#3f3f47] bg-transparent hover:bg-white/5 hover:text-foreground text-[12px] font-medium px-2.5"
            title="Clean SVG with default options"
          >
            <Zap className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
            Quick Clean
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!svgText}
            onClick={() => removeWhiteBackground("balanced")}
            className="h-7 border-[#3f3f47] bg-transparent hover:bg-white/5 hover:text-foreground text-[12px] font-medium px-2.5"
            title="Remove white background (balanced mode)"
          >
            <Eraser className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
            Remove BG
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
            disabled={!svgText}
            onClick={() => {
              const panel = document.getElementById("clean-svg-panel-trigger");
              if (panel) panel.click();
            }}
            title="Open Clean SVG options"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
            disabled={!svgText}
            onClick={() => {
              const panel = document.getElementById("resize-settings-panel-trigger");
              if (panel) panel.click();
            }}
            title="Open Resize Settings"
          >
            <Maximize className="w-3.5 h-3.5" />
          </Button>
        </div>

        <ToolDivider />

        {/* Delete selection */}
        <Button
          variant="outline"
          size="sm"
          disabled={!canDelete}
          onClick={handleDeleteClick}
          className={cn(
            "h-7 text-[12px] font-semibold px-2.5",
            canDelete
              ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
              : "border-[#3f3f47] bg-transparent text-muted-foreground",
          )}
          title="Delete selected objects (Del)"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Delete
          {canDelete && (
            <span className="ml-1 text-[10px] font-bold tabular-nums">{selectedLayerIds.length}</span>
          )}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {/* Upload */}
          <input
            type="file"
            ref={(el) => {
              if (el) (window as any).__svgFileInput = el;
            }}
            accept=".svg,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-[#3f3f47] bg-transparent hover:bg-white/5 hover:text-foreground text-[12px] font-semibold px-2.5"
            onClick={() => (window as any).__svgFileInput?.click()}
            title="Open an SVG file"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Upload SVG
          </Button>

          {/* Export */}
          <Button
            size="sm"
            className="h-7 bg-orange-600 hover:bg-orange-500 text-white text-[12px] font-bold px-3 shadow-[0_1px_4px_rgba(232,106,31,0.35)]"
            disabled={!svgText || isExporting}
            onClick={() => setShowExportDialog(true)}
            title="Export the cleaned SVG"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {confirmMultiDelete && (
        <DeleteConfirmDialog
          open
          title={`Hapus ${selectedLayerIds.length} object?`}
          description={`Hapus ${selectedLayerIds.length} object yang dipilih?`}
          confirmText="Hapus"
          onConfirm={() => {
            deleteSelectedLayers();
            setConfirmMultiDelete(false);
          }}
          onCancel={() => setConfirmMultiDelete(false)}
        />
      )}

      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </>
  );
}
