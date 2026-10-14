import { isNotVoid } from "typed-assert";

import { clockFormat } from "./constants";
import { selectLogEntriesById } from "./redux/index/index-slice";
import type { RootState } from "./redux/store";
import type { ClockLocation, LogEntryEditor } from "./service/log-entry-editor";
import type { EditableLogTimeBlock, LogTimeBlock } from "./time-block-types";
import type { OnUpdateFn } from "./types";
import type { PickClockTarget } from "./ui/clock-target-picker";
import { EditMode } from "./ui/hooks/use-edit/types";
import { runWithNoticeOnError } from "./util/effect";
import { getEndTime } from "./util/time-block-utils";

function toClockLocation(timeBlock: LogTimeBlock): ClockLocation {
  return timeBlock.source === "listItemLog"
    ? { path: timeBlock.path, position: timeBlock.position }
    : { path: timeBlock.path };
}

function hasMovedInTime(a: EditableLogTimeBlock, b: EditableLogTimeBlock) {
  return (
    !a.startTime.isSame(b.startTime) || a.durationMinutes !== b.durationMinutes
  );
}

export const createLogUpdateHandler = (props: {
  logEntryEditor: LogEntryEditor;
  getState: () => RootState;
  pickClockTarget: PickClockTarget;
  onEditCanceled: () => void;
}): OnUpdateFn<EditableLogTimeBlock> => {
  const { logEntryEditor, getState, pickClockTarget, onEditCanceled } = props;

  return async (base, next, mode) => {
    if (mode === EditMode.CREATE) {
      const created = next.find(
        (timeBlock) => !base.some((it) => it.id === timeBlock.id),
      );

      isNotVoid(created);

      const location = await pickClockTarget({
        placeholder: "Log time on a task or a file...",
        actionPurpose: "to log time",
      });

      if (!location) {
        onEditCanceled();

        return false;
      }

      return runWithNoticeOnError(
        logEntryEditor.addClock(location, {
          start: created.startTime.format(clockFormat),
          end: getEndTime(created).format(clockFormat),
        }),
      );
    }

    const editedTimeBlock = next.find((timeBlock) => {
      const timeBlockInBase = base.find((it) => it.id === timeBlock.id);

      return timeBlockInBase && hasMovedInTime(timeBlockInBase, timeBlock);
    });

    if (!editedTimeBlock || editedTimeBlock.source === "unwrittenLog") {
      return true;
    }

    // Entries are matched by their start as written in the file, which can
    // carry seconds that the block dropped when it got rounded to a minute.
    // todo: reconsider whether to store this on objects
    const logEntry = selectLogEntriesById(getState())[editedTimeBlock.id];

    isNotVoid(
      logEntry,
      `Inconsistent store state: expected to find log entry by id ${editedTimeBlock.id}`,
    );

    return runWithNoticeOnError(
      logEntryEditor.editClock(toClockLocation(editedTimeBlock), {
        originalStart: logEntry.start,
        patch: {
          start: editedTimeBlock.startTime.format(clockFormat),
          // A running clock has no end of its own: it is resolved against the
          // current moment, so writing one would silently stop the clock.
          end: logEntry.end
            ? getEndTime(editedTimeBlock).format(clockFormat)
            : undefined,
        },
      }),
    );
  };
};
