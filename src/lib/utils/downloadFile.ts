export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadText(
  text: string,
  fileName: string,
  mimeType: string,
): void {
  const blob = new Blob([text], { type: mimeType });
  downloadBlob(blob, fileName);
}
