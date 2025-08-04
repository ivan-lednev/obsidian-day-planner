import type { Editor, MarkdownFileInfo, MarkdownView, Menu } from "obsidian";
import type { STask } from "obsidian-dataview";

import type DayPlanner from "../main";
import type { STaskEditor } from "../service/stask-editor";
import * as c from "../util/clock";
import { isWithOpenClock } from "../util/props";

export const createEditorMenuCallback =
  (props: { sTaskEditor: STaskEditor; plugin: DayPlanner }) => (menu: Menu) => {
    const { sTaskEditor } = props;

    let sTaskUnderCursor;

    try {
      sTaskUnderCursor = sTaskEditor.getSTaskWithListPropsUnderCursor();
    } catch {
      return;
    }

    const { listPropsForLine } = sTaskUnderCursor;

    menu.addSeparator();

    if (isWithOpenClock(listPropsForLine)) {
      menu.addItem((item) => {
        item
          .setTitle("Clock out")
          .setIcon("square")
          .onClick(() => sTaskEditor.clockOutUnderCursor());
      });

      menu.addItem((item) => {
        item
          .setTitle("Cancel clock")
          .setIcon("trash")
          .onClick(() => sTaskEditor.cancelClockUnderCursor());
      });
    } else {
      menu.addItem((item) => {
        item
          .setTitle("Clock in")
          .setIcon("play")
          .onClick(() => sTaskEditor.clockInUnderCursor());
      });
    }
  };
