import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const helperPath = path.resolve(testDirectory, "../lib/portfolio-sorting.ts");
const compiled = ts.transpileModule(fs.readFileSync(helperPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const helperUrl = `data:text/javascript;base64,${Buffer.from(compiled.outputText).toString("base64")}`;
const { sortByDate } = await import(helperUrl);

const sortAchievements = (items) =>
  sortByDate(items, (item) => item.achievement_date);

test("achievements sort newest first by achievement_date, not created_at", () => {
  const items = [
    {
      id: "new",
      title: "New achievement",
      achievement_date: "2026-05-23",
      created_at: "2020-01-01",
    },
    {
      id: "old",
      title: "Old achievement",
      achievement_date: "2024-02-10",
      created_at: "2030-01-01",
    },
  ];

  assert.deepEqual(sortAchievements(items).map((item) => item.id), ["new", "old"]);
});

test("changing an achievement date moves it to its new chronological position", () => {
  const items = [
    { id: "first", title: "First", achievement_date: "2025-01-01" },
    { id: "second", title: "Second", achievement_date: "2024-01-01" },
  ];

  items[1].achievement_date = "2026-01-01";

  assert.deepEqual(sortAchievements(items).map((item) => item.id), ["second", "first"]);
});

test("achievements with equal dates use title and then ID as stable keys", () => {
  const items = [
    { id: "b", title: "Beta", achievement_date: "2025-01-01", created_at: "2025-01-01" },
    { id: "z", title: "Alpha", achievement_date: "2025-01-01", created_at: "2025-01-01" },
    { id: "a", title: "Alpha", achievement_date: "2025-01-01", created_at: "2025-01-01" },
  ];

  assert.deepEqual(sortAchievements(items).map((item) => item.id), ["a", "z", "b"]);
});

test("invalid achievement dates follow every valid date", () => {
  const items = [
    { id: "invalid", title: "Invalid", achievement_date: "2026-02-30", created_at: "2020-01-01" },
    { id: "valid", title: "Valid", achievement_date: "2025-01-01", created_at: "2020-01-01" },
  ];

  assert.deepEqual(sortAchievements(items).map((item) => item.id), ["valid", "invalid"]);
});

test("missing achievement dates follow every valid date", () => {
  const items = [
    { id: "missing", title: "Missing", achievement_date: null, created_at: "2020-01-01" },
    { id: "valid", title: "Valid", achievement_date: "2025-01-01", created_at: "2020-01-01" },
  ];

  assert.deepEqual(sortAchievements(items).map((item) => item.id), ["valid", "missing"]);
});
