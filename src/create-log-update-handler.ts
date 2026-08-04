import { isNotVoid } from "typed-assert";

import { clockFormat } from "./constants";
import { selectLogEntriesById } from "./redux/index/index-slice";
import type { RootState } from "./redux/store";
import type { ClockLocation, LogEntryEditor } from "./service/log-entry-editor";
import type { LogTimeBlock } from "./time-block-types";
import type { OnLogUpdateFn } from "./types";
import { runWithNoticeOnError } from "./util/effect";
import { getEndTime } from "./util/time-block-utils";

function toClockLocation(timeBlock: LogTimeBlock): ClockLocation {
  return timeBlock.source === "listItemLog"
    ? { path: timeBlock.path, position: timeBlock.position }
    : { path: timeBlock.path };
}

function hasMovedInTime(a: LogTimeBlock, b: LogTimeBlock) {
  return (
    !a.startTime.isSame(b.startTime) || a.durationMinutes !== b.durationMinutes
  );
}

/**
 * Writes an edited clock straight through the log entry editor, unlike planner
 * blocks, which go through the transaction writer. This means log edits do not
 * join the undo history yet.
 */
export const createLogUpdateHandler = (props: {
  logEntryEditor: LogEntryEditor;
  getState: () => RootState;
}): OnLogUpdateFn => {
  const { logEntryEditor, getState } = props;

  return async (base, next) => {
    // The tracker has no modes that move neighboring blocks, so an edit
    // changes exactly one clock.
    const editedTimeBlock = next.find((timeBlock) => {
      const timeBlockInBase = base.find((it) => it.id === timeBlock.id);

      return timeBlockInBase && hasMovedInTime(timeBlockInBase, timeBlock);
    });

    if (!editedTimeBlock) {
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
