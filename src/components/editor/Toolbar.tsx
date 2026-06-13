"use client";

import { useState, useEffect, useRef } from "react";
import {
  Layers,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Pipette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSvgLayerStore } from "@/store/svgLayerStore";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

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
  const [confirmMultiDelete, setConfirmMultiDelete] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
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
      <div className="h-10 bg-card border-b border-border flex items-center px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">
            SVG Layer Cleaner
          </h1>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          {svgText && (
            <>
              {/* Undo/Redo */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={!canUndo}
                onClick={undo}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={!canRedo}
                onClick={redo}
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </Button>

              <div className="w-px h-5 bg-border mx-1" />

              {/* Select Same Color */}
              <div className="relative" ref={colorMenuRef}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canSelectColor}
                  onClick={() => setShowColorMenu(!showColorMenu)}
                  className="h-7"
                  title="Select Same Color"
                >
                  <Pipette className="w-3.5 h-3.5 mr-1" />
                  Select Color
                </Button>
                {showColorMenu && canSelectColor && (
                  <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 py-1 min-w-[180px]">
                    <button
                      className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted flex items-center gap-2"
                      onClick={() => {
                        selectSameFillColor();
                        setShowColorMenu(false);
                      }}
                    >
                      <span className="w-3 h-3 rounded border border-border" style={{ backgroundColor: "#ccc" }} />
                      Select Same Fill
                    </button>
                    <button
                      className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted flex items-center gap-2"
                      onClick={() => {
                        selectSameStrokeColor();
                        setShowColorMenu(false);
                      }}
                    >
                      <span className="w-3 h-3 rounded border-2 border-current" />
                      Select Same Stroke
                    </button>
                    <button
                      className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted flex items-center gap-2"
                      onClick={() => {
                        selectSameFillAndStrokeColor();
                        setShowColorMenu(false);
                      }}
                    >
                      <Pipette className="w-3 h-3" />
                      Select Same Fill + Stroke
                    </button>
                  </div>
                )}
              </div>

              <div className="w-px h-5 bg-border mx-1" />

              {/* Delete selected */}
              <Button
                variant="destructive"
                size="sm"
                disabled={!canDelete}
                onClick={handleDeleteClick}
                className="h-7"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
                {canDelete && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-4 bg-destructive/20">
                    {selectedLayerIds.length}
                  </Badge>
                )}
              </Button>
            </>
          )}

          <div className="w-px h-5 bg-border mx-1" />

          {/* File info */}
          {documentInfo && (
            <span className="text-xs text-muted-foreground mr-2 max-w-[200px] truncate">
              {documentInfo.fileName}
            </span>
          )}

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
            variant="default"
            size="sm"
            className="h-7"
            onClick={() => (window as any).__svgFileInput?.click()}
          >
            <Layers className="w-3.5 h-3.5 mr-1" />
            Upload SVG
          </Button>

          {/* Placeholder buttons */}
          <Button variant="outline" size="sm" disabled title="Coming soon" className="h-7">
            <Download className="w-3.5 h-3.5 mr-1" />
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
    </>
  );
}
