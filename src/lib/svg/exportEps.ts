export async function exportSvgToEps(
  svgText: string,
  fileName: string,
): Promise<Blob> {
  const response = await fetch("/api/export-eps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ svgText, fileName }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "EPS export failed.");
  }

  return await response.blob();
}
