import { Function } from "effect";
import type { Moment } from "moment/moment";
import moment from "moment/moment";
import { writable } from "svelte/store";
import { vi } from "vitest";

import type { PeriodicNotes } from "../../../src/service/periodic-notes";
import { WorkspaceFacade } from "../../../src/service/workspace-facade";
import {
  type DayPlannerSettings,
  defaultSettingsForTests,
} from "../../../src/settings";
import type { EditableTimeBlock } from "../../../src/time-block-types";
import type { PointerDateTime } from "../../../src/types";
import { useEditContext } from "../../../src/ui/hooks/use-edit/use-edit-context";

import { baseTimeBlocks } from "./fixtures";

function createProps({
  timeBlocks,
  settings,
}: {
  timeBlocks: EditableTimeBlock[];
  settings: DayPlannerSettings;
}) {
  const onUpdate = vi.fn().mockResolvedValue(true);
  const onEditAborted = vi.fn();
  const workspaceFacade = vi.fn() as unknown as WorkspaceFacade;

  return {
    settingsStore: writable(settings),
    onUpdate,
    onEditAborted,
    workspaceFacade,
    abortEditTrigger: writable(),
    localTimeBlocks: writable(timeBlocks),
    remoteTimeBlocks: writable([]),
    pointerDateTime: writable<PointerDateTime>({
      dateTime: moment("2023-01-01 00:00"),
      type: "dateTime",
    }),
    periodicNotes: {
      getDateFromPath: vi.fn(() => null),
      getDailyNoteSettings: vi.fn(() => ({
        format: "YYYY-MM-DD",
        folder: ".",
      })),
    } as unknown as PeriodicNotes,
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
    handlers,
    dayToDisplayedTimeBlocks,
    getDisplayedAllDayTimeBlocksForMultiDayRow,
    confirmEdit,
  } = useEditContext(props);

  // this prevents the store from resetting;
  dayToDisplayedTimeBlocks.subscribe(Function.constVoid);
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

  return {
    handlers,
    moveCursorTo,
    dayToDisplayedTimeBlocks,
    getDisplayedAllDayTimeBlocksForMultiDayRow,
    confirmEdit,
    props,
  };
}
