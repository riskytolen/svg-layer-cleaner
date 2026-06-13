import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const INKSCAPE_PATH = process.env.INKSCAPE_PATH || "inkscape";
const TIMEOUT_MS = 30000;

function isValidSvg(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  if (!text.includes("<svg") || !text.includes("</svg>")) return false;
  return true;
}

function patchEpsBoundingBox(
  epsText: string,
  width: number,
  height: number,
): string {
  const bboxLine = `%%BoundingBox: 0 0 ${width} ${height}`;
  const hiresLine = `%%HiResBoundingBox: 0.000000 0.000000 ${width}.000000 ${height}.000000`;

  let result = epsText;

  const bboxRegex = /%%BoundingBox:\s*-?\d+\s+-?\d+\s+-?\d+\s+-?\d+/;
  if (bboxRegex.test(result)) {
    result = result.replace(bboxRegex, bboxLine);
  } else {
    const pagesRegex = /(%%Pages:\s*\d+\n)/;
    if (pagesRegex.test(result)) {
      result = result.replace(pagesRegex, `$1${bboxLine}\n`);
    } else {
      result = bboxLine + "\n" + result;
    }
  }

  const hiresRegex = /%%HiResBoundingBox:\s*[\d.\-]+\s+[\d.\-]+\s+[\d.\-]+\s+[\d.\-]+/;
  if (hiresRegex.test(result)) {
    result = result.replace(hiresRegex, hiresLine);
  } else {
    const insertAfterBbox = /(%%BoundingBox:\s*\d+\s+\d+\s+\d+\s+\d+\n)/;
    if (insertAfterBbox.test(result)) {
      result = result.replace(insertAfterBbox, `$1${hiresLine}\n`);
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

  try {
    const body = await request.json();
    const { svgText, fileName, epsExportMode } = body;

    const mode: string = epsExportMode || "clean";

    // Validate input
    if (!svgText || typeof svgText !== "string") {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "svgText is required." },
        { status: 400 },
      );
    }

    if (!isValidSvg(svgText)) {
      return NextResponse.json(
        { error: "INVALID_SVG", message: "Provided text is not a valid SVG." },
        { status: 400 },
      );
    }

    // Check Inkscape availability
    try {
      await execFileAsync(INKSCAPE_PATH, ["--version"], { timeout: 5000 });
    } catch {
      return NextResponse.json(
        {
          error: "INKSCAPE_NOT_FOUND",
          message:
            "Inkscape CLI is not installed or not found. Please install Inkscape on the server or set INKSCAPE_PATH environment variable.",
        },
        { status: 501 },
      );
    }

    // Create temp directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "svg-eps-"));
    const inputPath = path.join(tempDir, "input.svg");
    const outputPath = path.join(tempDir, "output.eps");

    // Write SVG to temp file
    await fs.writeFile(inputPath, svgText, "utf8");

    // Run Inkscape - hybrid mode avoids --export-area-page to prevent clipping mask
    const inkscapeArgs = [
      inputPath,
      "--export-type=eps",
      `--export-filename=${outputPath}`,
      "--export-ps-level=3",
    ];

    // Only add --export-area-page for non-hybrid modes
    if (mode !== "hybrid") {
      inkscapeArgs.push("--export-area-page");
    }

    try {
      await execFileAsync(INKSCAPE_PATH, inkscapeArgs, { timeout: TIMEOUT_MS });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Inkscape conversion failed.";
      return NextResponse.json(
        { error: "EPS_EXPORT_FAILED", message: "Failed to convert SVG to EPS.", detail: message },
        { status: 500 },
      );
    }

    // Check output
    try {
      const stat = await fs.stat(outputPath);
      if (stat.size === 0) {
        return NextResponse.json(
          { error: "INVALID_EPS_OUTPUT", message: "EPS output file is empty." },
          { status: 500 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "INVALID_EPS_OUTPUT", message: "EPS output file was not generated." },
        { status: 500 },
      );
    }

    // Read output
    let epsText = (await fs.readFile(outputPath)).toString("utf8");

    // Validate EPS header
    if (!epsText.includes("%!PS-Adobe") && !epsText.includes("EPSF")) {
      return NextResponse.json(
        { error: "INVALID_EPS_OUTPUT", message: "Generated file does not appear to be a valid EPS." },
        { status: 500 },
      );
    }

    // Patch BoundingBox for clean mode
    if (mode === "clean") {
      epsText = patchEpsBoundingBox(epsText, 2500, 2500);
    }

    // Hybrid mode: patch BoundingBox + sanitize without aggressive clipping
    if (mode === "hybrid") {
      epsText = patchEpsBoundingBox(epsText, 2500, 2500);

      // Remove system markers if any
      const systemMarkers = ["__eps_page_bounds__", "__eps_clip", "__page_clip", "__export_clip", "__canvas_clip"];
      for (const marker of systemMarkers) {
        const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Remove PostScript comments referencing markers
        const commentRegex = new RegExp(`%%.*${escaped}.*\\n`, "gi");
        epsText = epsText.replace(commentRegex, "");
        // Remove string literals containing markers
        const stringRegex = new RegExp(`\\((?:[^()]*${escaped}[^()]*)\\)`, "gi");
        epsText = epsText.replace(stringRegex, "()");
      }
    }

    const epsBuffer = Buffer.from(epsText, "utf8");
    const safeName = (fileName || "export").replace(/[^a-zA-Z0-9\-_.]/g, "_");

    return new NextResponse(epsBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/postscript",
        "Content-Disposition": `attachment; filename="${safeName}.eps"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "EPS_EXPORT_FAILED", message: "An unexpected error occurred." },
      { status: 500 },
    );
  } finally {
    // Cleanup temp directory
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
