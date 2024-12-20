import { Menu } from "obsidian";

export function createTimeBlockMenu(event: MouseEvent | TouchEvent) {
  const menu = new Menu();

  menu.addItem((item) => {
    item
      .setTitle("Reveal task in file")
      .setIcon("file-input")
      .onClick(() => {});
  });

  // Obsidian works fine with touch events, but its TypeScript definitions don't reflect that.
  // @ts-expect-error
  menu.showAtMouseEvent(event);
}
