export type SvgElementType =
  | "svg"
  | "group"
  | "path"
  | "circle"
  | "rect"
  | "ellipse"
  | "polygon"
  | "polyline"
  | "line"
  | "text"
  | "image"
  | "defs"
  | "clipPath"
  | "mask"
  | "use"
  | "symbol"
  | "linearGradient"
  | "radialGradient"
  | "pattern"
  | "unknown";

export type SvgLayer = {
  id: string;
  name: string;
  type: SvgElementType;
  tagName: string;
  elementId: string;
  parentId: string | null;
  depth: number;
  index: number;
  fill: string | null;
  stroke: string | null;
  normalizedFill: string | null;
  normalizedStroke: string | null;
  opacity: string | null;
  display: string | null;
  visibility: string | null;
  hasChildren: boolean;
  children: SvgLayer[];
  attributes: Record<string, string>;
  isVisible: boolean;
  isSelected: boolean;
  isLocked: boolean;
  pathData?: string | null;
  textContent?: string | null;
  elementCount?: number;
};

export type SvgDocumentInfo = {
  fileName: string;
  fileSize: number;
  width: string | null;
  height: string | null;
  viewBox: string | null;
  totalElements: number;
  totalGroups: number;
  totalPaths: number;
  totalColors: number;
};

export type SameColorResult = {
  mode: "fill" | "stroke" | "fill-and-stroke";
  color: string | null;
  count: number;
};

export type ResizeMode = "contain" | "cover" | "stretch";

export type SvgResizeOptions = {
  targetWidth: number;
  targetHeight: number;
  mode: ResizeMode;
  center: boolean;
  padding: number;
  preserveAspectRatio: boolean;
};

export const defaultSvgResizeOptions: SvgResizeOptions = {
  targetWidth: 2500,
  targetHeight: 2500,
  mode: "contain",
  center: true,
  padding: 0,
  preserveAspectRatio: true,
};

export type SvgResizeResult = {
  oldWidth: string | null;
  oldHeight: string | null;
  oldViewBox: string | null;
  newWidth: number;
  newHeight: number;
  newViewBox: string;
  scale: number;
  translateX: number;
  translateY: number;
  originalAspectRatio: number | null;
  targetAspectRatio: number;
  resized: boolean;
};

export type CleanSvgOptions = {
  removeEmptyPaths: boolean;
  removePathsWithoutD: boolean;
  removeEmptyGroups: boolean;
  removeComments: boolean;
  removeMetadata: boolean;
  removeHiddenElements: boolean;
  removeElementsWithoutFillAndStroke: boolean;
  removeEmptyDefs: boolean;
  removeEditorAttributes: boolean;
  optimizeWhitespace: boolean;
};

export const defaultCleanSvgOptions: CleanSvgOptions = {
  removeEmptyPaths: true,
  removePathsWithoutD: true,
  removeEmptyGroups: true,
  removeComments: true,
  removeMetadata: true,
  removeHiddenElements: false,
  removeElementsWithoutFillAndStroke: false,
  removeEmptyDefs: true,
  removeEditorAttributes: false,
  optimizeWhitespace: true,
};

export type CleanSvgResult = {
  removedEmptyPaths: number;
  removedPathsWithoutD: number;
  removedEmptyGroups: number;
  removedComments: number;
  removedMetadata: number;
  removedHiddenElements: number;
  removedElementsWithoutFillAndStroke: number;
  removedEmptyDefs: number;
  removedEditorAttributes: number;
  beforeSize: number;
  afterSize: number;
  reducedSize: number;
  reducedPercentage: number;
  totalRemoved: number;
};

export type ExportFormat = "svg" | "png" | "jpg" | "eps";

export type EpsExportMode = "clean" | "strict-size" | "hybrid";

export type BackgroundMode = "white" | "transparent";

export type ExportSettings = {
  format: ExportFormat;
  scale: 1 | 2 | 4;
  width: number;
  height: number;
  transparent: boolean;
  jpgQuality: number;
  jpgBackgroundColor: string;
  removeEditorData: boolean;
  keepLayerIds: boolean;
  epsExportMode: EpsExportMode;
};

export const defaultExportSettings: ExportSettings = {
  format: "png",
  scale: 1,
  width: 2500,
  height: 2500,
  transparent: true,
  jpgQuality: 0.92,
  jpgBackgroundColor: "#FFFFFF",
  removeEditorData: true,
  keepLayerIds: false,
  epsExportMode: "hybrid",
};

export type SvgLayerStore = {
  svgText: string | null;
  svgDocument: Document | null;
  layers: SvgLayer[];
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  documentInfo: SvgDocumentInfo | null;
  isLoading: boolean;
  error: string | null;
  history: string[];
  future: string[];
  lastActionSummary: string | null;
  sameColorResult: SameColorResult | null;
  cleanOptions: CleanSvgOptions;
  lastCleanResult: CleanSvgResult | null;
  resizeOptions: SvgResizeOptions;
  resizeResult: SvgResizeResult | null;
  autoResizeOnUpload: boolean;
  backgroundMode: BackgroundMode;
  zoom: number;
  panX: number;
  panY: number;
  fitZoom: number;
  isExporting: boolean;
  exportError: string | null;
  exportSettings: ExportSettings;
  uploadSvg: (file: File) => Promise<void>;
  parseSvgText: (svgText: string, fileName: string, fileSize: number) => void;
  selectLayer: (layerId: string) => void;
  toggleLayerSelection: (layerId: string) => void;
  selectMultipleLayers: (layerIds: string[]) => void;
  clearSelection: () => void;
  deleteSelectedLayers: () => void;
  deleteLayerById: (layerId: string) => void;
  undo: () => void;
  redo: () => void;
  selectSameFillColor: (sourceLayerId?: string) => void;
  selectSameStrokeColor: (sourceLayerId?: string) => void;
  selectSameFillAndStrokeColor: (sourceLayerId?: string) => void;
  clearSameColorResult: () => void;
  setCleanOptions: (options: Partial<CleanSvgOptions>) => void;
  resetCleanOptions: () => void;
  cleanSvg: () => void;
  setResizeOptions: (options: Partial<SvgResizeOptions>) => void;
  toggleAutoResizeOnUpload: (value: boolean) => void;
  normalizeCurrentSvgTo2500: () => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  fitToScreen: (containerWidth: number, containerHeight: number) => void;
  resetPreviewViewport: (containerWidth: number, containerHeight: number) => void;
  setExportSettings: (settings: Partial<ExportSettings>) => void;
  exportCurrentSvg: (format?: ExportFormat) => Promise<void>;
  setBackgroundMode: (mode: BackgroundMode) => void;
};
