import { Menu } from "obsidian";

import type { LogEntryEditor } from "../service/log-entry-editor";
import type { WorkspaceFacade } from "../service/workspace-facade";
import type { LogTimeBlock } from "../time-block-types";
import { runWithNoticeOnError } from "../util/effect";

import type { OpenLogEntryEditModal } from "./log-entry-edit-modal";

export function createActiveClockMenu(props: {
  event: PointerEvent | MouseEvent | TouchEvent;
  timeBlock: LogTimeBlock;
  logEntryEditor: LogEntryEditor;
  workspaceFacade: WorkspaceFacade;
  openLogEntryEditModal: OpenLogEntryEditModal;
}) {
  const {
    event,
    timeBlock,
    logEntryEditor,
    workspaceFacade,
    openLogEntryEditModal,
  } = props;

  const menu = new Menu();

  menu.addItem((item) => {
    return (
      item
        .setTitle("Clock out")
        .setIcon("square")
        // todo: code started drifting: pass onClockOut and so on
        .onClick(async () => {
          await runWithNoticeOnError(logEntryEditor.clockOut(timeBlock));
        })
    );
  });

  menu.addItem((item) =>
    item
      .setTitle("Edit...")
      .setIcon("pencil")
      .onClick(() => openLogEntryEditModal(timeBlock)),
  );

  menu.addItem((item) => {
    item
      .setTitle("Reveal task in file")
      .setIcon("file-input")
      .onClick(async () => {
        await workspaceFacade.revealLocation(timeBlock);
      });
  });

  menu.addSeparator();

  menu.addItem((item) => {
    item
      .setTitle("Cancel clock")
      .setIcon("trash-2")
      .setWarning(true)
      .onClick(async () => {
        await runWithNoticeOnError(logEntryEditor.cancelClock(timeBlock));
      });
  });

  // The method is asking for a MouseEvent, but it works just fine on mobile
  menu.showAtMouseEvent(event as MouseEvent);
}
