import moment from "moment";
import { get } from "svelte/store";
import { isNotVoid } from "typed-assert";
import { test, expect, describe } from "vitest";

import { dayKey, emptyTimeBlocks } from "./util/fixtures";
import { setUp } from "./util/setup";

function createUserInputPromise() {
  let resolve: ((succeeded: boolean) => void) | undefined;

  const promise = new Promise<boolean>((res) => {
    resolve = res;
  });

  isNotVoid(resolve);

  return { promise, resolve };
}

describe("create", () => {
  test("when creating and dragging, task duration changes", () => {
    const { startCreate, moveCursorTo, dayToDisplayedTimeBlocks } = setUp({
      timeBlocks: emptyTimeBlocks,
    });

    moveCursorTo(moment("2023-01-01 01:00"));
    startCreate();
    moveCursorTo(moment("2023-01-01 02:00"));

    expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
      [dayKey]: [
        {
          startTime: moment("2023-01-01 01:00"),
          durationMinutes: 60,
        },
      ],
    });
  });

  describe("text input modal", () => {
    test("phantom block is visible while waiting for text input", async () => {
      const {
        startCreate,
        moveCursorTo,
        dayToDisplayedTimeBlocks,
        confirmEdit,
        props,
      } = setUp({ timeBlocks: emptyTimeBlocks });

      const userInputPromise = createUserInputPromise();
      props.onUpdate.mockReturnValueOnce(userInputPromise.promise);

      moveCursorTo(moment("2023-01-01 01:00"));
      startCreate();
      moveCursorTo(moment("2023-01-01 02:00"));

      const pendingConfirm = confirmEdit();

      expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
        [dayKey]: [
          expect.objectContaining({
            startTime: moment("2023-01-01 01:00"),
            durationMinutes: 60,
          }),
        ],
      });

      userInputPromise.resolve(true);
      await pendingConfirm;
    });

    test("phantom block disappears after text input is canceled", async () => {
      const {
        startCreate,
        moveCursorTo,
        dayToDisplayedTimeBlocks,
        confirmEdit,
        props,
      } = setUp({ timeBlocks: emptyTimeBlocks });

      const userInputPromise = createUserInputPromise();
      props.onUpdate.mockReturnValueOnce(userInputPromise.promise);

      moveCursorTo(moment("2023-01-01 01:00"));
      startCreate();
      moveCursorTo(moment("2023-01-01 02:00"));

      const pendingConfirm = confirmEdit();
      userInputPromise.resolve(false);
      await pendingConfirm;

      const timeBlocks = get(dayToDisplayedTimeBlocks)[dayKey] ?? [];
      expect(timeBlocks).toHaveLength(0);
    });
  });
});
