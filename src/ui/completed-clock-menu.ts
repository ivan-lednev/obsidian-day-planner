import { Menu } from "obsidian";

import type { LogEntryEditor } from "../service/log-entry-editor";
import type { WorkspaceFacade } from "../service/workspace-facade";
import type { LogTimeBlock } from "../time-block-types";
import { runWithNoticeOnError } from "../util/effect";

import type { OpenEditTimeEntryModal } from "./create-edit-time-entry-modal";

export function createCompletedClockMenu(props: {
  event: PointerEvent | MouseEvent | TouchEvent;
  task: LogTimeBlock;
  logEntry: { start: string; end?: string };
  logEntryEditor: LogEntryEditor;
  workspaceFacade: WorkspaceFacade;
  openEditTimeEntryModal: OpenEditTimeEntryModal;
}) {
  const {
    event,
    task,
    logEntry,
    logEntryEditor,
    workspaceFacade,
    openEditTimeEntryModal,
  } = props;

  const menu = new Menu();

  menu.addItem((item) =>
    item
      .setTitle("Resume")
      .setIcon("play")
      .onClick(async () => {
        await runWithNoticeOnError(logEntryEditor.clockIn(task));
      }),
  );

  menu.addItem((item) =>
    item
      .setTitle("Edit...")
      .setIcon("pencil")
      .onClick(() => openEditTimeEntryModal(task, logEntry)),
  );

  menu.addItem((item) => {
    item
      .setTitle("Reveal task in file")
      .setIcon("file-input")
      .onClick(async () => {
        await workspaceFacade.revealLocation(task);
      });
  });

  menu.addSeparator();

  menu.addItem((item) => {
    item
      .setTitle("Delete")
      .setIcon("trash-2")
      .setWarning(true)
      .onClick(async () => {
        await runWithNoticeOnError(
          logEntryEditor.deleteClock(task, logEntry.start),
        );
      });
  });

  // The method is asking for a MouseEvent, but it works just fine on mobile
  menu.showAtMouseEvent(event as MouseEvent);
}
