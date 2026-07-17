import { App, Modal } from "obsidian";
import { mount, unmount } from "svelte";

import { clockFormat } from "../constants";
import type { LogEntryEditor } from "../service/log-entry-editor";
import type { LogTimeBlock } from "../time-block-types";
import { runWithNoticeOnError } from "../util/effect";
import { getFirstLine } from "../util/markdown";
import { getEndTime } from "../util/time-block-utils";

import TimeEntryEditModal from "./components/time-entry-edit-modal.svelte";

export function createEditTimeEntryModalCreator(
  app: App,
  logEntryEditor: LogEntryEditor,
) {
  // todo: separate LogTimeBlockView (clamped) & LogTimeBlock
  return (
    timeBlock: LogTimeBlock,
    logEntry?: { start: string; end?: string },
  ) => {
    const initialStart = logEntry
      ? logEntry.start
      : timeBlock.startTime.format(clockFormat);
    const initialEnd = logEntry
      ? (logEntry.end ?? window.moment().format(clockFormat))
      : timeBlock.durationMinutes
        ? getEndTime(timeBlock).format(clockFormat)
        : window.moment().format(clockFormat);

    const modal = new Modal(app).setTitle(
      `Edit time entry: ${getFirstLine(timeBlock.text)}`,
    );

    const component = mount(TimeEntryEditModal, {
      target: modal.contentEl,
      props: {
        initialStart,
        initialEnd,
        onConfirm: async ({ start, end }: { start: string; end?: string }) => {
          await runWithNoticeOnError(
            logEntry
              ? logEntryEditor.editClock(timeBlock, {
                  originalStart: logEntry.start,
                  patch: { start, end },
                })
              : logEntryEditor.editLastClock(timeBlock, { start, end }),
          );

          modal.close();
        },
        onCancel: () => modal.close(),
      },
    });

    modal.onClose = async () => {
      try {
        await unmount(component);
      } catch (error) {
        console.error(error);
      }
    };

    modal.open();
  };
}

export type OpenEditTimeEntryModal = ReturnType<
  typeof createEditTimeEntryModalCreator
>;
