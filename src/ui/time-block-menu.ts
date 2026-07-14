import { Menu } from "obsidian";
import { isNotVoid } from "typed-assert";

import type { WorkspaceFacade } from "../service/workspace-facade";
import { type EditableTimeBlock } from "../time-block-types";

export function createTimeBlockMenu(props: {
  event: MouseEvent | TouchEvent;
  task: EditableTimeBlock;
  workspaceFacade: WorkspaceFacade;
  onEdit: () => void;
}) {
  const { event, task, workspaceFacade, onEdit } = props;
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
    item.setTitle("Edit").setIcon("pencil").onClick(onEdit);
  });

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
