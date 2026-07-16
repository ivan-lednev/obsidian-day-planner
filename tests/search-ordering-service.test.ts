import type { Vault } from "obsidian";
import { expect, test } from "vitest";

import { createId, type LogEntry } from "../src/redux/index/index-slice";
import type { RootState } from "../src/redux/store";
import { DefaultSearchOrderingService } from "../src/service/search-ordering-service";
import type { FileMatch, TaskMatch } from "../src/service/search-service";

function taskMatch(path: string, line: number): TaskMatch {
  return {
    type: "task",
    path,
    text: "task",
    position: {
      start: { line, col: 0, offset: 0 },
      end: { line, col: 0, offset: 0 },
    },
  };
}

function fileMatch(path: string): FileMatch {
  return { type: "file", path };
}

function logEntry(props: {
  id: string;
  parentId: string;
  start: string;
  end?: string;
}): LogEntry {
  const { id, parentId, start, end } = props;

  return { id, parentId, start, end, dayKeys: [], source: "listItemLog" };
}

function fakeState(logEntries: LogEntry[]): RootState {
  return {
    tracker: {
      taskEntries: { byId: {}, byPath: {} },
      fileEntries: { byId: {}, byPath: {} },
      logEntries: {
        byId: Object.fromEntries(logEntries.map((it) => [it.id, it])),
        byPath: {},
        byDay: {},
      },
      planEntries: { byId: {}, byPath: {}, byDay: {} },
    },
  } as unknown as RootState;
}

function fakeVault(mtimes: Record<string, number> = {}): Vault {
  return {
    getFileByPath: (path: string) => {
      const mtime = mtimes[path];

      if (mtime === undefined) {
        return null;
      }

      return { path, stat: { mtime } };
    },
  } as unknown as Vault;
}

// todo: rewrite to use integration harness

test("orders by most recent closed clock first, even across file/task types", async () => {
  const taskA = taskMatch("a.md", 0);
  const fileB = fileMatch("b.md");

  const state = fakeState([
    logEntry({
      id: "1",
      parentId: createId("a.md", 0),
      start: "2024-01-02 10:00:00",
      end: "2024-01-02 11:00:00",
    }),
    logEntry({
      id: "2",
      parentId: createId("b.md", "frontmatter"),
      start: "2024-01-01 10:00:00",
      end: "2024-01-01 11:00:00",
    }),
  ]);

  const service = new DefaultSearchOrderingService(fakeVault(), () => state);

  expect(await service.order([fileB, taskA])).toEqual([taskA, fileB]);
});

test("an item with a closed log outranks one without, regardless of type", async () => {
  const taskA = taskMatch("a.md", 0);
  const fileB = fileMatch("b.md");

  const state = fakeState([
    logEntry({
      id: "1",
      parentId: createId("b.md", "frontmatter"),
      start: "2024-01-01 10:00:00",
      end: "2024-01-01 11:00:00",
    }),
  ]);

  const service = new DefaultSearchOrderingService(fakeVault(), () => state);

  expect(await service.order([taskA, fileB])).toEqual([fileB, taskA]);
});

test("when neither match has a log, file matches rank above task matches", async () => {
  const taskA = taskMatch("a.md", 0);
  const fileB = fileMatch("b.md");

  const service = new DefaultSearchOrderingService(fakeVault(), () =>
    fakeState([]),
  );

  expect(await service.order([taskA, fileB])).toEqual([fileB, taskA]);
});

test("falls back to mtime descending when recency and type are tied", async () => {
  const fileA = fileMatch("a.md");
  const fileB = fileMatch("b.md");

  const vault = fakeVault({ "a.md": 100, "b.md": 200 });
  const service = new DefaultSearchOrderingService(vault, () => fakeState([]));

  expect(await service.order([fileA, fileB])).toEqual([fileB, fileA]);
});

test("ignores open (unclosed) clocks for both recency and log presence", async () => {
  const taskA = taskMatch("a.md", 0);
  const fileB = fileMatch("b.md");

  const state = fakeState([
    logEntry({
      id: "1",
      parentId: createId("a.md", 0),
      start: "2024-01-05 09:00:00",
    }),
  ]);

  const service = new DefaultSearchOrderingService(fakeVault(), () => state);

  expect(await service.order([taskA, fileB])).toEqual([fileB, taskA]);
});
