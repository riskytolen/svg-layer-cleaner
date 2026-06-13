"use client";

import { useState } from "react";
import { Info, FileText, Palette, Eye, Layers, Hash, ListTree, Tag, ArrowUp, Trash2, Lock, Pipette } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SvgLayer } from "@/types/svg";
import { useSvgLayerStore } from "@/store/svgLayerStore";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

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

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-xs font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function ColorSwatch({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded-full border border-border"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs font-mono text-muted-foreground">{color}</span>
    </span>
  );
}

export function LayerDetailPanel() {
  const selectedLayerId = useSvgLayerStore((s) => s.selectedLayerId);
  const layers = useSvgLayerStore((s) => s.layers);
  const deleteLayerById = useSvgLayerStore((s) => s.deleteLayerById);
  const selectSameFillColor = useSvgLayerStore((s) => s.selectSameFillColor);
  const selectSameStrokeColor = useSvgLayerStore((s) => s.selectSameStrokeColor);
  const selectSameFillAndStrokeColor = useSvgLayerStore((s) => s.selectSameFillAndStrokeColor);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
    childCount: number;
  } | null>(null);

  if (!selectedLayerId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Info className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">
          Pilih layer atau object untuk melihat detail.
        </p>
      </div>
    );
  }

  const layer = getLayerById(layers, selectedLayerId);
  if (!layer) return null;

  const isRoot = layer.type === "svg";
  const isLocked = layer.isLocked;
  const deleteDisabled = isRoot || isLocked;
  const hasChildren = layer.children.length > 0;

  const ignoredAttrs = new Set([
    "data-layer-id", "id", "fill", "stroke", "opacity",
    "display", "visibility", "d", "style",
  ]);

  const otherAttrs = Object.entries(layer.attributes).filter(
    ([key]) => !ignoredAttrs.has(key),
  );

  const handleDelete = () => {
    if (deleteDisabled) return;
    if (hasChildren) {
      setConfirmDelete({
        id: layer.id,
        name: layer.name,
        childCount: layer.elementCount ?? layer.children.length,
      });
    } else {
      deleteLayerById(layer.id);
    }
  };

  return (
    <ScrollArea className="h-full px-3 py-3">
      <div className="space-y-3">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate">{layer.name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{layer.tagName}</Badge>
                {layer.elementCount !== undefined && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {layer.elementCount} items
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteDisabled}
              onClick={handleDelete}
              className="shrink-0 h-8"
              title={
                isRoot
                  ? "Root SVG tidak bisa dihapus"
                  : isLocked
                  ? "Object terkunci"
                  : "Hapus object ini"
              }
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete
            </Button>
          </div>
          {isRoot && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Root SVG tidak bisa dihapus.
            </p>
          )}
          {isLocked && (
            <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Object terkunci dan tidak bisa dihapus.
            </p>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Identity */}
        <div className="space-y-0.5">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Tag className="w-3 h-3" /> Identity
          </h4>
          <DetailRow icon={<Hash className="w-3.5 h-3.5" />} label="Data Layer ID" value={layer.id} />
          {layer.elementId && (
            <DetailRow icon={<Hash className="w-3.5 h-3.5" />} label="Element ID" value={layer.elementId} />
          )}
          <DetailRow icon={<ArrowUp className="w-3.5 h-3.5" />} label="Parent ID" value={layer.parentId || "None"} />
          <DetailRow icon={<ListTree className="w-3.5 h-3.5" />} label="Depth" value={layer.depth} />
          <DetailRow icon={<ListTree className="w-3.5 h-3.5" />} label="Index" value={layer.index} />
        </div>

        <div className="border-t border-border" />

        {/* Visual */}
        <div className="space-y-0.5">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Palette className="w-3 h-3" /> Visual
          </h4>
          <DetailRow
            icon={<Palette className="w-3.5 h-3.5" />}
            label="Fill"
            value={layer.fill ? <ColorSwatch color={layer.fill} /> : "None"}
          />
          <DetailRow
            icon={<Palette className="w-3.5 h-3.5" />}
            label="Stroke"
            value={layer.stroke ? <ColorSwatch color={layer.stroke} /> : "None"}
          />
          {layer.opacity && (
            <DetailRow icon={<Eye className="w-3.5 h-3.5" />} label="Opacity" value={layer.opacity} />
          )}
          {layer.display && (
            <DetailRow icon={<Eye className="w-3.5 h-3.5" />} label="Display" value={layer.display} />
          )}
          {layer.visibility && (
            <DetailRow icon={<Eye className="w-3.5 h-3.5" />} label="Visibility" value={layer.visibility} />
          )}
          <DetailRow
            icon={<Eye className="w-3.5 h-3.5" />}
            label="Visible"
            value={layer.isVisible ? "Yes" : "No"}
          />
        </div>

        {/* Same Color Selection */}
        <div className="border-t border-border" />
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Pipette className="w-3 h-3" /> Select Same Color
          </h4>
          {layer.normalizedFill && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-[11px]"
              onClick={() => selectSameFillColor()}
            >
              <Palette className="w-3 h-3 mr-1" />
              Select Same Fill ({layer.normalizedFill})
            </Button>
          )}
          {layer.normalizedStroke && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-[11px]"
              onClick={() => selectSameStrokeColor()}
            >
              <Palette className="w-3 h-3 mr-1" />
              Select Same Stroke ({layer.normalizedStroke})
            </Button>
          )}
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
          {!layer.normalizedFill && !layer.normalizedStroke && (
            <p className="text-[10px] text-muted-foreground italic">
              Object ini tidak memiliki warna untuk dipilih.
            </p>
          )}
        </div>

        {/* Path Data */}
        {layer.pathData && (
          <>
            <div className="border-t border-border" />
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3" /> Path Data
              </h4>
              <p className="text-[11px] font-mono text-muted-foreground bg-muted rounded p-1.5 break-all leading-relaxed">
                {layer.pathData.length > 200
                  ? layer.pathData.slice(0, 200) + "..."
                  : layer.pathData}
              </p>
            </div>
          </>
        )}

        {/* Text Content */}
        {layer.textContent && (
          <>
            <div className="border-t border-border" />
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3" /> Text Content
              </h4>
              <p className="text-xs bg-muted rounded p-1.5">{layer.textContent}</p>
            </div>
          </>
        )}

        {/* Children */}
        {layer.children.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3" /> Children
              </h4>
              <p className="text-xs text-muted-foreground">
                {layer.children.length} child layer(s)
              </p>
              <ul className="text-[11px] text-muted-foreground space-y-0.5 ml-1">
                {layer.children.map((child: any) => (
                  <li key={child.id} className="truncate">
                    {child.name} <span className="text-muted-foreground/60">({child.tagName})</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Attributes */}
        {otherAttrs.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3" /> Attributes ({otherAttrs.length})
              </h4>
              <div className="bg-muted rounded overflow-hidden">
                <table className="w-full text-[11px]">
                  <tbody>
                    {otherAttrs.map(([key, value]) => (
                      <tr key={key} className="border-b border-border/50 last:border-0">
                        <td className="px-1.5 py-1 font-mono text-muted-foreground whitespace-nowrap">{key}</td>
                        <td className="px-1.5 py-1 font-mono text-foreground break-all">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {confirmDelete && (
        <DeleteConfirmDialog
          open
          title={`Hapus ${confirmDelete.childCount > 0 ? "Group" : "Object"}?`}
          description={
            confirmDelete.childCount > 0
              ? `Group "${confirmDelete.name}" memiliki ${confirmDelete.childCount} object di dalamnya. Hapus group beserta semua children?`
              : `Hapus object "${confirmDelete.name}"?`
          }
          confirmText="Hapus"
          onConfirm={() => {
            deleteLayerById(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </ScrollArea>
  );
}
