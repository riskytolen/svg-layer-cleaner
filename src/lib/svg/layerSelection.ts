export type LayerSelection = {
  selectedLayerId: string | null;
  selectedLayerIds: readonly string[];
};

/** Adjust selection only; never mutate the SVG or the previous selection. */
export function adjustLayerSelection(
  selection: LayerSelection,
  layerId: string,
  mode: "toggle" | "remove" = "toggle",
): { selectedLayerId: string | null; selectedLayerIds: string[] } {
  const isSelected = selection.selectedLayerIds.includes(layerId);
  const ids = isSelected
    ? selection.selectedLayerIds.filter((id) => id !== layerId)
    : mode === "toggle"
      ? [...selection.selectedLayerIds, layerId]
      : [...selection.selectedLayerIds];

  // The active object must always belong to the remaining selection.
  const activeId = selection.selectedLayerId;
  return {
    selectedLayerId: activeId && ids.includes(activeId) ? activeId : ids[0] ?? null,
    selectedLayerIds: ids,
  };
}
