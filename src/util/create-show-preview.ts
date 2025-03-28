import { App } from "obsidian";

export const createShowPreview =
  (app: App) =>
  (el: HTMLElement, event: MouseEvent, path: string, line = 0) => {
    // @ts-ignore
    if (!app.internalPlugins.plugins["page-preview"].enabled) {
      return;
    }

    app.workspace.trigger("hover-link", {
      event,
      source: "search",
      hoverParent: el,
      targetEl: el,
      linktext: path,
      state: { scroll: line },
    });
  };

export type ShowPreview = ReturnType<typeof createShowPreview>;
