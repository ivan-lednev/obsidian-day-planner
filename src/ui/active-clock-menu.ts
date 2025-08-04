import { Menu } from "obsidian";
import { isNotVoid } from "typed-assert";

import type { STaskEditor } from "../service/stask-editor";
import type { WorkspaceFacade } from "../service/workspace-facade";
import type { LocalTask } from "../task-types";
import { cancelOpenClock, clockOut } from "../util/props";

export function createActiveClockMenu(props: {
  event: PointerEvent | MouseEvent | TouchEvent;
  task: LocalTask;
  sTaskEditor: STaskEditor;
  workspaceFacade: WorkspaceFacade;
}) {
  const { event, task, sTaskEditor, workspaceFacade } = props;
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
        await sTaskEditor.editProps({
          path,
          line,
          editFn: (listPropsForLine) => clockOut(listPropsForLine),
        });
      });
  });

  menu.addItem((item) => {
    item
      .setTitle("Cancel clock")
      .setIcon("trash-2")
      .onClick(async () => {
        await sTaskEditor.editProps({
          path,
          line,
          editFn: (listPropsForLine) => cancelOpenClock(listPropsForLine),
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
