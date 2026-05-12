import moment from "moment";
import { get } from "svelte/store";
import { isNotVoid } from "typed-assert";
import { test, expect, describe } from "vitest";

import { dayKey, emptyTasks } from "./util/fixtures";
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
    const { handlers, moveCursorTo, dayToDisplayedTasks } = setUp({
      tasks: emptyTasks,
    });

    moveCursorTo(moment("2023-01-01 01:00"));
    handlers.handleContainerMouseDown();
    moveCursorTo(moment("2023-01-01 02:00"));

    expect(get(dayToDisplayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [
          {
            startTime: moment("2023-01-01 01:00"),
            durationMinutes: 60,
          },
        ],
      },
    });
  });

  describe("text input modal", () => {
    test("phantom block is visible while waiting for text input", async () => {
      const {
        handlers,
        moveCursorTo,
        dayToDisplayedTasks,
        confirmEdit,
        props,
      } = setUp({ tasks: emptyTasks });

      const userInputPromise = createUserInputPromise();
      props.onUpdate.mockReturnValueOnce(userInputPromise.promise);

      moveCursorTo(moment("2023-01-01 01:00"));
      handlers.handleContainerMouseDown();
      moveCursorTo(moment("2023-01-01 02:00"));

      const pendingConfirm = confirmEdit();

      expect(get(dayToDisplayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
            expect.objectContaining({
              startTime: moment("2023-01-01 01:00"),
              durationMinutes: 60,
            }),
          ],
        },
      });

      userInputPromise.resolve(true);
      await pendingConfirm;
    });

    test("phantom block disappears after text input is canceled", async () => {
      const {
        handlers,
        moveCursorTo,
        dayToDisplayedTasks,
        confirmEdit,
        props,
      } = setUp({ tasks: emptyTasks });

      const userInputPromise = createUserInputPromise();
      props.onUpdate.mockReturnValueOnce(userInputPromise.promise);

      moveCursorTo(moment("2023-01-01 01:00"));
      handlers.handleContainerMouseDown();
      moveCursorTo(moment("2023-01-01 02:00"));

      const pendingConfirm = confirmEdit();
      userInputPromise.resolve(false);
      await pendingConfirm;

      const withTime = get(dayToDisplayedTasks)[dayKey]?.withTime ?? [];
      expect(withTime).toHaveLength(0);
    });
  });
});
