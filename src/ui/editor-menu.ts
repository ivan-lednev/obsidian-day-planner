import type { Editor, Menu } from "obsidian";

import type DayPlanner from "../main";
import type { TaskEntryEditor } from "../service/task-entry-editor";
import { isWithOpenClock } from "../util/props";

export const createEditorMenuCallback =
  (props: { taskEntryEditor: TaskEntryEditor; plugin: DayPlanner }) =>
  (menu: Menu, editor: Editor) => {
    const { taskEntryEditor } = props;

    let sTask;

    try {
      sTask = taskEntryEditor.getSTaskWithListPropsUnderCursor();
    } catch {
      return;
    }

    menu.addSeparator();

    if (isWithOpenClock(sTask.props?.validated)) {
      menu.addItem((item) => {
        item
          .setTitle("Clock out")
          .setIcon("square")
          .onClick(() => taskEntryEditor.clockOutUnderCursor());
      });

      menu.addItem((item) => {
        item
          .setTitle("Cancel clock")
          .setIcon("trash")
          .onClick(() => taskEntryEditor.cancelClockUnderCursor());
      });
    } else {
      menu.addItem((item) => {
        item
          .setTitle("Clock in")
          .setIcon("play")
          .onClick(() => taskEntryEditor.clockInUnderCursor());
      });
    }
  };
