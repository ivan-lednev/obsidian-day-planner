import { computeOverlap } from "./overlap";

test("simple case", () => {
  expect(
    computeOverlap([
      { id: "1", startMinutes: 1, endMinutes: 3 },
      { id: "2", startMinutes: 2, endMinutes: 4 },
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
      { id: "1", startMinutes: 1, endMinutes: 4 },
      { id: "2", startMinutes: 2, endMinutes: 4 },
      { id: "3", startMinutes: 3, endMinutes: 4 },
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
      { id: "1", startMinutes: 1, endMinutes: 3 },
      { id: "2", startMinutes: 2, endMinutes: 5 },
      { id: "3", startMinutes: 4, endMinutes: 6 },
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
      { id: "1", startMinutes: 1, endMinutes: 6 },
      { id: "2", startMinutes: 2, endMinutes: 3 },
      { id: "3", startMinutes: 4, endMinutes: 7 },
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
      { id: "1", startMinutes: 1, endMinutes: 4 },
      { id: "2", startMinutes: 2, endMinutes: 5 },
      { id: "3", startMinutes: 3, endMinutes: 8 },
      { id: "4", startMinutes: 7, endMinutes: 9 },
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
      { id: "1", startMinutes: 1, endMinutes: 5 },
      { id: "2", startMinutes: 1, endMinutes: 3 },
      { id: "3", startMinutes: 1, endMinutes: 3 },
      { id: "4", startMinutes: 4, endMinutes: 5 },
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
      { id: "1", startMinutes: 1, endMinutes: 8 },
      { id: "2", startMinutes: 2, endMinutes: 3 },
      { id: "3", startMinutes: 4, endMinutes: 8 },
      { id: "4", startMinutes: 5, endMinutes: 10 },
      { id: "5", startMinutes: 9, endMinutes: 11 },
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
      { id: "1", startMinutes: 1, endMinutes: 6 },
      { id: "2", startMinutes: 2, endMinutes: 6 },
      { id: "3", startMinutes: 3, endMinutes: 9 },
      { id: "4", startMinutes: 7, endMinutes: 9 },
      { id: "5", startMinutes: 7, endMinutes: 9 },
      { id: "6", startMinutes: 7, endMinutes: 9 },
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
      { id: "1", startMinutes: 1, endMinutes: 4 },
      { id: "2", startMinutes: 2, endMinutes: 6 },
      { id: "3", startMinutes: 3, endMinutes: 4 },
      { id: "4", startMinutes: 5, endMinutes: 6 },
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

test.todo(
  "rare edge case: middle slot of the second group is occupied by an item from the first group",
);
