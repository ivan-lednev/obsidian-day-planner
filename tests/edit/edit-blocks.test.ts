import { describe, expect, test } from "vitest";

import { editBlocks } from "../../src/ui/hooks/use-edit/transform/edit-blocks";

const blocks = [
  { id: "1", start: 0, end: 10 },
  { id: "2", start: 10, end: 20 },
  { id: "3", start: 20, end: 30 },
  { id: "4", start: 30, end: 40 },
];

describe("block transformations", () => {
  test("pushes next blocks", () => {
    const expectedBlocks = [
      { id: "1", start: 0, end: 10 },
      { id: "2", start: 20, end: 30 },
      { id: "3", start: 30, end: 40 },
      { id: "4", start: 40, end: 50 },
    ];

    expect(editBlocks(blocks, "2", 20, "move", "push")).toEqual(expectedBlocks);
  });

  test("pushes previous blocks", () => {
    const expectedBlocks = [
      { id: "1", start: -10, end: 0 },
      { id: "2", start: 0, end: 10 },
      { id: "3", start: 10, end: 20 },
      { id: "4", start: 30, end: 40 },
    ];

    expect(editBlocks(blocks, "3", 10, "move", "push")).toEqual(expectedBlocks);
  });

  test("shrinks next blocks", () => {
    const expectedBlocks = [
      { id: "1", start: 0, end: 10 },
      { id: "2", start: 20, end: 30 },
      { id: "3", start: 30, end: 35 },
      { id: "4", start: 35, end: 40 },
    ];

    expect(editBlocks(blocks, "2", 20, "move", "shrink")).toEqual(
      expectedBlocks,
    );
  });

  test("shrinks previous blocks", () => {
    const expectedBlocks = [
      { id: "1", start: 0, end: 5 },
      { id: "2", start: 5, end: 10 },
      { id: "3", start: 10, end: 20 },
      { id: "4", start: 30, end: 40 },
    ];

    expect(editBlocks(blocks, "3", 10, "move", "shrink")).toEqual(
      expectedBlocks,
    );
  });

  test("resize pushing the following blocks", () => {
    const expectedBlocks = [
      { id: "1", start: 0, end: 10 },
      { id: "2", start: 10, end: 40 },
      { id: "3", start: 40, end: 50 },
      { id: "4", start: 50, end: 60 },
    ];

    expect(editBlocks(blocks, "2", 40, "end", "push")).toEqual(expectedBlocks);
  });

  test("resize shrinking the preceding blocks", () => {
    const expectedBlocks = [
      { id: "1", start: 0, end: 5 },
      { id: "2", start: 5, end: 10 },
      { id: "3", start: 10, end: 30 },
      { id: "4", start: 30, end: 40 },
    ];

    expect(editBlocks(blocks, "3", 10, "start", "shrink")).toEqual(
      expectedBlocks,
    );
  });

  test("resize less than minimal duration", () => {
    const expectedBlocks = [
      { id: "1", start: 0, end: 10 },
      { id: "2", start: 40, end: 45 },
      { id: "3", start: 45, end: 55 },
      { id: "4", start: 55, end: 65 },
    ];

    expect(editBlocks(blocks, "2", 40, "start", "push")).toEqual(
      expectedBlocks,
    );
  });

  test("does not mess with other initially overlapping blocks", () => {
    const initialBlocks = [
      { id: "1", start: 0, end: 10 },
      { id: "2", start: 10, end: 40 },
      { id: "3", start: 30, end: 40 },
    ];

    const expectedBlocks = [
      { id: "1", start: 10, end: 20 },
      { id: "2", start: 20, end: 40 },
      { id: "3", start: 30, end: 40 },
    ];

    expect(editBlocks(initialBlocks, "1", 10, "move", "shrink")).toEqual(
      expectedBlocks,
    );
  });
});
