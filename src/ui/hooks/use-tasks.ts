import type { Moment } from "moment";
import { derived, type Readable, type Writable } from "svelte/store";

import type { PeriodicNotes } from "../../service/periodic-notes";
import { WorkspaceFacade } from "../../service/workspace-facade";
import type { DayPlannerSettings } from "../../settings";
import type { LocalTask, RemoteTask, Task, WithTime } from "../../task-types";
import type { OnEditAbortedFn, OnUpdateFn, PointerDateTime } from "../../types";
import { getUpdateTrigger } from "../../util/store";

import { useEditContext } from "./use-edit/use-edit-context";
import { useNewlyStartedTasks } from "./use-newly-started-tasks";

export function useTasks(props: {
  settingsStore: Writable<DayPlannerSettings>;
  isOnline: Readable<boolean>;
  currentTime: Readable<Moment>;
  workspaceFacade: WorkspaceFacade;
  onUpdate: OnUpdateFn;
  onEditAborted: OnEditAbortedFn;
  pointerDateTime: Readable<PointerDateTime>;
  dataviewChange: Readable<unknown>;
  remoteTasks: Readable<RemoteTask[]>;
  periodicNotes: PeriodicNotes;
  localTasks: Readable<LocalTask[]>;
}) {
  const {
    settingsStore,
    periodicNotes,
    currentTime,
    workspaceFacade,
    pointerDateTime,
    dataviewChange,
    onUpdate,
    onEditAborted,
    remoteTasks,
    localTasks,
  } = props;

  // const visibleDailyNotes = useVisibleDailyNotes(
  //   layoutReady,
  //   debouncedTaskUpdateTrigger,
  //   visibleDays,
  //   periodicNotes,
  // );
  //
  // const dataviewTasks = useDataviewTasks({
  //   dataviewFacade,
  //   metadataCache,
  //   settings: settingsStore,
  //   visibleDailyNotes,
  //   refreshSignal: debouncedTaskUpdateTrigger,
  // });
  //
  // const localTasks = useVisibleDataviewTasks(
  //   dataviewTasks,
  //   visibleDays,
  //   periodicNotes,
  // );

  const tasksWithTimeForToday = derived(
    [localTasks, remoteTasks, currentTime],
    ([$localTasks, $remoteTasks, $currentTime]: [Task[], Task[], Moment]) => {
      return $localTasks
        .concat($remoteTasks)
        .filter(
          (task): task is WithTime<Task> =>
            task.startTime.isSame($currentTime, "day") && !task.isAllDayEvent,
        );
    },
  );

  const abortEditTrigger = derived(
    [localTasks, dataviewChange],
    getUpdateTrigger,
  );

  const editContext = useEditContext({
    periodicNotes,
    workspaceFacade,
    onUpdate,
    onEditAborted,
    settings: settingsStore,
    localTasks,
    remoteTasks,
    pointerDateTime,
    abortEditTrigger,
  });

  const newlyStartedTasks = useNewlyStartedTasks({
    settings: settingsStore,
    tasksWithTimeForToday,
    currentTime,
  });

  return {
    tasksWithTimeForToday,
    editContext,
    newlyStartedTasks,
  };
}
