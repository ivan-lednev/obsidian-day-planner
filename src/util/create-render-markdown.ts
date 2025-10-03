import { App, Component, MarkdownRenderer } from "obsidian";

export const createRenderMarkdown =
  (app: App) => (el: HTMLElement, markdown: string, sourcePath: string) => {
    const loader = new Component();

    el.empty();

    // TODO: investigate why `await` doesn't work as expected here
    MarkdownRenderer.render(app, markdown, el, sourcePath, loader).then(
      () => loader.load(),
      (error) => console.error(`Failed to render markdown. `, error),
    );

    return () => loader.unload();
  };
