import { Menu } from "obsidian";

export function createTimeBlockMenu(event: PointerEvent) {
  const menu = new Menu();

  menu.addItem((item) => {
    item
      .setTitle("Reveal task in file")
      .setIcon("file-input")
      .onClick(() => {});
  });

  menu.showAtMouseEvent(event);
}
