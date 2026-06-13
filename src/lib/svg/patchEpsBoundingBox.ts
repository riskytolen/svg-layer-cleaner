export function patchEpsBoundingBox(
  epsText: string,
  options: {
    width: number;
    height: number;
  },
): string {
  const { width, height } = options;

  const bboxLine = `%%BoundingBox: 0 0 ${width} ${height}`;
  const hiresLine = `%%HiResBoundingBox: 0.000000 0.000000 ${width}.000000 ${height}.000000`;

  let result = epsText;

  // Replace existing %%BoundingBox
  const bboxRegex = /%%BoundingBox:\s*-?\d+\s+-?\d+\s+-?\d+\s+-?\d+/;
  if (bboxRegex.test(result)) {
    result = result.replace(bboxRegex, bboxLine);
  } else {
    // Insert after %%Pages line or after header
    const pagesRegex = /(%%Pages:\s*\d+\n)/;
    if (pagesRegex.test(result)) {
      result = result.replace(pagesRegex, `$1${bboxLine}\n`);
    } else {
      result = bboxLine + "\n" + result;
    }
  }

  // Replace existing %%HiResBoundingBox or add it
  const hiresRegex = /%%HiResBoundingBox:\s*[\d.\-]+\s+[\d.\-]+\s+[\d.\-]+\s+[\d.\-]+/;
  if (hiresRegex.test(result)) {
    result = result.replace(hiresRegex, hiresLine);
  } else {
    // Insert right after %%BoundingBox
    const insertAfterBbox = /(%%BoundingBox:\s*\d+\s+\d+\s+\d+\s+\d+\n)/;
    if (insertAfterBbox.test(result)) {
      result = result.replace(insertAfterBbox, `$1${hiresLine}\n`);
    }
  }

  return result;
}
