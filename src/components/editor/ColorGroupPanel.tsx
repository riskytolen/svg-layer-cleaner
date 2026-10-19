"use client";

import { Info, Palette, Pipette, Trash2, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SvgLayer } from "@/types/svg";
import { useSvgLayerStore } from "@/store/svgLayerStore";

function getLayerById(layers: SvgLayer[], id: string): SvgLayer | null {
  for (const layer of layers) {
    if (layer.id === id) return layer;
    if (layer.children.length > 0) {
      const found = getLayerById(layer.children, id);
      if (found) return found;
    }
  }
  return null;
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-5 h-5 rounded border border-border shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-mono font-medium truncate">{color}</p>
      </div>
    </div>
  );
}

export function ColorGroupPanel() {
  const selectedLayerId = useSvgLayerStore((s) => s.selectedLayerId);
  const selectedLayerIds = useSvgLayerStore((s) => s.selectedLayerIds);
  const layers = useSvgLayerStore((s) => s.layers);
  const sameColorResult = useSvgLayerStore((s) => s.sameColorResult);
  const selectSameFillColor = useSvgLayerStore((s) => s.selectSameFillColor);
  const selectSameStrokeColor = useSvgLayerStore((s) => s.selectSameStrokeColor);
  const selectSameFillAndStrokeColor = useSvgLayerStore((s) => s.selectSameFillAndStrokeColor);
  const clearSameColorResult = useSvgLayerStore((s) => s.clearSameColorResult);
  const deleteSelectedLayers = useSvgLayerStore((s) => s.deleteSelectedLayers);
  const clearSelection = useSvgLayerStore((s) => s.clearSelection);

  const layer = selectedLayerId ? getLayerById(layers, selectedLayerId) : null;

  return (
    <ScrollArea className="h-full px-3 py-3">
      <div className="space-y-3">
        {/* Same Color Selection Header */}
        <div>
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Pipette className="w-3 h-3" /> Select Same Color
          </h4>
        </div>

        {!layer ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Info className="w-6 h-6 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">
              Pilih object untuk menggunakan fitur select same color.
            </p>
          </div>
        ) : (
          <>
            {/* Fill Color */}
            {layer.normalizedFill ? (
              <div className="space-y-1.5">
                <ColorSwatch color={layer.normalizedFill} label="Fill Color" />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-[11px]"
                  onClick={() => selectSameFillColor()}
                >
                  <Palette className="w-3 h-3 mr-1" />
                  Select Same Fill
                </Button>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic">
                Object ini tidak memiliki fill color.
              </p>
            )}

            {/* Stroke Color */}
            {layer.normalizedStroke ? (
              <div className="space-y-1.5">
                <ColorSwatch color={layer.normalizedStroke} label="Stroke Color" />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-[11px]"
                  onClick={() => selectSameStrokeColor()}
                >
                  <Palette className="w-3 h-3 mr-1" />
                  Select Same Stroke
                </Button>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic">
                Object ini tidak memiliki stroke color.
              </p>
            )}

            {/* Select Same Fill + Stroke */}
            {layer.normalizedFill && layer.normalizedStroke && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-[11px]"
                onClick={() => selectSameFillAndStrokeColor()}
              >
                <Pipette className="w-3 h-3 mr-1" />
                Select Same Fill + Stroke
              </Button>
            )}

            {/* Result */}
            {sameColorResult && (
              <div className="border-t border-border pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium">
                    {sameColorResult.count} objects selected
                  </p>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {sameColorResult.mode}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Ctrl/Cmd or Shift+click an object to deselect it without clearing the others.
                  You can also uncheck it in the layer list.
                </p>

                {sameColorResult.color && (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded border border-border shrink-0"
                      style={{
                        backgroundColor:
                          sameColorResult.mode === "fill"
                            ? sameColorResult.color
                            : sameColorResult.mode === "stroke"
                            ? "transparent"
                            : sameColorResult.color,
                        borderColor:
                          sameColorResult.mode === "stroke"
                            ? sameColorResult.color
                            : undefined,
                      }}
                    />
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {sameColorResult.color}
                    </span>
                  </div>
                )}

                <div className="flex gap-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 h-7 text-[11px]"
                    onClick={deleteSelectedLayers}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => {
                      clearSelection();
                      clearSameColorResult();
                    }}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}
