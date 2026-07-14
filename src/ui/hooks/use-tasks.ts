import type { Moment } from "moment";
import { derived, type Readable, type Writable } from "svelte/store";

import type { PeriodicNotes } from "../../service/periodic-notes";
import { WorkspaceFacade } from "../../service/workspace-facade";
import type { DayPlannerSettings } from "../../settings";
import type {
  EditableTimeBlock,
  RemoteTimeBlock,
  TimeBlock,
  WithDuration,
} from "../../time-block-types";
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
  remoteTasks: Readable<RemoteTimeBlock[]>;
  periodicNotes: PeriodicNotes;
  localTasks: Readable<EditableTimeBlock[]>;
}) {
  const {
    settingsStore,
    periodicNotes,
    currentTime,
    workspaceFacade,
    pointerDateTime,
    onUpdate,
    onEditAborted,
    remoteTasks: remoteTimeBlocks,
    localTasks: localTimeBlocks,
  } = props;

  const tasksWithTimeForToday = derived(
    [localTimeBlocks, remoteTimeBlocks, currentTime],
    ([$localTimeBlocks, $remoteTimeBlocks, $currentTime]: [
      TimeBlock[],
      TimeBlock[],
      Moment,
    ]) => {
      return $localTimeBlocks
        .concat($remoteTimeBlocks)
        .filter(
          (timeBlock): timeBlock is WithDuration<TimeBlock> =>
            timeBlock.startTime.isSame($currentTime, "day") &&
            !timeBlock.isAllDayEvent,
        );
    },
  );

  const abortEditTrigger = derived(localTimeBlocks, getUpdateTrigger);

  const editContext = useEditContext({
    periodicNotes,
    workspaceFacade,
    onUpdate,
    onEditAborted,
    settings: settingsStore,
    localTasks: localTimeBlocks,
    remoteTasks: remoteTimeBlocks,
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
