import { CleanSvgOptions, defaultCleanSvgOptions } from "@/types/svg";

/**
 * Single source of truth for Quick Clean default options.
 * Used by both manual button and batch automation.
 */
export const DEFAULT_QUICK_CLEAN_OPTIONS: CleanSvgOptions = {
  ...defaultCleanSvgOptions,
};
