import { Menu } from "obsidian";
import { isNotVoid } from "typed-assert";

import {
  runWithNoticeOnError,
  type ListItemEntryEditor,
} from "../service/list-item-entry-editor";
import type { WorkspaceFacade } from "../service/workspace-facade";
import type { LocalTimeBlock } from "../time-block-types";

export function createRecentClockMenu(props: {
  event: PointerEvent | MouseEvent | TouchEvent;
  task: LocalTimeBlock;
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
    item
      .setTitle("Clock in")
      .setIcon("play")
      .onClick(async () => {
        await runWithNoticeOnError(
          taskEntryEditor.clockInAtLocation({ path, line }),
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
