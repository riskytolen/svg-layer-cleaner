import { downloadText } from "@/lib/utils/downloadFile";

export function exportSvgFile(svgText: string, fileName: string): void {
  downloadText(svgText, fileName, "image/svg+xml;charset=utf-8");
}
