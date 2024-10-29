import moment from "moment";
import { test, expect } from "vitest";

import { computeOverlap } from "../src/overlap/overlap";

test("simple case", () => {
  expect(
    computeOverlap([
      { id: "1", startTime: moment("2023-01-01 00:01"), durationMinutes: 2 },
      { id: "2", startTime: moment("2023-01-01 00:02"), durationMinutes: 2 },
    ]),
  ).toEqual(
    new Map([
      ["1", { start: 0, span: 1, columns: 2 }],
      ["2", { start: 1, span: 1, columns: 2 }],
    ]),
  );
});

test("3 tasks overlapping with each other", () => {
  expect(
    computeOverlap([
      { id: "1", startTime: moment("2023-01-01 00:01"), durationMinutes: 3 },
      { id: "2", startTime: moment("2023-01-01 00:02"), durationMinutes: 2 },
      { id: "3", startTime: moment("2023-01-01 00:03"), durationMinutes: 1 },
    ]),
  ).toEqual(
    new Map([
      ["1", { start: 0, span: 1, columns: 3 }],
      ["2", { start: 1, span: 1, columns: 3 }],
      ["3", { start: 2, span: 1, columns: 3 }],
    ]),
  );
});

/*
┌──────┐
│      │
│      │
│      │ ┌──────┐
│      │ │      │
│      │ │      │
│      │ │      │
│      │ │      │
└──────┘ │      │
         │      │
┌──────┐ │      │
│      │ │      │
│      │ └──────┘
│      │
│      │
└──────┘
*/
test("3 tasks overlapping with next one, but not with each other", () => {
  expect(
    computeOverlap([
      { id: "1", startTime: moment("2023-01-01 00:01"), durationMinutes: 2 },
      { id: "2", startTime: moment("2023-01-01 00:02"), durationMinutes: 3 },
      { id: "3", startTime: moment("2023-01-01 00:04"), durationMinutes: 2 },
    ]),
  ).toEqual(
    new Map([
      ["1", { start: 0, span: 1, columns: 2 }],
      ["2", { start: 1, span: 1, columns: 2 }],
      ["3", { start: 0, span: 1, columns: 2 }],
    ]),
  );
});

/*
┌──────┐
│      │ ┌──────┐
│      │ │      │
│      │ └──────┘
│      │
│      │ ┌──────┐
└──────┘ │      │
         │      │
         └──────┘
*/
test("1st overlaps with 2nd and 3rd, but they don't overlap with each other", () => {
  expect(
    computeOverlap([
      { id: "1", startTime: moment("2023-01-01 00:01"), durationMinutes: 5 },
      { id: "2", startTime: moment("2023-01-01 00:02"), durationMinutes: 1 },
      { id: "3", startTime: moment("2023-01-01 00:04"), durationMinutes: 3 },
    ]),
  ).toEqual(
    new Map([
      ["1", { start: 0, span: 1, columns: 2 }],
      ["2", { start: 1, span: 1, columns: 2 }],
      ["3", { start: 1, span: 1, columns: 2 }],
    ]),
  );
});

/*
┌──────┐
│      │
│  1   │
│      │ ┌──────┐
│      │ │      │
│      │ │      │ ┌──────┐
│      │ │  2   │ │      │
│      │ │      │ │3     │
└──────┘ │      │ │      │
         │      │ │      │
         │      │ │      │
         │      │ │      │
         ├──────┤ │      │
┌────────┴──────┤ │      │
│     4         │ │      │
│               │ └──────┘
└───────────────┘
*/
test("2 groups: one with 3 items, other with 2. One item is in both groups (fractions get distributed)", () => {
  expect(
    computeOverlap([
      { id: "1", startTime: moment("2023-01-01 00:01"), durationMinutes: 3 },
      { id: "2", startTime: moment("2023-01-01 00:02"), durationMinutes: 3 },
      { id: "3", startTime: moment("2023-01-01 00:03"), durationMinutes: 5 },
      { id: "4", startTime: moment("2023-01-01 00:07"), durationMinutes: 2 },
    ]),
  ).toEqual(
    new Map([
      ["1", { start: 0, span: 1, columns: 3 }],
      ["2", { start: 1, span: 1, columns: 3 }],
      ["3", { start: 2, span: 1, columns: 3 }],
      ["4", { start: 0, span: 2, columns: 3 }],
    ]),
  );
});

/*
┌─────┐ ┌─────┐ ┌────┐
│     │ │     │ │    │
│     │ │  2  │ │    │
│ 1   │ │     │ │ 3  │
│     │ │     │ │    │
│     │ │     │ │    │
│     │ └─────┘ └────┘
│     │
│     │  ┌───────────┐
│     │  │    4      │
└─────┘  └───────────┘
 */
