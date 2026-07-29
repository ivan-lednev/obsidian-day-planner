import type { ItemView } from "obsidian";

export function setViewTitle(view: ItemView, text: string) {
  // @ts-expect-error: undocumented API
  view.titleEl?.setText(text);
  // @ts-expect-error: undocumented API
  view.leaf.updateHeader?.();
}
