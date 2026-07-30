import { Menu } from "obsidian";

import type { LogEntryEditor } from "../service/log-entry-editor";
import type { WorkspaceFacade } from "../service/workspace-facade";
import {
  type EditableTimeBlock,
  type PlanTimeBlock,
} from "../time-block-types";
import { runWithNoticeOnError } from "../util/effect";

export function createTimeBlockMenu(props: {
  event: MouseEvent | TouchEvent;
  timeBlock: EditableTimeBlock;
  logEntryEditor: LogEntryEditor;
  workspaceFacade: WorkspaceFacade;
  onEdit: () => void;
  onDelete: (timeBlock: PlanTimeBlock) => Promise<void>;
}) {
  const {
    event,
    timeBlock,
    logEntryEditor,
    workspaceFacade,
    onEdit,
    onDelete,
  } = props;

  if (timeBlock.source === "unwritten") {
    throw new Error("Cannot show a menu for an unwritten time block");
  }

  const menu = new Menu();

  menu.addItem((item) => {
    item
      .setTitle("Clock in")
      .setIcon("play")
      .onClick(async () => {
        await runWithNoticeOnError(logEntryEditor.clockIn(timeBlock));
      });
  });

  menu.addItem((item) => {
    item.setTitle("Edit").setIcon("pencil").onClick(onEdit);
  });

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
      .setTitle("Delete")
      .setIcon("trash-2")
      .setWarning(true)
      .onClick(async () => {
        await onDelete(timeBlock);
      });
  });

  // Obsidian works fine with touch events, but its TypeScript definitions don't reflect that.
  // @ts-expect-error
  menu.showAtMouseEvent(event);
}