test("2 groups: one with 3 items, other with 2 with second after first", () => {
  expect(
    computeOverlap([
      { id: "1", startTime: moment("2023-01-01 00:01"), durationMinutes: 4 },
      { id: "2", startTime: moment("2023-01-01 00:01"), durationMinutes: 2 },
      { id: "3", startTime: moment("2023-01-01 00:01"), durationMinutes: 2 },
      { id: "4", startTime: moment("2023-01-01 00:04"), durationMinutes: 1 },
    ]),
  ).toEqual(
    new Map([
      ["1", { start: 0, span: 1, columns: 3 }],
      ["2", { start: 1, span: 1, columns: 3 }],
      ["3", { start: 2, span: 1, columns: 3 }],
      ["4", { start: 1, span: 2, columns: 3 }],
    ]),
  );
});

/*
┌──────┐  ┌───────────┐
│      │  │      2    │
│   1  │  └───────────┘
│      │
│      │ ┌─────┐
│      │ │  3  │
│      │ │     │ ┌────┐
│      │ │     │ │    │
└──────┘ │     │ │  4 │
         └─────┘ │    │
                 │    │
┌──────────────┐ │    │
│     5        │ │    │
│              │ └────┘
└──────────────┘
*/
test("combined case", () => {
  expect(
    computeOverlap([
      { id: "1", startTime: moment("2023-01-01 00:01"), durationMinutes: 7 },
      { id: "2", startTime: moment("2023-01-01 00:02"), durationMinutes: 1 },
      { id: "3", startTime: moment("2023-01-01 00:04"), durationMinutes: 4 },
      { id: "4", startTime: moment("2023-01-01 00:05"), durationMinutes: 5 },
      { id: "5", startTime: moment("2023-01-01 00:09"), durationMinutes: 2 },
    ]),
  ).toEqual(
    new Map([
      ["1", { start: 0, span: 1, columns: 2 }],
      ["2", { start: 1, span: 1, columns: 2 }],
      ["3", { start: 2, span: 1, columns: 4 }],
      ["4", { start: 3, span: 1, columns: 4 }],
      ["5", { start: 0, span: 3, columns: 4 }],
    ]),
  );
});

/*
┌─────┐
│     │
│     │ ┌─────┐
│     │ │     │
│  1  │ │     │ ┌─────┐
│     │ │  2  │ │     │
│     │ │     │ │     │
└─────┘ │     │ │   3 │
        │     │ │     │
        │     │ │     │
        ├┬─┬──┤ │     │
┌───┐ ┌─┴┤ ├──┤ │     │
│   │ │  │ │  │ │     │
│ 4 │ │ 5│ │6 │ │     │
│   │ │  │ │  │ │     │
│   │ │  │ │  │ │     │
└───┘ └──┘ └──┘ └─────┘
*/
test("more complex splitting of available space", () => {
  expect(
    computeOverlap([
      { id: "1", startTime: moment("2023-01-01 00:01"), durationMinutes: 5 },
      { id: "2", startTime: moment("2023-01-01 00:02"), durationMinutes: 4 },
      { id: "3", startTime: moment("2023-01-01 00:03"), durationMinutes: 6 },
      { id: "4", startTime: moment("2023-01-01 00:07"), durationMinutes: 2 },
      { id: "5", startTime: moment("2023-01-01 00:07"), durationMinutes: 2 },
      { id: "6", startTime: moment("2023-01-01 00:07"), durationMinutes: 2 },
    ]),
  ).toEqual(
    new Map([
      ["1", { start: 0, columns: 3, span: 1 }],
      ["2", { start: 1, columns: 3, span: 1 }],
      ["3", { start: 2, columns: 3, span: 1 }],
      ["4", { start: 0, columns: 9, span: 2 }],
      ["5", { start: 2, columns: 9, span: 2 }],
      ["6", { start: 4, columns: 9, span: 2 }],
    ]),
  );
});

/*
┌────┐
│ 1  │  ┌────┐
│    │  │  2 │ ┌3────┐
└────┘  │    │ └─────┘
        │    │
┌─────┐ │    │
│  4  │ │    │
└─────┘ └────┘
 */
test("stops at first occupied slot from previous group", () => {
  expect(
    computeOverlap([
      { id: "1", startTime: moment("2023-01-01 00:01"), durationMinutes: 3 },
      { id: "2", startTime: moment("2023-01-01 00:02"), durationMinutes: 4 },
      { id: "3", startTime: moment("2023-01-01 00:03"), durationMinutes: 1 },
      { id: "4", startTime: moment("2023-01-01 00:05"), durationMinutes: 1 },
    ]),
  ).toEqual(
    new Map([
      ["1", { start: 0, columns: 3, span: 1 }],
      ["2", { start: 1, columns: 3, span: 1 }],
      ["3", { start: 2, columns: 3, span: 1 }],
      ["4", { start: 0, columns: 3, span: 1 }],
    ]),
  );
});
