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
import { useNewlyStartedTimeBlocks } from "./use-newly-started-time-blocks";

export function useTimeBlocks(props: {
  settingsStore: Writable<DayPlannerSettings>;
  isOnline: Readable<boolean>;
  currentTime: Readable<Moment>;
  workspaceFacade: WorkspaceFacade;
  onUpdate: OnUpdateFn;
  onEditAborted: OnEditAbortedFn;
  pointerDateTime: Readable<PointerDateTime>;
  remoteTimeBlocks: Readable<RemoteTimeBlock[]>;
  periodicNotes: PeriodicNotes;
  localTimeBlocks: Readable<EditableTimeBlock[]>;
}) {
  const {
    settingsStore,
    periodicNotes,
    currentTime,
    workspaceFacade,
    pointerDateTime,
    onUpdate,
    onEditAborted,
    remoteTimeBlocks,
    localTimeBlocks,
  } = props;

  const timeBlocksWithTimeForToday = derived(
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
    settingsStore,
    localTimeBlocks,
    remoteTimeBlocks,
    pointerDateTime,
    abortEditTrigger,
  });

  const newlyStartedTimeBlocks = useNewlyStartedTimeBlocks({
    settingsStore,
    timeBlocksWithTimeForToday,
    currentTime,
  });

  return {
    timeBlocksWithTimeForToday,
    editContext,
    newlyStartedTimeBlocks,
  };
}
