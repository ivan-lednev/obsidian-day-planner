import type { Moment } from "moment";
import { derived, type Readable, type Writable } from "svelte/store";

import type { DayPlannerSettings } from "../../settings";
import type {
  EditableLogTimeBlock,
  EditableTimeBlock,
  LogTimeBlock,
  RemoteTimeBlock,
  TimeBlock,
  WithDuration,
} from "../../time-block-types";
import type { OnEditAbortedFn, OnUpdateFn, PointerDateTime } from "../../types";

import { useEditContext } from "./use-edit/use-edit-context";
import { useNewlyStartedTimeBlocks } from "./use-newly-started-time-blocks";

export function useTimeBlocks(props: {
  settingsStore: Writable<DayPlannerSettings>;
  isOnline: Readable<boolean>;
  currentTime: Readable<Moment>;
  onUpdate: OnUpdateFn;
  onLogUpdate: OnUpdateFn<EditableLogTimeBlock>;
  onEditAborted: OnEditAbortedFn;
  pointerDateTime: Readable<PointerDateTime>;
  remoteTimeBlocks: Readable<RemoteTimeBlock[]>;
  localTimeBlocks: Readable<EditableTimeBlock[]>;
  logTimeBlocks: Readable<LogTimeBlock[]>;
  abortEditTrigger: Readable<unknown>;
}) {
  const {
    settingsStore,
    currentTime,
    pointerDateTime,
    onUpdate,
    onLogUpdate,
    onEditAborted,
    remoteTimeBlocks,
    localTimeBlocks,
    logTimeBlocks,
    abortEditTrigger,
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

  const editContext = useEditContext({
    onUpdate,
    onLogUpdate,
    onEditAborted,
    settingsStore,
    localTimeBlocks,
    logTimeBlocks,
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
