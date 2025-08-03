import type { Editor, MarkdownFileInfo, MarkdownView, Menu } from "obsidian";

import type DayPlanner from "../main";
import type { STaskEditor } from "../service/stask-editor";

export const createEditorMenuCallback =
  (props: { sTaskEditor: STaskEditor; plugin: DayPlanner }) =>
  (menu: Menu, editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
    const { sTaskEditor } = props;

    menu.addSeparator();

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
    menu.addItem((item) => {
      item
        .setTitle("Clock in")
        .setIcon("play")
        // @ts-expect-error
        .onClick(sTaskEditor.clockInUnderCursor);
    });
  };
