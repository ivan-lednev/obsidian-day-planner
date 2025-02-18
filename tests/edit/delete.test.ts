import { get } from "svelte/store";
import { test, expect, describe } from "vitest";

import { EditMode } from "../../src/ui/hooks/use-edit/types";

import { dayKey } from "./util/fixtures";
import { setUp } from "./util/setup";
import { threeTasks } from "./util/test-utils";

describe("delete", () => {
  test("delete removes selected task without affecting other tasks", () => {
    const { handlers, dayToDisplayedTasks } = setUp({ tasks: threeTasks });

    handlers.handleGripMouseDown(threeTasks[1], EditMode.DELETE);

    expect(get(dayToDisplayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [threeTasks[0], threeTasks[2]],
      },
    });
  });
});
