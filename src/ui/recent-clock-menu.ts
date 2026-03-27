import type { LocalTask } from "../task-types";
import type { STaskEditor } from "../service/stask-editor";
import type { WorkspaceFacade } from "../service/workspace-facade";
import { Menu } from "obsidian";
import { isNotVoid } from "typed-assert";

export function createRecentClockMenu(props: {
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
    item
      .setTitle("Clock in")
      .setIcon("play")
      .onClick(() => sTaskEditor.clockInUnderCursor());
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
