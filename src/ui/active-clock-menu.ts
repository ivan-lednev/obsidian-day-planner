import { Menu } from "obsidian";
import { isNotVoid } from "typed-assert";

import {
  runWithNoticeOnError,
  type ListItemEntryEditor,
} from "../service/list-item-entry-editor";
import type { WorkspaceFacade } from "../service/workspace-facade";
import type { LocalTask } from "../task-types";

export function createActiveClockMenu(props: {
  event: PointerEvent | MouseEvent | TouchEvent;
  task: LocalTask;
  taskEntryEditor: ListItemEntryEditor;
  workspaceFacade: WorkspaceFacade;
}) {
  const { event, task, taskEntryEditor, workspaceFacade } = props;
  const menu = new Menu();
  const { location } = task;

  // todo: remove when types are fixed
  isNotVoid(location);

  const {
    path,
    position: {
      start: { line },
    },
  } = location;

  menu.addItem((item) => {
    return item
      .setTitle("Clock out")
      .setIcon("square")
      .onClick(async () => {
        await runWithNoticeOnError(
          taskEntryEditor.clockOutAtLocation(location),
        );
      });
  });

  menu.addItem((item) => {
    item
      .setTitle("Cancel clock")
      .setIcon("trash-2")
      .onClick(async () => {
        await runWithNoticeOnError(
          taskEntryEditor.cancelClockAtLocation(location),
        );
      });
  });

  menu.addItem((item) => {
    item
      .setTitle("Reveal task in file")
      .setIcon("file-input")
      .onClick(async () => {
        await workspaceFacade.revealLineInFile(path, line);
      });
  });

  // The method is asking for a MouseEvent, but it works just fine on mobile
  menu.showAtMouseEvent(event as MouseEvent);
}
