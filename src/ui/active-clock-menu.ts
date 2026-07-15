import { Menu } from "obsidian";

import {
  runWithNoticeOnError,
  type ListItemEntryEditor,
} from "../service/list-item-entry-editor";
import type { WorkspaceFacade } from "../service/workspace-facade";
import type { LogTimeBlock } from "../time-block-types";

import type { OpenEditTimeEntryModal } from "./create-edit-time-entry-modal";

export function createActiveClockMenu(props: {
  event: PointerEvent | MouseEvent | TouchEvent;
  task: LogTimeBlock;
  // todo: lift to main.ts
  taskEntryEditor: ListItemEntryEditor;
  workspaceFacade: WorkspaceFacade;
  openEditTimeEntryModal: OpenEditTimeEntryModal;
}) {
  const {
    event,
    task,
    taskEntryEditor,
    workspaceFacade,
    openEditTimeEntryModal,
  } = props;

  if (task.source === "frontmatterLog") {
    // todo: implement for frontmatterLog
    throw new Error("Not implemented");
  }

  const menu = new Menu();

  const {
    path,
    position: {
      start: { line },
    },
  } = task;

  menu.addItem((item) => {
    return item
      .setTitle("Clock out")
      .setIcon("square")
      .onClick(async () => {
        await runWithNoticeOnError(
          taskEntryEditor.clockOutAtLocation({ path, line }),
        );
      });
  });

  menu.addItem((item) =>
    item
      .setTitle("Edit...")
      .setIcon("pencil")
      .onClick(() => openEditTimeEntryModal(task)),
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
      .setTitle("Cancel clock")
      .setIcon("trash-2")
      .setWarning(true)
      .onClick(async () => {
        await runWithNoticeOnError(
          taskEntryEditor.cancelClockAtLocation({ path, line }),
        );
      });
  });

  // The method is asking for a MouseEvent, but it works just fine on mobile
  menu.showAtMouseEvent(event as MouseEvent);
}
