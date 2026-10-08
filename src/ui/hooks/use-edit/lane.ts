import type { Moment } from "moment";
import { derived, get, readable, type Readable, writable } from "svelte/store";

import { vibrationDurationMillis } from "../../../constants";
import type { DayPlannerSettings } from "../../../settings";
import type { TimeBlock } from "../../../time-block-types";
import { layOutDayColumn } from "../../../timeline-layout";
import type {
  OnEditAbortedFn,
  OnUpdateFn,
  PointerDateTime,
} from "../../../types";

import { transform } from "./transform/transform";
import { EditMode, type EditableInterval, type EditOperation } from "./types";

export function createLane<
  Block extends TimeBlock & EditableInterval,
  ReadonlyBlock extends TimeBlock = never,
>(props: {
  timeBlocks: Readable<Block[]>;
  readonlyTimeBlocks?: Readable<ReadonlyBlock[]>;
  createBlock: (props: {
    startTime: Moment;
    settings: DayPlannerSettings;
  }) => Block;
  copyBlock: (timeBlock: Block) => Block;
  onUpdate: OnUpdateFn<Block>;
  settingsStore: Readable<DayPlannerSettings>;
  pointerDateTime: Readable<PointerDateTime>;
  abortEditTrigger: Readable<unknown>;
  onEditAborted: OnEditAbortedFn;
}) {
  const {
    timeBlocks,
    readonlyTimeBlocks = readable<ReadonlyBlock[]>([]),
    createBlock,
    copyBlock,
    onUpdate,
    settingsStore,
    pointerDateTime,
    abortEditTrigger,
    onEditAborted,
  } = props;

  const editOperation = writable<EditOperation<Block> | undefined>(
    undefined,
    (set, updateEditOperation) => {
      const unsubscribe = abortEditTrigger.subscribe(() => {
        updateEditOperation((currentEditOperation) => {
          if (currentEditOperation !== undefined) {
            onEditAborted();
          }

          return undefined;
        });
      });

      return unsubscribe;
    },
  );

  const baseline = writable<Block[]>([], (set) => timeBlocks.subscribe(set));

  const pendingUpdate = derived(
    [editOperation, baseline, settingsStore, pointerDateTime],
    ([$editOperation, $baseline, $settingsStore, $pointerDateTime]) =>
      $editOperation
        ? transform($baseline, $editOperation, $settingsStore, $pointerDateTime)
        : $baseline,
  );

  const displayedTimeBlocks = derived(
    [readonlyTimeBlocks, pendingUpdate],
    ([$readonlyTimeBlocks, $pendingUpdate]): Array<Block | ReadonlyBlock> => [
      ...$readonlyTimeBlocks,
      ...$pendingUpdate,
    ],
  );

  function getTimeBlocksForDay(day: Moment) {
    return derived(displayedTimeBlocks, ($displayedTimeBlocks) =>
      layOutDayColumn({ timeBlocks: $displayedTimeBlocks, day }),
    );
  }

  function getUnderlyingTimeBlockWithoutSplitting(viewTimeBlock: Block) {
    return (
      get(baseline).find(
        (timeBlock) => timeBlock.id === viewTimeBlock.id,
        // todo: this happens only when we create (or maybe copy) time blocks. But the knowledge is implicit here
      ) ?? viewTimeBlock
    );
  }

  function startEdit(operation: EditOperation<Block>) {
    navigator.vibrate?.(vibrationDurationMillis);

    editOperation.set({
      ...operation,
      timeBlock: getUnderlyingTimeBlockWithoutSplitting(operation.timeBlock),
    });
  }

  function startCreate() {
    startEdit({
      timeBlock: createBlock({
        startTime: get(pointerDateTime).dateTime,
        settings: get(settingsStore),
      }),
      mode: EditMode.CREATE,
    });
  }

  function startCopy(timeBlock: Block) {
    startEdit({
      timeBlock: copyBlock(getUnderlyingTimeBlockWithoutSplitting(timeBlock)),
      mode: EditMode.DRAG,
    });
  }

  function cancelEdit() {
    editOperation.set(undefined);
  }

  async function confirmEdit() {
    const currentOperation = get(editOperation);

    if (currentOperation === undefined) {
      return;
    }

    const oldBase = get(baseline);
    const currentTimeBlocks = get(pendingUpdate);

    baseline.set(currentTimeBlocks);
    editOperation.set(undefined);

    const succeeded = await onUpdate(
      oldBase,
      currentTimeBlocks,
      currentOperation.mode,
    );

    if (!succeeded) {
      baseline.set(oldBase);
    }
  }

  return {
    editOperation,
    displayedTimeBlocks,
    getTimeBlocksForDay,
    startEdit,
    startCreate,
    startCopy,
    cancelEdit,
    confirmEdit,
  };
}
