import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

// Use the project's TypeScript compiler so these tests need no extra runner.
const source = readFileSync(new URL("../src/lib/project/reviewProject.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 },
});
const {
  PROJECT_FORMAT_VERSION,
  MAX_SAVED_HISTORY_STEPS,
  serializeReviewProject,
  validateReviewProjectFile,
  selectExportableReviewItems,
  trimReviewHistory,
  buildProjectFileName,
} = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

function makeItem(id, status, overrides = {}) {
  return {
    id,
    fileName: `${id}.svg`,
    svgText: `<svg xmlns="http://www.w3.org/2000/svg" data-layer-id="layer-0"><g id="${id}" data-layer-id="layer-1"><path data-layer-id="layer-2" d="M0 0"/></g></svg>`,
    bgColor: "#ffffff",
    autoDeletedCount: 3,
    manualDeletedCount: 1,
    ambiguousCount: 0,
    preservedNearWhite: 2,
    history: [],
    status,
    beforeSize: 120,
    ...overrides,
  };
}

function sampleInput(overrides = {}) {
  return {
    sourceName: "my-folder",
    items: [makeItem("a", "reviewed"), makeItem("b", "pending-review"), makeItem("c", "skipped")],
    activeItemIndex: 1,
    activeSelection: { layerId: "layer-2", layerIds: ["layer-1", "layer-2"] },
    exportScope: "reviewed-only",
    reviewFilter: "pending",
    reviewSearchQuery: "log",
    reviewColorProperty: "fill",
    reviewEditColor: "#ff0000",
    options: {
      exportFormats: ["svg", "png"],
      autoResize2500: true,
      quickClean: true,
      removeWhiteBackground: true,
      backgroundMode: "balanced",
      backgroundColorTolerance: 28,
      firstPathScope: "group-1",
      onlyDeleteIfWhiteLike: true,
      whiteTolerance: 28,
      cleanPngResidual: true,
      pngResidualTolerance: 24,
      skipSystemLayers: true,
      overwriteExisting: true,
      pngTransparent: true,
      jpgQuality: 0.92,
      manualReview: true,
      reviewColorTolerance: 4,
      reviewCanvas: "black",
    },
    ...overrides,
  };
}

test("serialize + validate round-trips the whole review session", () => {
  const file = serializeReviewProject(sampleInput());
  assert.equal(file.formatVersion, PROJECT_FORMAT_VERSION);
  const res = validateReviewProjectFile(JSON.parse(JSON.stringify(file)));
  assert.ok(res.ok);
  assert.equal(res.project.items.length, 3);
  assert.deepEqual(res.project.activeSelection, { layerId: "layer-2", layerIds: ["layer-1", "layer-2"] });
  assert.equal(res.project.activeItemIndex, 1);
  assert.equal(res.project.exportScope, "reviewed-only");
  assert.equal(res.project.reviewFilter, "pending");
  assert.equal(res.project.reviewColorProperty, "fill");
  assert.equal(res.project.options.exportFormats.join(","), "svg,png");
});

test("saved undo history is capped to the last 10 steps", () => {
  assert.equal(MAX_SAVED_HISTORY_STEPS, 10);
  const longHistory = Array.from({ length: 24 }, (_, i) => `<svg history-step-${i}/>`);
  const file = serializeReviewProject(sampleInput({ items: [makeItem("a", "reviewed", { history: longHistory })] }));
  assert.equal(file.items[0].history.length, MAX_SAVED_HISTORY_STEPS);
  assert.equal(file.items[0].history[MAX_SAVED_HISTORY_STEPS - 1], "<svg history-step-23/>");
  assert.equal(trimReviewHistory(["<svg a/>", "<svg b/>"]).length, 2);
});

test("reviewed-only export takes exactly the marked-reviewed assets", () => {
  const items = [makeItem("a", "reviewed"), makeItem("b", "pending-review"), makeItem("c", "skipped")];
  const summary = selectExportableReviewItems(items, "reviewed-only");
  assert.deepEqual(summary.exportable.map((r) => r.id), ["a"]);
  assert.equal(summary.pendingCount, 0);
  assert.equal(summary.reviewedCount, 1);
});

test("all-eligible export keeps pending + reviewed and always excludes rejected", () => {
  const items = [makeItem("a", "reviewed"), makeItem("b", "pending-review"), makeItem("c", "skipped")];
  const summary = selectExportableReviewItems(items, "all-eligible");
  assert.deepEqual(summary.exportable.map((r) => r.id), ["a", "b"]);
  assert.equal(summary.pendingCount, 1);
  assert.equal(summary.reviewedCount, 1);
});

test("validation rejects damaged or foreign project files", async () => {
  assert.equal(validateReviewProjectFile(null).ok, false);
  assert.equal(validateReviewProjectFile([]).ok, false);
  const wrongVersion = await validateReviewProjectFile({ formatVersion: 99, items: [makeItem("a", "reviewed")] });
  assert.equal(wrongVersion.ok, false);
  const empty = await validateReviewProjectFile({ formatVersion: PROJECT_FORMAT_VERSION, items: [] });
  assert.equal(empty.ok, false);
  const noSvg = await validateReviewProjectFile({
    formatVersion: PROJECT_FORMAT_VERSION,
    items: [{ id: "a", fileName: "a.svg", svgText: "<div/>", status: "reviewed", history: [] }],
  });
  assert.equal(noSvg.ok, false);
  const duplicate = await validateReviewProjectFile({
    formatVersion: PROJECT_FORMAT_VERSION,
    items: [makeItem("a", "reviewed"), makeItem("a", "reviewed")],
  });
  assert.equal(duplicate.ok, false);
});

test("validation sanitizes unknown scopes, statuses, filters and options", () => {
  const json = JSON.parse(JSON.stringify(serializeReviewProject(sampleInput())));
  json.exportScope = "everything";
  json.reviewFilter = "chaos";
  json.reviewColorProperty = "background";
  json.options.exportFormats = ["pdf", "png"];
  json.options.backgroundMode = "wild";
  json.options.jpgQuality = 7;
  json.activeItemIndex = 42;
  json.activeSelection = { layerId: null, layerIds: ["x", 5, "y"] };
  const res = validateReviewProjectFile(json);
  assert.ok(res.ok);
  assert.equal(res.project.exportScope, "reviewed-only");
  assert.equal(res.project.reviewFilter, "all");
  assert.equal(res.project.reviewColorProperty, "fill");
  assert.deepEqual(res.project.options.exportFormats, ["png"]);
  assert.equal(res.project.options.backgroundMode, "balanced");
  assert.equal(res.project.options.jpgQuality, 1);
  assert.equal(res.project.activeItemIndex, null);
  assert.deepEqual(res.project.activeSelection, { layerId: null, layerIds: ["x", "y"] });
});

test("project file name is download-safe", () => {
  assert.equal(buildProjectFileName("my folder!"), "my-folder.svg-editor-project.json");
  assert.equal(buildProjectFileName(null), "review-project.svg-editor-project.json");
});
