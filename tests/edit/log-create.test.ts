import moment from "moment";
import { test, expect, describe } from "vitest";

import { EditMode } from "../../src/ui/hooks/use-edit/types";

import {
  createLogTimeBlock,
  dayKey,
  emptyLogTimeBlocks,
} from "./util/fixtures";
import { setUp } from "./util/setup";

describe("create in the tracker", () => {
  test("when creating and dragging, clock duration changes", () => {
    const { startLogCreate, moveCursorTo, getLogBlocksForDay } = setUp({
      logTimeBlocks: emptyLogTimeBlocks,
    });

    moveCursorTo(moment("2023-01-01 01:00"));
    startLogCreate();
    moveCursorTo(moment("2023-01-01 02:00"));

    expect(getLogBlocksForDay(dayKey)).toMatchObject([
      {
        source: "unwrittenLog",
        startTime: moment("2023-01-01 01:00"),
        durationMinutes: 60,
      },
    ]);
  });

  test("existing clocks stay put while a new one is dragged out", () => {
    const { startLogCreate, moveCursorTo, getLogBlocksForDay } = setUp({
      logTimeBlocks: [
        createLogTimeBlock("1", { startTime: moment("2023-01-01 01:00") }),
      ],
    });

    moveCursorTo(moment("2023-01-01 03:00"));
    startLogCreate();
    moveCursorTo(moment("2023-01-01 04:00"));

    expect(getLogBlocksForDay(dayKey)).toMatchObject([
      { id: "1", startTime: moment("2023-01-01 01:00"), durationMinutes: 60 },
      {
        source: "unwrittenLog",
        startTime: moment("2023-01-01 03:00"),
        durationMinutes: 60,
      },
    ]);
  });

  test("the new clock goes to the log update handler in create mode", async () => {
    const { startLogCreate, moveCursorTo, confirmEdit, props } = setUp({
      logTimeBlocks: emptyLogTimeBlocks,
    });

    moveCursorTo(moment("2023-01-01 01:00"));
    startLogCreate();
    moveCursorTo(moment("2023-01-01 02:00"));

    await confirmEdit();

    expect(props.onLogUpdate).toHaveBeenCalledWith(
      [],
      [
        expect.objectContaining({
          source: "unwrittenLog",
          startTime: moment("2023-01-01 01:00"),
          durationMinutes: 60,
        }),
      ],
      EditMode.CREATE,
    );
  });

  test("the phantom clock disappears when the user dismisses the target picker", async () => {
    const {
      startLogCreate,
      moveCursorTo,
      getLogBlocksForDay,
      confirmEdit,
      props,
    } = setUp({ logTimeBlocks: emptyLogTimeBlocks });

    props.onLogUpdate.mockResolvedValueOnce(false);

    moveCursorTo(moment("2023-01-01 01:00"));
    startLogCreate();
    moveCursorTo(moment("2023-01-01 02:00"));

    await confirmEdit();

    expect(getLogBlocksForDay(dayKey)).toHaveLength(0);
  });
});
