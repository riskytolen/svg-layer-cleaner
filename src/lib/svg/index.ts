export { parseSvg } from "./parseSvg";
export { validateSvgFile, validateSvgDocument } from "./validateSvg";
export { assignElementIds, resetIdCounter } from "./assignElementIds";
export { buildLayerTree } from "./buildLayerTree";
export { getElementName } from "./getElementName";
export { getElementFill, getElementStroke, getElementOpacity, getElementDisplay, getElementVisibility, getElementColorInfo } from "./getElementColors";
export { getElementAttributes } from "./getElementAttributes";
export { serializeSvg } from "./serializeSvg";
export { getSvgDocumentInfo } from "./getDocumentInfo";
export { deleteElementByLayerId, deleteElementsByLayerIds, collectChildIds } from "./deleteSvgElements";
export type { DeleteResult } from "./deleteSvgElements";
export { findElementsBySameFillColor, findElementsBySameStrokeColor, findElementsBySameFillAndStrokeColor, findElementsByColor } from "./selectSameColor";
export type { SelectByColorOptions } from "./selectSameColor";
export { findElementsByNearColor, getReviewLayerColors } from "./findElementsByNearColor";
export type { NearColorMode, FindNearColorOptions } from "./findElementsByNearColor";
export { applyColorToLayers } from "./reviewColor";
export type { ApplyColorResult } from "./reviewColor";
export { normalizeReviewColorInput, mergeInlineColor } from "./reviewColorCore";
export type { ReviewColorProperty } from "./reviewColorCore";
export { cleanSvgDocument, optimizeSvgWhitespace } from "./cleanSvg";
export { quickCleanSvg } from "./quickCleanSvg";
export { quickCleanSvgWithDefaultOptions, compareQuickCleanOutputs, getTopLevelVisualGroups } from "./quickCleanPipeline";
export { DEFAULT_QUICK_CLEAN_OPTIONS } from "./cleanDefaults";
export { findFirstPathInGroup, findFirstProcessablePathAfterClean } from "./findFirstPathInGroup";
export { removeSameFillAsFirstPath, isWhiteLikeColor } from "./removeSameFillAsFirstPath";
export { removeWhiteBackground } from "./removeWhiteBackground";
export type { RemoveWhiteBackgroundOptions, RemoveWhiteBackgroundResult } from "./removeWhiteBackground";
export {
  detectMainBackground,
  detectNearWhiteBackgroundCandidates,
  estimateElementBBox,
  parseViewBoxRect,
  getVisualElements,
  defaultDetectionOptions,
} from "./backgroundDetection";
export type { WhiteBackgroundMode, BackgroundDetectionOptions } from "./backgroundDetection";
export { cleanupPngWhiteResidual } from "./pngResidualCleanup";
export type { PngResidualOptions, PngResidualResult } from "./pngResidualCleanup";
export { resolveElementFill, extractCssFillRules, isExcludedElement, isElementVisible, debugFirstPaths } from "./resolveElementFill";
export { normalizeSvgToSize } from "./normalizeSvgSize";
export { prepareSvgForExport } from "./prepareSvgForExport";
export { prepareSvgForEpsExport } from "./prepareSvgForEpsExport";
export { patchEpsBoundingBox } from "./patchEpsBoundingBox";
export { sanitizeEpsOutput } from "./sanitizeEpsOutput";
export { exportSvgFile } from "./exportSvg";
export { exportSvgToPng } from "./exportPng";
export { exportSvgToJpg } from "./exportJpg";
export { exportSvgToEps } from "./exportEps";
