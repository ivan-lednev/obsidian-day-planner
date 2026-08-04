import { get, type Readable, type Writable } from "svelte/store";

import { vibrationDurationMillis } from "../../../constants";
import type { DayPlannerSettings } from "../../../settings";
import {
  isLog,
  type EditableTimeBlock,
  type LogTimeBlock,
  type WithDuration,
} from "../../../time-block-types";
import type { OnUpdateFn, PointerDateTime } from "../../../types";
import * as t from "../../../util/time-block-utils";

import { EditMode, type EditOperation } from "./types";

interface UseEditActionsProps {
  baselineTimeBlocks: Writable<EditableTimeBlock[]>;
  logBaselineTimeBlocks: Writable<LogTimeBlock[]>;
  editOperation: Writable<EditOperation | undefined>;
  timeBlocksWithPendingUpdate: Readable<EditableTimeBlock[]>;
  logTimeBlocksWithPendingUpdate: Readable<LogTimeBlock[]>;
  onUpdate: OnUpdateFn;
  onLogUpdate: OnUpdateFn<LogTimeBlock>;
  settingsStore: Readable<DayPlannerSettings>;
  pointerDateTime: Readable<PointerDateTime>;
}

export function useEditActions({
  editOperation,
  baselineTimeBlocks,
  logBaselineTimeBlocks,
  timeBlocksWithPendingUpdate,
  logTimeBlocksWithPendingUpdate,
  onUpdate,
  onLogUpdate,
  settingsStore,
  pointerDateTime,
}: UseEditActionsProps) {
  function getUnderlyingTimeBlockWithoutSplitting<T extends { id: string }>(
    viewTimeBlock: T,
    baseline: T[],
  ) {
    return (
      baseline.find(
        (timeBlock) => timeBlock.id === viewTimeBlock.id,
        // todo: this happens only when we create (or maybe copy) time blocks. But the knowledge is implicit here
      ) ?? viewTimeBlock
    );
  }

  function startEdit(operation: EditOperation) {
    navigator.vibrate?.(vibrationDurationMillis);

    const { timeBlock } = operation;

    editOperation.set({
      ...operation,
      timeBlock: isLog(timeBlock)
        ? getUnderlyingTimeBlockWithoutSplitting(
            timeBlock,
            get(logBaselineTimeBlocks),
          )
        : getUnderlyingTimeBlockWithoutSplitting(
            timeBlock,
            get(baselineTimeBlocks),
          ),
    });
  }

  function startCopy(timeBlock: WithDuration<EditableTimeBlock>) {
    startEdit({
      timeBlock: t.copy(
        getUnderlyingTimeBlockWithoutSplitting(
          timeBlock,
          get(baselineTimeBlocks),
        ),
      ),
      mode: EditMode.DRAG,
    });
  }

  function startCreate() {
    startEdit({
      timeBlock: t.create({
        startTime: get(pointerDateTime).dateTime,
        settings: get(settingsStore),
      }),
      mode: EditMode.CREATE,
    });
  }

  function cancelEdit() {
    editOperation.set(undefined);
  }

  async function commit<Block>(
    baseline: Writable<Block[]>,
    pendingUpdate: Readable<Block[]>,
    write: OnUpdateFn<Block>,
    mode: EditMode,
  ) {
    const oldBase = get(baseline);
    const currentTimeBlocks = get(pendingUpdate);

    baseline.set(currentTimeBlocks);
    editOperation.set(undefined);

    const succeeded = await write(oldBase, currentTimeBlocks, mode);

    if (!succeeded) {
      baseline.set(oldBase);
    }
  }

  async function confirmEdit() {
    const currentOperation = get(editOperation);

    if (currentOperation === undefined) {
      return;
    }

    const { timeBlock, mode } = currentOperation;

    if (isLog(timeBlock)) {
      await commit(
        logBaselineTimeBlocks,
        logTimeBlocksWithPendingUpdate,
        onLogUpdate,
        mode,
      );

      return;
    }

    await commit(
      baselineTimeBlocks,
      timeBlocksWithPendingUpdate,
      onUpdate,
      mode,
    );
  }

  return {
    startEdit,
    startCopy,
    startCreate,
    confirmEdit,
    cancelEdit,
  };
}
