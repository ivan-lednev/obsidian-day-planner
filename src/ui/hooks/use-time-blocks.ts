import type { Moment } from "moment";
import { derived, type Readable, type Writable } from "svelte/store";

import type { DayPlannerSettings } from "../../settings";
import type {
  EditableTimeBlock,
  LogTimeBlock,
  RemoteTimeBlock,
  TimeBlock,
  WithDuration,
} from "../../time-block-types";
import type {
  OnEditAbortedFn,
  OnLogUpdateFn,
  OnUpdateFn,
  PointerDateTime,
} from "../../types";
import { getUpdateTrigger } from "../../util/store";

import { useEditContext } from "./use-edit/use-edit-context";
import { useNewlyStartedTimeBlocks } from "./use-newly-started-time-blocks";

export function useTimeBlocks(props: {
  settingsStore: Writable<DayPlannerSettings>;
  isOnline: Readable<boolean>;
  currentTime: Readable<Moment>;
  onUpdate: OnUpdateFn;
  onLogUpdate: OnLogUpdateFn;
  onEditAborted: OnEditAbortedFn;
  pointerDateTime: Readable<PointerDateTime>;
  remoteTimeBlocks: Readable<RemoteTimeBlock[]>;
  localTimeBlocks: Readable<EditableTimeBlock[]>;
  logTimeBlocks: Readable<LogTimeBlock[]>;
  indexState: Readable<unknown>;
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
    indexState,
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

  const abortEditTrigger = derived(indexState, getUpdateTrigger);

  const editContext = useEditContext({
    onUpdate,
    onLogUpdate,
    onEditAborted,
    settingsStore,
    localTimeBlocks,
    logTimeBlocks,
    remoteTimeBlocks,
    currentTime,
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
