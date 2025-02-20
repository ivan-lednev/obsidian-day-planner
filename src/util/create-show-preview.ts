import { App } from "obsidian";

export const createShowPreview =
  (app: App) =>
  (el: HTMLElement, path: string, line = 0) => {
    // @ts-ignore
    if (!app.internalPlugins.plugins["page-preview"].enabled) {
      return;
    }

    const previewLocation = {
      scroll: line,
    };

    app.workspace.trigger("link-hover", {}, el, path, "", previewLocation);
  };

export type ShowPreview = ReturnType<typeof createShowPreview>;
