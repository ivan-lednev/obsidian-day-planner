import { describe, expect, test, vi } from "vitest";

import {
  removeFromMeetingNoteIndex,
  renameInMeetingNoteIndex,
} from "../src/util/meeting-note";

vi.mock("obsidian", () => ({}));

describe("meeting note index", () => {
  test("follows renamed notes", () => {
    expect(
      renameInMeetingNoteIndex(
        { a: "Meetings/a.md", b: "Meetings/b.md" },
        "Meetings/a.md",
        "Meetings/renamed.md",
      ),
    ).toEqual({ a: "Meetings/renamed.md", b: "Meetings/b.md" });
  });

  test("follows renamed folders", () => {
    expect(
      renameInMeetingNoteIndex(
        { a: "Meetings/a.md", b: "Meetings Old/b.md" },
        "Meetings",
        "Work/Meetings",
      ),
    ).toEqual({ a: "Work/Meetings/a.md", b: "Meetings Old/b.md" });
  });

  test("forgets deleted notes and folders", () => {
    const index = {
      a: "Meetings/a.md",
      b: "Meetings/2025/b.md",
      c: "Other/c.md",
    };

    expect(removeFromMeetingNoteIndex(index, "Meetings/a.md")).toEqual({
      b: "Meetings/2025/b.md",
      c: "Other/c.md",
    });
    expect(removeFromMeetingNoteIndex(index, "Meetings")).toEqual({
      c: "Other/c.md",
    });
  });
});
