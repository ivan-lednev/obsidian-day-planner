import { Function } from "effect";
import type { Moment } from "moment/moment";
import moment from "moment/moment";
import { get, writable } from "svelte/store";
import { vi } from "vitest";

import {
  type DayPlannerSettings,
  defaultSettingsForTests,
} from "../../../src/settings";
import type {
  EditableTimeBlock,
  LogTimeBlock,
} from "../../../src/time-block-types";
import type { PointerDateTime } from "../../../src/types";
import { useEditContext } from "../../../src/ui/hooks/use-edit/use-edit-context";

import { baseTimeBlocks, day, emptyLogTimeBlocks } from "./fixtures";

function createProps({
  timeBlocks,
  logTimeBlocks,
  settings,
}: {
  timeBlocks: EditableTimeBlock[];
  logTimeBlocks: LogTimeBlock[];
  settings: DayPlannerSettings;
}) {
  const onUpdate = vi.fn().mockResolvedValue(true);
  const onLogUpdate = vi.fn().mockResolvedValue(true);
  const onEditAborted = vi.fn();

  return {
    settingsStore: writable(settings),
    onUpdate,
    onLogUpdate,
    onEditAborted,
    abortEditTrigger: writable(),
    localTimeBlocks: writable(timeBlocks),
    logTimeBlocks: writable(logTimeBlocks),
    remoteTimeBlocks: writable([]),
    currentTime: writable(moment("2023-01-01 00:00")),
    pointerDateTime: writable<PointerDateTime>({
      dateTime: moment("2023-01-01 00:00"),
      type: "dateTime",
    }),
  };
}

export function setUp({
  timeBlocks = baseTimeBlocks,
  logTimeBlocks = emptyLogTimeBlocks,
  settings = defaultSettingsForTests,
}: {
  timeBlocks?: EditableTimeBlock[];
  logTimeBlocks?: LogTimeBlock[];
  settings?: DayPlannerSettings;
} = {}) {
  const props = createProps({ timeBlocks, logTimeBlocks, settings });
  const { lanes, getDisplayedAllDayTimeBlocksForMultiDayRow, confirmEdit } =
    useEditContext(props);

  const blocksForDay = lanes.plan.getTimeBlocksForDay(day);
  const logBlocksForDay = lanes.log.getTimeBlocksForDay(day);

  // this prevents the store from resetting;
  blocksForDay.subscribe(Function.constVoid);
  logBlocksForDay.subscribe(Function.constVoid);
  getDisplayedAllDayTimeBlocksForMultiDayRow.subscribe(Function.constVoid);

  function moveCursorTo(
    dateTime: Moment,
    type: "date" | "dateTime" = "dateTime",
  ) {
    props.pointerDateTime.set({
      dateTime,
      type,
    });
  }

  function getBlocksForDay(dayKey: string) {
    return get(lanes.plan.getTimeBlocksForDay(moment(dayKey)));
  }

  function getLogBlocksForDay(dayKey: string) {
    return get(lanes.log.getTimeBlocksForDay(moment(dayKey)));
  }

  return {
    startEdit: lanes.plan.startEdit,
    startCreate: lanes.plan.startCreate,
    startLogEdit: lanes.log.startEdit,
    startLogCreate: lanes.log.startCreate,
    moveCursorTo,
    getBlocksForDay,
    getLogBlocksForDay,
    getDisplayedAllDayTimeBlocksForMultiDayRow,
    confirmEdit,
    props,
  };
}
