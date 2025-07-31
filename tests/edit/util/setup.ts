import { noop } from "lodash/fp";
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
import type { LocalTask } from "../../../src/task-types";
import type { PointerDateTime } from "../../../src/types";
import { useEditContext } from "../../../src/ui/hooks/use-edit/use-edit-context";

import { baseTasks } from "./fixtures";

function createProps({
  tasks,
  settings,
}: {
  tasks: LocalTask[];
  settings: DayPlannerSettings;
}) {
  const onUpdate = vi.fn();
  const onEditAborted = vi.fn();
  const workspaceFacade = vi.fn() as unknown as WorkspaceFacade;

  return {
    settings: writable(settings),
    onUpdate,
    onEditAborted,
    workspaceFacade,
    abortEditTrigger: writable(),
    localTasks: writable(tasks),
    remoteTasks: writable([]),
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
  tasks = baseTasks,
  settings = defaultSettingsForTests,
} = {}) {
  const props = createProps({ tasks, settings });
  const {
    handlers,
    dayToDisplayedTasks,
    getDisplayedAllDayTasksForMultiDayRow,
    confirmEdit,
  } = useEditContext(props);

  // this prevents the store from resetting;
  dayToDisplayedTasks.subscribe(noop);
  getDisplayedAllDayTasksForMultiDayRow.subscribe(noop);

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
    dayToDisplayedTasks,
    getDisplayedAllDayTasksForMultiDayRow,
    confirmEdit,
    props,
  };
}
