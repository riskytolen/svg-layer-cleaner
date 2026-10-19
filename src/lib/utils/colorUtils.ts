const NAMED_COLORS: Record<string, string> = {
  aliceblue: "#F0F8FF", antiquewhite: "#FAEBD7", aqua: "#00FFFF", aquamarine: "#7FFFD4",
  azure: "#F0FFFF", beige: "#F5F5DC", bisque: "#FFE4C4", black: "#000000",
  blanchedalmond: "#FFEBCD", blue: "#0000FF", blueviolet: "#8A2BE2", brown: "#A52A2A",
  burlywood: "#DEB887", cadetblue: "#5F9EA0", chartreuse: "#7FFF00", chocolate: "#D2691E",
  coral: "#FF7F50", cornflowerblue: "#6495ED", cornsilk: "#FFF8DC", crimson: "#DC143C",
  cyan: "#00FFFF", darkblue: "#00008B", darkcyan: "#008B8B", darkgoldenrod: "#B8860B",
  darkgray: "#A9A9A9", darkgreen: "#006400", darkkhaki: "#BDB76B", darkmagenta: "#8B008B",
  darkolivegreen: "#556B2F", darkorange: "#FF8C00", darkorchid: "#9932CC", darkred: "#8B0000",
  darksalmon: "#E9967A", darkseagreen: "#8FBC8F", darkslateblue: "#483D8B", darkslategray: "#2F4F4F",
  darkturquoise: "#00CED1", darkviolet: "#9400D3", deeppink: "#FF1493", deepskyblue: "#00BFFF",
  dimgray: "#696969", dodgerblue: "#1E90FF", firebrick: "#B22222", floralwhite: "#FFFAF0",
  forestgreen: "#228B22", fuchsia: "#FF00FF", gainsboro: "#DCDCDC", ghostwhite: "#F8F8FF",
  gold: "#FFD700", goldenrod: "#DAA520", gray: "#808080", green: "#008000",
  greenyellow: "#ADFF2F", honeydew: "#F0FFF0", hotpink: "#FF69B4", indianred: "#CD5C5C",
  indigo: "#4B0082", ivory: "#FFFFF0", khaki: "#F0E68C", lavender: "#E6E6FA",
  lavenderblush: "#FFF0F5", lawngreen: "#7CFC00", lemonchiffon: "#FFFACD", lightblue: "#ADD8E6",
  lightcoral: "#F08080", lightcyan: "#E0FFFF", lightgoldenrodyellow: "#FAFAD2", lightgray: "#D3D3D3",
  lightgreen: "#90EE90", lightpink: "#FFB6C1", lightsalmon: "#FFA07A", lightseagreen: "#20B2AA",
  lightskyblue: "#87CEFA", lightslategray: "#778899", lightsteelblue: "#B0C4DE", lightyellow: "#FFFFE0",
  lime: "#00FF00", limegreen: "#32CD32", linen: "#FAF0E6", magenta: "#FF00FF",
  maroon: "#800000", mediumaquamarine: "#66CDAA", mediumblue: "#0000CD", mediumorchid: "#BA55D3",
  mediumpurple: "#9370DB", mediumseagreen: "#3CB371", mediumslateblue: "#7B68EE",
  mediumspringgreen: "#00FA9A", mediumturquoise: "#48D1CC", mediumvioletred: "#C71585",
  midnightblue: "#191970", mintcream: "#F5FFFA", mistyrose: "#FFE4E1", moccasin: "#FFE4B5",
  navajowhite: "#FFDEAD", navy: "#000080", oldlace: "#FDF5E6", olive: "#808000",
  olivedrab: "#6B8E23", orange: "#FFA500", orangered: "#FF4500", orchid: "#DA70D6",
  palegoldenrod: "#EEE8AA", palegreen: "#98FB98", paleturquoise: "#AFEEEE", palevioletred: "#DB7093",
  papayawhip: "#FFEFD5", peachpuff: "#FFDAB9", peru: "#CD853F", pink: "#FFC0CB",
  plum: "#DDA0DD", powderblue: "#B0E0E6", purple: "#800080", rebeccapurple: "#663399",
  red: "#FF0000", rosybrown: "#BC8F8F", royalblue: "#4169E1", saddlebrown: "#8B4513",
  salmon: "#FA8072", sandybrown: "#F4A460", seagreen: "#2E8B57", seashell: "#FFF5EE",
  sienna: "#A0522D", silver: "#C0C0C0", skyblue: "#87CEEB", slateblue: "#6A5ACD",
  slategray: "#708090", snow: "#FFFAFA", springgreen: "#00FF7F", steelblue: "#4682B4",
  tan: "#D2B48C", teal: "#008080", thistle: "#D8BFD8", tomato: "#FF6347",
  turquoise: "#40E0D0", violet: "#EE82EE", wheat: "#F5DEB3", white: "#FFFFFF",
  whitesmoke: "#F5F5F5", yellow: "#FFFF00", yellowgreen: "#9ACD32",
};

