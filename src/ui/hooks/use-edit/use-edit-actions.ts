import { get, type Readable, type Writable } from "svelte/store";

import { vibrationDurationMillis } from "../../../constants";
import type {
  EditableTimeBlock,
  WithDuration,
} from "../../../time-block-types";
import type { OnUpdateFn } from "../../../types";
import * as t from "../../../util/time-block-utils";

import { EditMode, type EditOperation } from "./types";

interface UseEditActionsProps {
  baselineTimeBlocks: Writable<EditableTimeBlock[]>;
  editOperation: Writable<EditOperation | undefined>;
  timeBlocksWithPendingUpdate: Readable<EditableTimeBlock[]>;
  onUpdate: OnUpdateFn;
}

export function useEditActions({
  editOperation,
  baselineTimeBlocks,
  timeBlocksWithPendingUpdate,
  onUpdate,
}: UseEditActionsProps) {
  function getUnderlyingTimeBlockWithoutSplitting(
    viewTimeBlock: WithDuration<EditableTimeBlock>,
  ) {
    return (
      get(baselineTimeBlocks).find(
        (timeBlock) => timeBlock.id === viewTimeBlock.id,
        // todo: this happens only when we create (or maybe copy) time blocks. But the knowledge is implicit here
      ) ?? viewTimeBlock
    );
  }

  function startEdit(operation: EditOperation) {
    navigator.vibrate?.(vibrationDurationMillis);
    editOperation.set({
      ...operation,
      timeBlock: getUnderlyingTimeBlockWithoutSplitting(operation.timeBlock),
    });
  }

  function startCopy(timeBlock: WithDuration<EditableTimeBlock>) {
    startEdit({
      timeBlock: t.copy(getUnderlyingTimeBlockWithoutSplitting(timeBlock)),
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

    const oldBase = get(baselineTimeBlocks);
    const currentTimeBlocks = get(timeBlocksWithPendingUpdate);

    baselineTimeBlocks.set(currentTimeBlocks);
    editOperation.set(undefined);

    const succeeded = await onUpdate(
      oldBase,
      currentTimeBlocks,
      currentOperation.mode,
    );

    if (!succeeded) {
      baselineTimeBlocks.set(oldBase);
    }
  }

  return {
    startEdit,
    startCopy,
    confirmEdit,
    cancelEdit,
  };
}
