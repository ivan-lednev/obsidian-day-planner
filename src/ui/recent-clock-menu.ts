import { Menu } from "obsidian";
import { isNotVoid } from "typed-assert";

import type { TaskEntryEditor } from "../service/task-entry-editor";
import type { WorkspaceFacade } from "../service/workspace-facade";
import type { LocalTask } from "../task-types";
import { addOpenClock } from "../util/props";

export function createRecentClockMenu(props: {
  event: PointerEvent | MouseEvent | TouchEvent;
  task: LocalTask;
  taskEntryEditor: TaskEntryEditor;
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
        await taskEntryEditor.editProps({
          path,
          line,
          editFn: (listPropsForLine) => addOpenClock(listPropsForLine),
        });
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
