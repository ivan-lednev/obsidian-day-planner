import { App, Modal } from "obsidian";
import { mount, unmount } from "svelte";
import { isNotVoid } from "typed-assert";

import { clockFormat } from "../constants";
import {
  ListItemEntryEditor,
  runWithNoticeOnError,
} from "../service/list-item-entry-editor";
import type { LocalTask } from "../task-types";
import { getFirstLine } from "../util/markdown";
import { getEndTime } from "../util/task-utils";

import TimeEntryEditModal from "./components/time-entry-edit-modal.svelte";

export function createEditTimeEntryModalCreator(
  app: App,
  taskEntryEditor: ListItemEntryEditor,
) {
  return (task: LocalTask) => {
    const { location } = task;

    isNotVoid(location);

    const initialStart = task.startTime.format(clockFormat);
    const initialEnd = task.durationMinutes
      ? getEndTime(task).format(clockFormat)
      : window.moment().format(clockFormat);

    const modal = new Modal(app).setTitle(
      `Edit time entry: ${getFirstLine(task.text)}`,
    );

    const component = mount(TimeEntryEditModal, {
      target: modal.contentEl,
      props: {
        initialStart,
        initialEnd,
        onConfirm: async ({ start, end }: { start: string; end?: string }) => {
          await runWithNoticeOnError(
            taskEntryEditor.editLastClockAtLocation(
              { path: location.path, line: location.position.start.line },
              { start, end },
            ),
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
