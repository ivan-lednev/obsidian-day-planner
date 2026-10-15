import { describe, expect, test, vi } from "vitest";

import { DailyNoteExtensionService } from "../src/service/index/extensions/daily-note-extension-service";
import { ObsidianTasksExtensionService } from "../src/service/index/extensions/obsidian-tasks-extension-service";
import type { FileWithMetadata } from "../src/service/index/index-service";
import type { RawListItemEntryWithContext } from "../src/service/index/list-item-index-extension-service";
import type { PeriodicNotes } from "../src/service/periodic-notes";
import { defaultSettingsForTests } from "../src/settings";

describe("Shared planner note index", () => {
  test.each([true, false])(
    "Indexes the scheduled day once for task=%s even in a date-named note",
    (isTask) => {
      const path = "2025-07-19.md";
      const settings = {
        ...defaultSettingsForTests,
        plannerNotePath: path,
        plannerHeading: "",
      };
      const text = "09:00 - 10:00 Plan ⏳ 2025-07-20";
      const position = {
        start: { line: 0, col: 0, offset: 0 },
        end: { line: 0, col: text.length, offset: text.length },
      };
      const file: FileWithMetadata = { path, text, metadata: {} };
      const input: RawListItemEntryWithContext = {
        listItemCache: {
          position,
          parent: -1,
          ...(isTask ? { task: " " } : {}),
        },
        rawListItemEntry: {
          id: "plan",
          text,
          path,
          position,
          symbol: "-",
          ...(isTask ? { task: " " } : {}),
        },
        listItemText: text,
      };
      const periodicNotes = {
        getDateFromPath: vi.fn(() => window.moment("2025-07-19")),
      } as unknown as PeriodicNotes;

      expect(
        new DailyNoteExtensionService(periodicNotes, settings).forFile(file)(
          input,
        ),
      ).toEqual({});
      const result = new ObsidianTasksExtensionService(settings).forFile(file)(
        input,
      );
      expect(result.planEntries).toEqual([
        expect.objectContaining({ dayKeys: ["2025-07-20"] }),
      ]);
    },
  );
});
