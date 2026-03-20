import { flushSync, untrack } from "svelte";
import { describe, expect, test } from "vitest";

import { editCanceled } from "../../src/redux/global-slice";
import { selectLogEntriesForDayKeys } from "../../src/redux/tracker/tracker-slice";

import { setUp } from "./setup";

describe("useSelector", () => {
  test("Returns values from the store", async () => {
    const { useSelector } = await setUp();

    const logEntries = useSelector((state) =>
      selectLogEntriesForDayKeys(state, ["2025-01-18"]),
    );

    expect(logEntries.current).toHaveLength(1);
  });

  test("Re-runs on reactive argument changes", async () => {
    const { useSelector } = await setUp();

    let activeDays = $state(["2025-01-18"]);

    const logEntries = useSelector((state) =>
      selectLogEntriesForDayKeys(state, activeDays),
    );

    expect(logEntries.current).toHaveLength(1);

    activeDays = ["2024-01-01"];

    expect(logEntries.current).toHaveLength(0);
  });

  test("Does not re-run on unrelated store changes", async () => {
    const { useSelector, dispatch } = await setUp();

    let calledCount = 0;
    let activeDays = $state(["2025-01-18"]);

    const logEntries = useSelector((state) =>
      selectLogEntriesForDayKeys(state, activeDays),
    );

    const derived = $derived.by(() => {
      calledCount++;

      return logEntries.current;
    });

    expect(derived).toHaveLength(1);
    expect(calledCount).toBe(1);

    dispatch(editCanceled());
    activeDays = ["2024-01-01"];

    expect(derived).toHaveLength(0);
    expect(calledCount).toBe(2);

    dispatch(editCanceled());

    expect(derived).toHaveLength(0);
    expect(calledCount).toBe(3);
  });

  // todo: need to update some Svelte & Vitest deps to make this work
  //  This is an example straight from Svelte docs
  //  Tried it on a clean svelte kit app, it still didn't work
  test.fails("Effects", () => {
    function logger(getValue: () => any) {
      const log: any[] = $state([]);

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
});
