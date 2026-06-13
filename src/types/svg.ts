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
};
