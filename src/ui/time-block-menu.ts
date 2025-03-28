import { Menu } from "obsidian";
import { isNotVoid } from "typed-assert";

import type { LocalTask } from "../task-types";

import type { WorkspaceFacade } from "src/service/workspace-facade";

export function createTimeBlockMenu(props: {
  event: MouseEvent | TouchEvent;
  task: LocalTask;
  workspaceFacade: WorkspaceFacade;
}) {
  const { event, task, workspaceFacade } = props;
  const { location } = task;

  // todo: remove when types are fixed
  isNotVoid(location);

  const {
    path,
    position: {
      start: { line },
    },
  } = location;

  const menu = new Menu();

  menu.addItem((item) => {
    item
      .setTitle("Reveal task in file")
      .setIcon("file-input")
      .onClick(async () => {
        await workspaceFacade.revealLineInFile(path, line);
      });
  });

  // Obsidian works fine with touch events, but its TypeScript definitions don't reflect that.
  // @ts-expect-error
  menu.showAtMouseEvent(event);
}
