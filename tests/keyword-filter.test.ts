import { expect, test } from "vitest";

import { filterByKeywords } from "../src/util/keyword-filter";

interface TaskLike {
  text: string;
  path: string;
}

const tasks: TaskLike[] = [
  { text: "Buy milk", path: "groceries.md" },
  { text: "Write report", path: "work/tasks.md" },
  { text: "Call mom", path: "personal.md" },
];

test("empty query returns all items", () => {
  expect(filterByKeywords(tasks, "", (it) => [it.text, it.path])).toEqual(
    tasks,
  );
});

test("whitespace-only query returns all items", () => {
  expect(filterByKeywords(tasks, "   ", (it) => [it.text, it.path])).toEqual(
    tasks,
  );
});

test("matches when all keywords are present across fields (AND semantics)", () => {
  expect(
    filterByKeywords(tasks, "write report", (it) => [it.text, it.path]),
  ).toEqual([tasks[1]]);
});

test("does not match when only some keywords are present", () => {
  expect(
    filterByKeywords(tasks, "write nonexistent", (it) => [it.text, it.path]),
  ).toEqual([]);
});

test("is case-insensitive", () => {
  expect(
    filterByKeywords(tasks, "BUY MILK", (it) => [it.text, it.path]),
  ).toEqual([tasks[0]]);
});

test("matches a keyword found only in the path for a task-like candidate", () => {
  expect(filterByKeywords(tasks, "work", (it) => [it.text, it.path])).toEqual([
    tasks[1],
  ]);
});

test("matches path-only for file-like candidates", () => {
  const files = [{ path: "notes/groceries.md" }, { path: "notes/work.md" }];

  expect(filterByKeywords(files, "groceries", (it) => [it.path])).toEqual([
    files[0],
  ]);
});
