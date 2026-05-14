import { describe, expect, test } from "vitest";

import { selectLogEntriesForDay } from "../../src/redux";
import { strictParse } from "../../src/util/moment";

import { setUp } from "./setup";

describe("useSelector", () => {
  test("Returns values from the store", async () => {
    const { useSelectorV2 } = await setUp();

    const logEntries = useSelectorV2((state) =>
      selectLogEntriesForDay(state, "2025-01-18", strictParse("2025-01-18")),
    );

    expect(logEntries.current).toHaveLength(1);
  });

  test("Re-runs on reactive argument changes", async () => {
    const { useSelectorV2 } = await setUp();

    let activeDay = $state("2025-01-18");

    const logEntries = useSelectorV2((state) =>
      selectLogEntriesForDay(state, activeDay, strictParse("2025-01-18")),
    );

    expect(logEntries.current).toHaveLength(1);

    activeDay = "2024-01-01";

    expect(logEntries.current).toHaveLength(0);
  });

  test.todo("Does not re-run on unrelated store changes");
});
