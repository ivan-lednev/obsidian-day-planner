import { Menu } from "obsidian";

import type { LogEntryEditor } from "../service/log-entry-editor";
import type { WorkspaceFacade } from "../service/workspace-facade";
import type { LogTimeBlock } from "../time-block-types";
import { runWithNoticeOnError } from "../util/effect";

export function createRecentClockMenu(props: {
  event: PointerEvent | MouseEvent | TouchEvent;
  timeBlock: LogTimeBlock;
  logEntryEditor: LogEntryEditor;
  workspaceFacade: WorkspaceFacade;
}) {
  const { event, timeBlock, logEntryEditor, workspaceFacade } = props;
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
    item
      .setTitle("Reveal task in file")
      .setIcon("file-input")
      .onClick(async () => {
        await workspaceFacade.revealLocation(timeBlock);
      });
  });

  // The method is asking for a MouseEvent, but it works just fine on mobile
  menu.showAtMouseEvent(event as MouseEvent);
}
