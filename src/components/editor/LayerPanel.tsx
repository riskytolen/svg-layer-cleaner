"use client";

import { useState } from "react";
import { Search, Layers } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSvgLayerStore } from "@/store/svgLayerStore";
import { LayerTreeItem } from "./LayerTreeItem";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

export function LayerPanel() {
  const layers = useSvgLayerStore((s) => s.layers);
  const selectedLayerId = useSvgLayerStore((s) => s.selectedLayerId);
  const selectedLayerIds = useSvgLayerStore((s) => s.selectedLayerIds);
  const selectLayer = useSvgLayerStore((s) => s.selectLayer);
  const toggleLayerSelection = useSvgLayerStore((s) => s.toggleLayerSelection);
  const deleteLayerById = useSvgLayerStore((s) => s.deleteLayerById);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
    childCount: number;
  } | null>(null);

  if (layers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Layers className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">
          Upload SVG untuk melihat layer
        </p>
      </div>
    );
  }

  const filterLayers = (layerList: typeof layers, query: string): typeof layers => {
    if (!query.trim()) return layerList;
    const lower = query.toLowerCase();
    return layerList
      .map((layer) => ({
        ...layer,
        children: filterLayers(layer.children, query),
      }))
      .filter(
        (layer) =>
          layer.name.toLowerCase().includes(lower) ||
          layer.tagName.toLowerCase().includes(lower) ||
          layer.type.toLowerCase().includes(lower) ||
          filterLayers(layer.children, query).length > 0,
      );
  };

  const filteredLayers = search ? filterLayers(layers, search) : layers;

  return (
    <div className="flex flex-col h-full">
      <div className="relative px-3 pt-3 pb-2">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Cari layer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {selectedLayerIds.length > 0 && (
        <div className="px-3 pb-2">
          <p className="text-[10px] text-muted-foreground">
            {selectedLayerIds.length} selected
          </p>
        </div>
      )}

      <ScrollArea className="flex-1 px-2 pb-2">
        {filteredLayers.map((layer) => (
          <LayerTreeItem
            key={layer.id}
            layer={layer}
            selectedId={selectedLayerId}
            selectedIds={selectedLayerIds}
            onSelect={selectLayer}
            onToggleSelect={toggleLayerSelection}
            onDelete={deleteLayerById}
            onDeleteConfirm={(id, name, childCount) =>
              setConfirmDelete({ id, name, childCount })
            }
          />
        ))}
      </ScrollArea>

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
    </div>
  );
}