function hexShortToFull(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length === 3) {
    return "#" + h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  return "#" + h;
}

export function namedColorToHex(color: string): string | null {
  const lower = color.toLowerCase().trim();
  if (lower in NAMED_COLORS) {
    return NAMED_COLORS[lower].toUpperCase();
  }
  return null;
}

export function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (!match) return null;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  if (r > 255 || g > 255 || b > 255) return null;

  const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function normalizeColor(color: string | null | undefined): string | null {
  if (!color || color.trim() === "") return null;

  const trimmed = color.trim().toLowerCase();
  if (trimmed === "none" || trimmed === "transparent" || trimmed === "" || trimmed === "inherit" || trimmed === "currentColor") {
    return null;
  }

  // Hex color
  const hexMatch = trimmed.match(/^#([0-9a-f]{3,8})$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 8) {
      // 8-digit hex with alpha, ignore alpha
      return "#" + hex.slice(0, 6).toUpperCase();
    }
    return hexShortToFull("#" + hex).toUpperCase();
  }

  // RGB/RGBA
  if (trimmed.startsWith("rgb")) {
    return rgbToHex(trimmed);
  }

  // HSL/HSLA - convert via named color check first, then approximate
  if (trimmed.startsWith("hsl")) {
    // Simple approximation: try to parse and convert
    const match = trimmed.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/);
    if (match) {
      const h = parseFloat(match[1]) / 360;
      const s = parseFloat(match[2]) / 100;
      const l = parseFloat(match[3]) / 100;

      if (s === 0) {
        const v = Math.round(l * 255);
        const hex = v.toString(16).padStart(2, "0").toUpperCase();
        return `#${hex}${hex}${hex}`;
      }

      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
      const g = Math.round(hue2rgb(p, q, h) * 255);
      const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

      const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0").toUpperCase();
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    return null;
  }

  // Named color
  return namedColorToHex(trimmed);
}

export function compareColors(colorA: string | null, colorB: string | null): boolean {
  if (colorA === null && colorB === null) return true;
  if (colorA === null || colorB === null) return false;
  return normalizeColor(colorA) === normalizeColor(colorB);
}

export type RgbColor = { r: number; g: number; b: number };

/** Parse any supported color string into RGB channels. Returns null for none/transparent/unparsable. */
export function parseHexColor(color: string | null | undefined): RgbColor | null {
  const normalized = normalizeColor(color);
  if (!normalized) return null;
  const h = normalized.replace("#", "");
  if (!/^[0-9A-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Euclidean distance in RGB space (0 = identical, max ~441.7). */
export function colorDistance(colorA: string | null | undefined, colorB: string | null | undefined): number | null {
  const a = parseHexColor(colorA);
  const b = parseHexColor(colorB);
  if (!a || !b) return null;
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/** True when two colors are within `tolerance` (RGB Euclidean distance). */
export function isNearColor(
  colorA: string | null | undefined,
  colorB: string | null | undefined,
  tolerance: number,
): boolean {
  const d = colorDistance(colorA, colorB);
  if (d === null) return false;
  return d <= tolerance;
}

/**
 * True when the color is near-white per-channel:
 * every channel >= 255 - tolerance.
 * Used as a conservative gate for "is this a background candidate at all".
 */
export function isNearWhite(color: string | null | undefined, tolerance: number): boolean {
  const rgb = parseHexColor(color);
  if (!rgb) return false;
  const min = 255 - tolerance;
  return rgb.r >= min && rgb.g >= min && rgb.b >= min;
}
