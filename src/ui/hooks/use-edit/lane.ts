import { derived, get, type Readable, writable } from "svelte/store";

import { vibrationDurationMillis } from "../../../constants";
import type { DayPlannerSettings } from "../../../settings";
import type {
  OnEditAbortedFn,
  OnUpdateFn,
  PointerDateTime,
} from "../../../types";

import { transform } from "./transform/transform";
import type { EditableInterval, EditOperation } from "./types";

/**
 * A lane is one editable column: its own baseline, its own edit operation and
 * its own way of writing changes back. Since an operation cannot leave the lane
 * it started in, nothing downstream has to ask which kind of block it holds.
 */
export function createLane<Block extends EditableInterval>(props: {
  source: Readable<Block[]>;
  write: OnUpdateFn<Block>;
  settingsStore: Readable<DayPlannerSettings>;
  pointerDateTime: Readable<PointerDateTime>;
  abortEditTrigger: Readable<unknown>;
  onEditAborted: OnEditAbortedFn;
}) {
  const {
    source,
    write,
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

  const baseline = writable<Block[]>([], (set) => source.subscribe(set));

  const pendingUpdate = derived(
    [editOperation, baseline, settingsStore, pointerDateTime],
    ([$editOperation, $baseline, $settingsStore, $pointerDateTime]) =>
      $editOperation
        ? transform($baseline, $editOperation, $settingsStore, $pointerDateTime)
        : $baseline,
  );

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

    const succeeded = await write(
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
    pendingUpdate,
    getUnderlyingTimeBlockWithoutSplitting,
    startEdit,
    cancelEdit,
    confirmEdit,
  };
}
