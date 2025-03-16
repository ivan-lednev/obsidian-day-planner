import type { Editor, MarkdownFileInfo, MarkdownView, Menu } from "obsidian";
import type { STask } from "obsidian-dataview";

import type DayPlanner from "../main";
import type { STaskEditor } from "../service/stask-editor";
import * as c from "../util/clock";

export const createEditorMenuCallback =
  (props: { sTaskEditor: STaskEditor; plugin: DayPlanner }) =>
  (menu: Menu, editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
    const { sTaskEditor, plugin } = props;

    let sTask: STask | undefined;

    try {
      sTask = plugin.getSTaskUnderCursor(view);
    } catch {
      return;
    }

    menu.addSeparator();

    if (c.hasActiveClockProp(sTask)) {
      menu.addItem((item) => {
        item
          .setTitle("Clock out")
          .setIcon("square")
          .onClick(sTaskEditor.clockOutUnderCursor);
      });

      menu.addItem((item) => {
        item
          .setTitle("Cancel clock")
          .setIcon("trash")
          // @ts-expect-error
          .onClick(sTaskEditor.cancelClockUnderCursor);
      });
    } else {
      menu.addItem((item) => {
        item
          .setTitle("Clock in")
          .setIcon("play")
          // @ts-expect-error
          .onClick(sTaskEditor.clockInUnderCursor);
      });
    }
  };
