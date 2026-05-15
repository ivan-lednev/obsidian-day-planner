import { combineSlices, configureStore, createSlice } from "@reduxjs/toolkit";
import { flushSync } from "svelte";
import { describe, expect, test, vi } from "vitest";

import { createUseSelector } from "../../src/redux/use-selector";

const rootSlice = createSlice({
  name: "test",
  initialState: { items: ["a", "b"], unrelated: 0 },
  reducers: {
    unrelatedUpdated: (state) => {
      state.unrelated += 1;
    },
    itemAppended: (state, action: { payload: string }) => {
      state.items.push(action.payload);
    },
    itemReplaced: (
      state,
      action: { payload: { index: number; value: string } },
    ) => {
      state.items[action.payload.index] = action.payload.value;
    },
  },
  selectors: {
    selectItem: (state, index: number) => state.items[index],
    selectItems: (state) => state.items,
    selectItemCount: (state) => state.items.length,
  },
});

const { selectItem, selectItems, selectItemCount } = rootSlice.selectors;
const { unrelatedUpdated, itemAppended, itemReplaced } = rootSlice.actions;

const rootReducer = combineSlices(rootSlice);

type RootState = ReturnType<typeof rootReducer>;

function createTestStore() {
  const store = configureStore({ reducer: rootReducer });

  return {
    store,
    useSelector: createUseSelector<RootState>(store),
    dispatch: store.dispatch,
  };
}

describe("useSelector", () => {
  test("Re-runs on reactive argument changes", () => {
    const { useSelector } = createTestStore();

    let index = $state(0);

    const result = useSelector((state) => selectItem(state, index));

    expect(result.current).toBe("a");

    index = 1;

    expect(result.current).toBe("b");
  });

  test("Re-runs effects when the selected value changes", () => {
    const { useSelector, dispatch } = createTestStore();

    const result = useSelector((state) => selectItem(state, 0));

    let observed: string | undefined;
    let calledTimes = 0;

    $effect.root(() => {
      $effect(() => {
        observed = result.current;
        calledTimes++;
      });

      flushSync();

      expect(observed).toBe("a");
      expect(calledTimes).toBe(1);

      dispatch(itemReplaced({ index: 0, value: "z" }));
      flushSync();

      expect(observed).toBe("z");
      expect(calledTimes).toBe(2);
    });
  });

  test("Reflects dispatched changes when read outside an effect", () => {
    const { useSelector, dispatch } = createTestStore();

    const count = useSelector((state) => selectItemCount(state));

    expect(count.current).toBe(2);

    dispatch(itemAppended("c"));

    expect(count.current).toBe(3);
  });

  test("Supports multiple independent selectors on the same store", () => {
    const { useSelector, dispatch } = createTestStore();

    const first = useSelector((state) => selectItem(state, 0));
    const second = useSelector((state) => selectItem(state, 1));

    let firstCalls = 0;
    let secondCalls = 0;

    $effect.root(() => {
      $effect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        first.current;
        firstCalls++;
      });

      $effect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        second.current;
        secondCalls++;
      });

      flushSync();

      expect(firstCalls).toBe(1);
      expect(secondCalls).toBe(1);

      dispatch(itemReplaced({ index: 1, value: "z" }));
      flushSync();

      expect(first.current).toBe("a");
      expect(second.current).toBe("z");
      expect(firstCalls).toBe(1);
      expect(secondCalls).toBe(2);
    });
  });

  test("Unsubscribes from the store after the tracking effect is destroyed", async () => {
    const { useSelector, dispatch } = createTestStore();

    const selector = vi.fn((state: RootState) => selectItem(state, 0));
    const result = useSelector(selector);

    const destroy = $effect.root(() => {
      $effect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        result.current;
      });
    });

    flushSync();

    expect(selector).toHaveBeenCalledTimes(1);

    destroy();
    flushSync();
    selector.mockClear();

    dispatch(itemReplaced({ index: 0, value: "z" }));

    expect(selector).toHaveBeenCalledTimes(0);
  });

  test("Returns stable reference when the selected slice did not change", () => {
    const { useSelector, dispatch } = createTestStore();

    const items = useSelector((state) => selectItems(state));

    const before = items.current;

    dispatch(unrelatedUpdated());

    expect(items.current).toBe(before);
  });

  test("Does not run until first subscription", () => {
    const { useSelector } = createTestStore();

    const selector = vi.fn((state: RootState) => selectItem(state, 0));

    const result = useSelector(selector);

    expect(selector).not.toHaveBeenCalled();

    expect(result.current).toBe("a");

    expect(selector).toHaveBeenCalledTimes(1);
  });
});
