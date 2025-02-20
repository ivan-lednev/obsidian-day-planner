import { Menu } from "obsidian";
import type { LocalTask } from "../task-types";
import type { WorkspaceFacade } from "src/service/workspace-facade";
import { isNotVoid } from "typed-assert";
import type { ShowPreview } from "../util/create-show-preview";

export function createTimeBlockMenu(props: {
  event: MouseEvent | TouchEvent;
  task: LocalTask;
  workspaceFacade: WorkspaceFacade;
  showPreview: ShowPreview;
}) {
  const { event, task, workspaceFacade, showPreview } = props;
  const { location } = task;

  // todo: remove when types are fixed
  isNotVoid(location);

  const {
    path,
    position: {
      start: { line }
    }
  } = location;

  const menu = new Menu();

  menu.addItem((item) =>
    item
      .setTitle("Show preview")
      .setIcon("eye")
      .onClick(() => {
        showPreview(event.target, path, line);
      })
  );

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
