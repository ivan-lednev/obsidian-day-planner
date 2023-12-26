import { App, Component, MarkdownRenderer } from "obsidian";

export const createRenderMarkdown =
  (app: App) => (el: HTMLElement, markdown: string) => {
    const loader = new Component();

    el.empty();

    // todo: investigate why `await` doesn't work as expected here
    MarkdownRenderer.render(app, markdown, el, "", loader);

    loader.load();

    return () => loader.unload();
  };
