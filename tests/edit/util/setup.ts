import { Function } from "effect";
import type { Moment } from "moment/moment";
import moment from "moment/moment";
import { get, writable } from "svelte/store";
import { vi } from "vitest";

import {
  type DayPlannerSettings,
  defaultSettingsForTests,
} from "../../../src/settings";
import type { EditableTimeBlock } from "../../../src/time-block-types";
import type { PointerDateTime } from "../../../src/types";
import { useEditContext } from "../../../src/ui/hooks/use-edit/use-edit-context";

import { baseTimeBlocks, day } from "./fixtures";

function createProps({
  timeBlocks,
  settings,
}: {
  timeBlocks: EditableTimeBlock[];
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
    logTimeBlocks: writable([]),
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
  settings = defaultSettingsForTests,
}: {
  timeBlocks?: EditableTimeBlock[];
  settings?: DayPlannerSettings;
} = {}) {
  const props = createProps({ timeBlocks, settings });
  const {
    lanes,
    getDisplayedTimeBlocksForTimeline,
    getDisplayedAllDayTimeBlocksForMultiDayRow,
    confirmEdit,
  } = useEditContext(props);

  const blocksForDay = getDisplayedTimeBlocksForTimeline(day);

  // this prevents the store from resetting;
  blocksForDay.subscribe(Function.constVoid);
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
    return get(getDisplayedTimeBlocksForTimeline(moment(dayKey)));
  }

  return {
    startEdit: lanes.plan.startEdit,
    startCreate: lanes.plan.startCreate,
    moveCursorTo,
    getBlocksForDay,
    getDisplayedAllDayTimeBlocksForMultiDayRow,
    confirmEdit,
    props,
  };
}
