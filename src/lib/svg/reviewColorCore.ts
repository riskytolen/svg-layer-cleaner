import { normalizeColor } from "@/lib/utils/colorUtils";

export type ReviewColorProperty = "fill" | "stroke";

/**
 * Validate and normalize user color input (picker value, hex text, or any
 * SVG/CSS color string) into an uppercase 6-digit hex like `#3366EE`.
 * Returns null for none/transparent/unparsable input.
 */
export function normalizeReviewColorInput(value: string | null | undefined): string | null {
  if (!value) return null;
  const hex = normalizeColor(value);
  return hex && /^#[0-9A-F]{6}$/.test(hex) ? hex : null;
}

/**
 * Merge a fill/stroke declaration into an existing inline `style` attribute
 * value. Same-property declarations are replaced (case-insensitive), all
 * other declarations are kept in order. The new declaration is appended
 * last so it also wins inside a single inline style block.
 *
 * Pure function: no DOM access, safe to unit test and reuse.
 */
export function mergeInlineColor(
  existingStyle: string | null,
  property: ReviewColorProperty,
  color: string,
): string {
  const propertyRegex = new RegExp(`^${property}\\s*:`, "i");
  const declarations = (existingStyle ?? "")
    .split(";")
    .map((decl) => decl.trim())
    .filter(Boolean)
    .filter((decl) => !propertyRegex.test(decl));
  declarations.push(`${property}: ${color}`);
  return declarations.join("; ");
}
