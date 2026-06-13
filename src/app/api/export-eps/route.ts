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

function hasRequiredDimensions(text: string): boolean {
  return (
    text.includes('width="2500"') &&
    text.includes('height="2500"') &&
    text.includes('viewBox="0 0 2500 2500"')
  );
}

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

  try {
    const body = await request.json();
    const { svgText, fileName } = body;

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

    // Run Inkscape with page area export for correct 2500x2500 bounding box
    try {
      await execFileAsync(
        INKSCAPE_PATH,
        [
          inputPath,
          "--export-type=eps",
          `--export-filename=${outputPath}`,
          "--export-area-page",
          "--export-ps-level=3",
        ],
        { timeout: TIMEOUT_MS },
      );
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
    const epsBuffer = await fs.readFile(outputPath);

    // Validate EPS header
    const header = epsBuffer.subarray(0, 200).toString("utf8");
    if (!header.includes("%!PS-Adobe") && !header.includes("EPSF")) {
      return NextResponse.json(
        { error: "INVALID_EPS_OUTPUT", message: "Generated file does not appear to be a valid EPS." },
        { status: 500 },
      );
    }

    // Validate BoundingBox
    const epsText = epsBuffer.toString("utf8");
    const bboxMatch = epsText.match(/%%BoundingBox:\s*(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)/);
    if (bboxMatch) {
      const [, x0, y0, x1, y1] = bboxMatch.map(Number);
      const bboxW = x1 - x0;
      const bboxH = y1 - y0;
      const tolerance = 10;
      if (bboxW < 2500 - tolerance || bboxH < 2500 - tolerance) {
        console.warn(`EPS BoundingBox smaller than expected: ${bboxW}x${bboxH} (expected ~2500x2500)`);
      }
    }

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
