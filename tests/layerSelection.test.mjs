import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

// Use the project's TypeScript compiler so these tests need no extra runner.
const source = readFileSync(new URL("../src/lib/svg/layerSelection.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 },
});
const { adjustLayerSelection } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("deselects the reference object after Select Same Fill and keeps the other 25", () => {
  const ids = Array.from({ length: 26 }, (_, i) => `layer-${i + 1}`);
  const selection = { selectedLayerId: ids[0], selectedLayerIds: ids };
  const next = adjustLayerSelection(selection, ids[0], "remove");

  assert.deepEqual(next.selectedLayerIds, ids.slice(1));
  assert.equal(next.selectedLayerId, ids[1]);
  assert.equal(selection.selectedLayerId, ids[0]);
  assert.equal(selection.selectedLayerIds.length, 26);
});

test("keeps the active object when a different selected object is deselected", () => {
  const next = adjustLayerSelection({
    selectedLayerId: "a",
    selectedLayerIds: ["a", "b", "c"],
  }, "b", "remove");

  assert.deepEqual(next, { selectedLayerId: "a", selectedLayerIds: ["a", "c"] });
});

test("deselect mode never adds unselected objects", () => {
  const selection = { selectedLayerId: "a", selectedLayerIds: ["a", "b"] };
  assert.deepEqual(adjustLayerSelection(selection, "c", "remove"), selection);
  assert.deepEqual(adjustLayerSelection(selection, "background", "remove"), selection);
});

test("repeated deselection is safe and does not select the object again", () => {
  const next = adjustLayerSelection({
    selectedLayerId: "a",
    selectedLayerIds: ["a", "b", "c"],
  }, "a", "remove");

  assert.deepEqual(adjustLayerSelection(next, "a", "remove"), next);
});

test("deselecting the final object clears the active object too", () => {
  assert.deepEqual(adjustLayerSelection({
    selectedLayerId: "a",
    selectedLayerIds: ["a"],
  }, "a", "remove"), { selectedLayerId: null, selectedLayerIds: [] });
});

test("Ctrl/Cmd/Shift toggle removes the active object without leaving a stale highlight", () => {
  assert.deepEqual(adjustLayerSelection({
    selectedLayerId: "a",
    selectedLayerIds: ["a", "b", "c"],
  }, "a"), { selectedLayerId: "b", selectedLayerIds: ["b", "c"] });
});

test("toggle can add a previously deselected object back without replacing other selections", () => {
  assert.deepEqual(adjustLayerSelection({
    selectedLayerId: "b",
    selectedLayerIds: ["b", "c"],
  }, "a"), { selectedLayerId: "b", selectedLayerIds: ["b", "c", "a"] });
});

test("toggle can start and finish a selection", () => {
  const selected = adjustLayerSelection({ selectedLayerId: null, selectedLayerIds: [] }, "a");
  assert.deepEqual(selected, { selectedLayerId: "a", selectedLayerIds: ["a"] });
  assert.deepEqual(adjustLayerSelection(selected, "a"), { selectedLayerId: null, selectedLayerIds: [] });
});
