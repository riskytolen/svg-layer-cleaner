import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

// Transpile with the project's compiler; rewrite the "@/..." alias so Node's
// data-module loader can resolve the pure-color dependency chain.
function transpileTs(fileName, source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 },
    fileName,
  });
  return outputText;
}

const colorUtilsText = transpileTs(
  "colorUtils.ts",
  readFileSync(new URL("../src/lib/utils/colorUtils.ts", import.meta.url), "utf8"),
);
const colorUtilsUrl = `data:text/javascript;base64,${Buffer.from(colorUtilsText).toString("base64")}`;

const coreSource = readFileSync(new URL("../src/lib/svg/reviewColorCore.ts", import.meta.url), "utf8")
  .replace("@/lib/utils/colorUtils", colorUtilsUrl);
const coreText = transpileTs("reviewColorCore.ts", coreSource);
const { mergeInlineColor, normalizeReviewColorInput } = await import(
  `data:text/javascript;base64,${Buffer.from(coreText).toString("base64")}`
);

test("normalizes hex input into uppercase 6-digit hex", () => {
  assert.equal(normalizeReviewColorInput("#3366ee"), "#3366EE");
  assert.equal(normalizeReviewColorInput("#ABC"), "#AABBCC");
  assert.equal(normalizeReviewColorInput("#ff000080"), "#FF0000");
  assert.equal(normalizeReviewColorInput("rgb(51, 102, 238)"), "#3366EE");
  assert.equal(normalizeReviewColorInput("blue"), "#0000FF");
});

test("rejects none, empty, and unparsable color text", () => {
  assert.equal(normalizeReviewColorInput("none"), null);
  assert.equal(normalizeReviewColorInput("transparent"), null);
  assert.equal(normalizeReviewColorInput(""), null);
  assert.equal(normalizeReviewColorInput("not-a-color"), null);
  assert.equal(normalizeReviewColorInput(null), null);
});

test("appends a fill declaration to a style with other declarations", () => {
  assert.equal(
    mergeInlineColor("stroke: red; opacity: .5", "fill", "#00FF00"),
    "stroke: red; opacity: .5; fill: #00FF00",
  );
});

test("replaces an existing same-property declaration case-insensitively", () => {
  assert.equal(
    mergeInlineColor("FILL:#ff0000; stroke: blue", "fill", "#3366EE"),
    "stroke: blue; fill: #3366EE",
  );
  assert.equal(
    mergeInlineColor("fill: none", "fill", "#000000"),
    "fill: #000000",
  );
});

test("handles stroke replacement without touching fill", () => {
  assert.equal(
    mergeInlineColor("fill: #112233; stroke:#454545 ", "stroke", "#FFFFFF"),
    "fill: #112233; stroke: #FFFFFF",
  );
});

test("merge on empty/null style yields a single declaration", () => {
  assert.equal(mergeInlineColor(null, "fill", "#123456"), "fill: #123456");
  assert.equal(mergeInlineColor("", "stroke", "#654321"), "stroke: #654321");
});

test("never merges a property with a lookalike prefix", () => {
  assert.equal(
    mergeInlineColor("fill-opacity: 0.2", "fill", "#A0B0C0"),
    "fill-opacity: 0.2; fill: #A0B0C0",
  );
  assert.equal(
    mergeInlineColor("stroke-width: 2", "stroke", "#D0E0F0"),
    "stroke-width: 2; stroke: #D0E0F0",
  );
});
