import { describe, expect, test } from "vitest";

import { getDateFromDailyNotePathWorkaround } from "../src/service/daily-note-path-workaround";

describe("getDateFromDailyNotePathWorkaround", () => {
  test("parses dates that live in folder segments of the format", () => {
    const format = "YYYY/[Daily]/MM-MMM/DD-ddd";

    expect(
      getDateFromDailyNotePathWorkaround({
        path: "2023/Daily/11-Nov/22-Wed.md",
        format,
      })?.format("YYYY-MM-DD"),
    ).toBe("2023-11-22");

    expect(
      getDateFromDailyNotePathWorkaround({
        path: "2023/Daily/02-Feb/22-Wed.md",
        format,
      })?.format("YYYY-MM-DD"),
    ).toBe("2023-02-22");
  });

  test("distinguishes notes with the same basename in different folders", () => {
    const format = "YYYY/[Daily]/MM-MMM/DD-ddd";

    const first = getDateFromDailyNotePathWorkaround({
      path: "2023/Daily/11-Nov/22-Wed.md",
      format,
    });
    const second = getDateFromDailyNotePathWorkaround({
      path: "2023/Daily/02-Feb/22-Wed.md",
      format,
    });

    expect(first?.isSame(second, "day")).toBe(false);
  });

  test("strips the configured daily notes folder before parsing", () => {
    const format = "YYYY/MM/DD";

    expect(
      getDateFromDailyNotePathWorkaround({
        path: "journal/2023/11/22.md",
        format,
        folder: "journal",
      })?.format("YYYY-MM-DD"),
    ).toBe("2023-11-22");
  });

  test("returns null when the path is outside the daily notes folder", () => {
    expect(
      getDateFromDailyNotePathWorkaround({
        path: "notes/2023-11-22.md",
        format: "YYYY-MM-DD",
        folder: "journal",
      }),
    ).toBeNull();
  });

  test("parses basename-only formats", () => {
    expect(
      getDateFromDailyNotePathWorkaround({
        path: "2023-11-22.md",
        format: "YYYY-MM-DD",
      })?.format("YYYY-MM-DD"),
    ).toBe("2023-11-22");
  });
});
