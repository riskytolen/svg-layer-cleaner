export async function exportSvgToEps(
  svgText: string,
  fileName: string,
  epsExportMode: "clean" | "strict-size" | "hybrid" = "hybrid",
): Promise<Blob> {
  const response = await fetch("/api/export-eps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ svgText, fileName, epsExportMode }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "EPS export failed.");
  }

  return await response.blob();
}
