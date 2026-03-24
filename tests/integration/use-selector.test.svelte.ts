import { flushSync, untrack } from "svelte";
import { describe, expect, test } from "vitest";

import { selectLogEntriesForDay } from "../../src/redux";
import { strictParse } from "../../src/util/moment";

import { setUp } from "./setup";

describe("useSelector", () => {
  test.skip("Returns values from the store", async () => {
    const { useSelector } = await setUp();

    const logEntries = useSelector((state) =>
      selectLogEntriesForDay(state, "2025-01-18", strictParse("2025-01-18")),
    );

    expect(logEntries.current).toHaveLength(1);
  });

  test.skip("Re-runs on reactive argument changes", async () => {
    const { useSelector } = await setUp();

    let activeDay = $state("2025-01-18");

    const logEntries = useSelector((state) =>
      selectLogEntriesForDay(state, activeDay, strictParse("2025-01-18")),
    );

    expect(logEntries.current).toHaveLength(1);

    activeDay = "2024-01-01";

    expect(logEntries.current).toHaveLength(0);
  });

  // todo: need to update some Svelte & Vitest deps to make this work
  //  This is an example straight from Svelte docs
  //  Tried it on a clean svelte kit app, it still didn't work
  test.fails("Effects can be tested", () => {
    function logger(getValue: () => number) {
      const log: number[] = $state([]);

      $effect(() => {
        const v = getValue();
        untrack(() => {
          log.push(v);
        });
      });

      return log;
    }

    const cleanup = $effect.root(() => {
      let count = $state(0);
      flushSync();

      // logger uses an $effect to log updates of its input
      const log = logger(() => count);

      // effects normally run after a microtask,
      // use flushSync to execute all pending effects synchronously
      flushSync();
      expect(log).toEqual([0]);

      count = 1;
      flushSync();

      expect(log).toEqual([0, 1]);
    });

    cleanup();
  });

  test.todo("Does not re-run on unrelated store changes");
});
