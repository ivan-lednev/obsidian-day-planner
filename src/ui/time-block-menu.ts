import { Menu } from "obsidian";

import type { WorkspaceFacade } from "../service/workspace-facade";
import { type EditableTimeBlock } from "../time-block-types";

export function createTimeBlockMenu(props: {
  event: MouseEvent | TouchEvent;
  task: EditableTimeBlock;
  workspaceFacade: WorkspaceFacade;
  onEdit: () => void;
}) {
  const { event, task, workspaceFacade, onEdit } = props;

  if (task.source === "unwritten") {
    throw new Error("Cannot show a menu for an unwritten time block");
  }

  const menu = new Menu();

  menu.addItem((item) => {
    item.setTitle("Edit").setIcon("pencil").onClick(onEdit);
  });

  menu.addItem((item) => {
    item
      .setTitle("Reveal task in file")
      .setIcon("file-input")
      .onClick(async () => {
        await workspaceFacade.revealLocation(task);
      });
  });

  // Obsidian works fine with touch events, but its TypeScript definitions don't reflect that.
  // @ts-expect-error
  menu.showAtMouseEvent(event);
}
