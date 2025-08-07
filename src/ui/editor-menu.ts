import type { Editor, Menu } from "obsidian";

import type DayPlanner from "../main";
import type { STaskEditor } from "../service/stask-editor";
import { isWithOpenClock } from "../util/props";

export const createEditorMenuCallback =
  (props: { sTaskEditor: STaskEditor; plugin: DayPlanner }) =>
  (menu: Menu, editor: Editor) => {
    const { sTaskEditor } = props;

    let sTask;

    try {
      sTask = sTaskEditor.getSTaskWithListPropsUnderCursor();
    } catch {
      return;
    }

    menu.addSeparator();

    if (isWithOpenClock(sTask.props?.validated)) {
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
