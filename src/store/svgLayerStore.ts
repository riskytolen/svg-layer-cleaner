"use client";

import { create } from "zustand";
import { SvgLayer, SvgLayerStore } from "@/types/svg";
import {
  parseSvg,
  validateSvgFile,
  buildLayerTree,
  getSvgDocumentInfo,
  deleteElementsByLayerIds,
  serializeSvg,
  collectChildIds,
  findElementsBySameFillColor,
  findElementsBySameStrokeColor,
  findElementsBySameFillAndStrokeColor,
} from "@/lib/svg";
import { normalizeColor } from "@/lib/utils/colorUtils";

function updateLayerSelection(layers: SvgLayer[], selectedId: string | null): SvgLayer[] {
  return layers.map((layer) => ({
    ...layer,
    isSelected: layer.id === selectedId,
    children: updateLayerSelection(layer.children, selectedId),
  }));
}

function rebuildFromDoc(doc: Document) {
  const layers = buildLayerTree(doc);
  const svgText = serializeSvg(doc);
  return { layers, svgText };
}

export const useSvgLayerStore = create<SvgLayerStore>((set, get) => ({
  svgText: null,
  svgDocument: null,
  layers: [],
  selectedLayerId: null,
  selectedLayerIds: [],
  documentInfo: null,
  isLoading: false,
  error: null,
  history: [],
  future: [],
  lastActionSummary: null,
  sameColorResult: null,

  uploadSvg: async (file: File) => {
    set({ isLoading: true, error: null });

    const validationError = validateSvgFile(file);
    if (validationError) {
      set({ isLoading: false, error: validationError });
      return;
    }

    try {
      const text = await file.text();
      get().parseSvgText(text, file.name, file.size);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membaca file SVG.";
      set({ isLoading: false, error: message });
    }
  },

  parseSvgText: (svgText: string, fileName: string, fileSize: number) => {
    try {
      const doc = parseSvg(svgText);
      const layers = buildLayerTree(doc);
      const documentInfo = getSvgDocumentInfo(doc, fileName, fileSize);

      set({
        svgText,
        svgDocument: doc,
        layers,
        selectedLayerId: null,
        selectedLayerIds: [],
        documentInfo,
        sameColorResult: null,
        history: [],
        future: [],
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memproses file SVG.";
      set({ isLoading: false, error: message });
    }
  },

  selectLayer: (layerId: string) => {
    const state = get();
    const newId = state.selectedLayerId === layerId ? null : layerId;
    set({
      selectedLayerId: newId,
      selectedLayerIds: newId ? [newId] : [],
      layers: updateLayerSelection(state.layers, newId),
    });
  },

  toggleLayerSelection: (layerId: string) => {
    const state = get();
    const ids = state.selectedLayerIds.includes(layerId)
      ? state.selectedLayerIds.filter((id) => id !== layerId)
      : [...state.selectedLayerIds, layerId];

    set({
      selectedLayerIds: ids,
      selectedLayerId: ids.length === 1 ? ids[0] : state.selectedLayerId,
    });
  },

  selectMultipleLayers: (layerIds: string[]) => {
    set({
      selectedLayerIds: layerIds,
      selectedLayerId: layerIds.length === 1 ? layerIds[0] : null,
    });
  },

  clearSelection: () => {
    set({
      selectedLayerId: null,
      selectedLayerIds: [],
      sameColorResult: null,
      layers: updateLayerSelection(get().layers, null),
    });
  },

  deleteSelectedLayers: () => {
    const state = get();
    if (!state.svgDocument) return;

    const idsToDelete = [...state.selectedLayerIds];
    if (idsToDelete.length === 0) return;

    // Save history before mutation
    const svgTextBefore = serializeSvg(state.svgDocument);

    // Deduplicate: remove child ids if parent is already being deleted
    const uniqueIds: string[] = [];
    for (const id of idsToDelete) {
      const el = state.svgDocument.querySelector(`[data-layer-id="${id}"]`);
      if (!el) continue;

      let dominated = false;
      for (const otherId of idsToDelete) {
        if (otherId === id) continue;
        const otherEl = state.svgDocument.querySelector(`[data-layer-id="${otherId}"]`);
        if (otherEl && otherEl.contains(el)) {
          dominated = true;
          break;
        }
      }
      if (!dominated) uniqueIds.push(id);
    }

    const result = deleteElementsByLayerIds(state.svgDocument, uniqueIds);

    if (result.deletedCount === 0) {
      if (result.skippedRootCount > 0) {
        set({ lastActionSummary: "Root SVG tidak bisa dihapus." });
      } else if (result.skippedLockedCount > 0) {
        set({ lastActionSummary: "Object terkunci dan tidak bisa dihapus." });
      }
      return;
    }

    const { layers, svgText } = rebuildFromDoc(state.svgDocument);
    const docInfo = state.documentInfo
      ? getSvgDocumentInfo(state.svgDocument, state.documentInfo.fileName, state.documentInfo.fileSize)
      : null;

    set({
      svgText,
      layers,
      documentInfo: docInfo,
      selectedLayerId: null,
      selectedLayerIds: [],
      history: [...state.history, svgTextBefore],
      future: [],
      lastActionSummary:
        result.deletedCount === 1
          ? "1 object deleted."
          : `${result.deletedCount} objects deleted.` +
            (result.skippedCount > 0 ? ` ${result.skippedCount} skipped.` : ""),
    });
  },

  deleteLayerById: (layerId: string) => {
    const state = get();
    if (!state.svgDocument) return;

    const svgTextBefore = serializeSvg(state.svgDocument);

    const el = state.svgDocument.querySelector(`[data-layer-id="${layerId}"]`);
    if (!el) {
      set({ lastActionSummary: "Object not found." });
      return;
    }

    if (el === state.svgDocument.documentElement) {
      set({ lastActionSummary: "Root SVG tidak bisa dihapus." });
      return;
    }

    if (el.getAttribute("data-locked") === "true") {
      set({ lastActionSummary: "Object terkunci dan tidak bisa dihapus." });
      return;
    }

    const childCount = el.tagName.toLowerCase() === "g" ? collectChildIds(state.svgDocument, layerId).length : 0;
    el.parentNode?.removeChild(el);

    const { layers, svgText } = rebuildFromDoc(state.svgDocument);
    const docInfo = state.documentInfo
      ? getSvgDocumentInfo(state.svgDocument, state.documentInfo.fileName, state.documentInfo.fileSize)
      : null;

    const wasSelected = state.selectedLayerId === layerId || state.selectedLayerIds.includes(layerId);

    set({
      svgText,
      layers,
      documentInfo: docInfo,
      selectedLayerId: wasSelected ? null : state.selectedLayerId,
      selectedLayerIds: wasSelected ? [] : state.selectedLayerIds.filter((id) => id !== layerId),
      history: [...state.history, svgTextBefore],
      future: [],
      lastActionSummary:
        childCount > 0
          ? `Group deleted with ${childCount} child objects.`
          : "1 object deleted.",
    });
  },

  undo: () => {
    const state = get();
    if (state.history.length === 0 || !state.svgDocument || !state.documentInfo) return;

    const currentSvgText = serializeSvg(state.svgDocument);
    const previousSvgText = state.history[state.history.length - 1];

    const doc = parseSvg(previousSvgText);
    const { layers } = rebuildFromDoc(doc);
    const docInfo = getSvgDocumentInfo(doc, state.documentInfo.fileName, state.documentInfo.fileSize);

    set({
      svgDocument: doc,
      svgText: previousSvgText,
      layers,
      documentInfo: docInfo,
      selectedLayerId: null,
      selectedLayerIds: [],
      history: state.history.slice(0, -1),
      future: [...state.future, currentSvgText],
      lastActionSummary: "Undo successful.",
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0 || !state.svgDocument || !state.documentInfo) return;

    const currentSvgText = serializeSvg(state.svgDocument);
    const nextSvgText = state.future[state.future.length - 1];

    const doc = parseSvg(nextSvgText);
    const { layers } = rebuildFromDoc(doc);
    const docInfo = getSvgDocumentInfo(doc, state.documentInfo.fileName, state.documentInfo.fileSize);

    set({
      svgDocument: doc,
      svgText: nextSvgText,
      layers,
      documentInfo: docInfo,
      selectedLayerId: null,
      selectedLayerIds: [],
      history: [...state.history, currentSvgText],
      future: state.future.slice(0, -1),
      lastActionSummary: "Redo successful.",
    });
  },

  selectSameFillColor: (sourceLayerId?: string) => {
    const state = get();
    if (!state.svgDocument) return;

    const activeId = sourceLayerId || state.selectedLayerId;
    if (!activeId) {
      set({ lastActionSummary: "Please select an object first." });
      return;
    }

    const sourceEl = state.svgDocument.querySelector(`[data-layer-id="${activeId}"]`);
    if (!sourceEl) {
      set({ lastActionSummary: "Object not found." });
      return;
    }

    const fill = sourceEl.getAttribute("fill") || null;
    const normalizedFill = normalizeColor(fill);

    if (!normalizedFill) {
      set({ lastActionSummary: "Selected object has no fill color." });
      return;
    }

    const ids = findElementsBySameFillColor(state.svgDocument, activeId);
    if (ids.length === 0) {
      set({ lastActionSummary: "No matching objects found." });
      return;
    }

    set({
      selectedLayerIds: ids,
      selectedLayerId: activeId,
      sameColorResult: {
        mode: "fill",
        color: normalizedFill,
        count: ids.length,
      },
      lastActionSummary: `${ids.length} objects with fill ${normalizedFill} selected.`,
    });
  },

  selectSameStrokeColor: (sourceLayerId?: string) => {
    const state = get();
    if (!state.svgDocument) return;

    const activeId = sourceLayerId || state.selectedLayerId;
    if (!activeId) {
      set({ lastActionSummary: "Please select an object first." });
      return;
    }

    const sourceEl = state.svgDocument.querySelector(`[data-layer-id="${activeId}"]`);
    if (!sourceEl) {
      set({ lastActionSummary: "Object not found." });
      return;
    }

    const stroke = sourceEl.getAttribute("stroke") || null;
    const normalizedStroke = normalizeColor(stroke);

    if (!normalizedStroke) {
      set({ lastActionSummary: "Selected object has no stroke color." });
      return;
    }

    const ids = findElementsBySameStrokeColor(state.svgDocument, activeId);
    if (ids.length === 0) {
      set({ lastActionSummary: "No matching objects found." });
      return;
    }

    set({
      selectedLayerIds: ids,
      selectedLayerId: activeId,
      sameColorResult: {
        mode: "stroke",
        color: normalizedStroke,
        count: ids.length,
      },
      lastActionSummary: `${ids.length} objects with stroke ${normalizedStroke} selected.`,
    });
  },

  selectSameFillAndStrokeColor: (sourceLayerId?: string) => {
    const state = get();
    if (!state.svgDocument) return;

    const activeId = sourceLayerId || state.selectedLayerId;
    if (!activeId) {
      set({ lastActionSummary: "Please select an object first." });
      return;
    }

    const sourceEl = state.svgDocument.querySelector(`[data-layer-id="${activeId}"]`);
    if (!sourceEl) {
      set({ lastActionSummary: "Object not found." });
      return;
    }

    const ids = findElementsBySameFillAndStrokeColor(state.svgDocument, activeId);
    if (ids.length === 0) {
      set({ lastActionSummary: "No matching objects found." });
      return;
    }

    const fill = sourceEl.getAttribute("fill") || null;
    const stroke = sourceEl.getAttribute("stroke") || null;

    set({
      selectedLayerIds: ids,
      selectedLayerId: activeId,
      sameColorResult: {
        mode: "fill-and-stroke",
        color: `${normalizeColor(fill) || "none"} / ${normalizeColor(stroke) || "none"}`,
        count: ids.length,
      },
      lastActionSummary: `${ids.length} objects with same fill and stroke selected.`,
    });
  },

  clearSameColorResult: () => {
    set({ sameColorResult: null });
  },
}));
