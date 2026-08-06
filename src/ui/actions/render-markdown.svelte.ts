import { on } from "svelte/events";

import { addLineDataToCheckboxes, readCheckboxLineData } from "../../util/dom";

export const createRenderMarkdownAttachmentFactory =
  ({
    renderMarkdown,
  }: {
    renderMarkdown: (el: HTMLElement, markdown: string) => () => void;
  }) =>
  ({
    getMarkdown,
    getTaskLines,
    onCheckboxLineClick,
  }: {
    onCheckboxLineClick?: (line: number) => Promise<void>;
    getMarkdown: () => string;
    getTaskLines: () => Array<number | undefined>;
  }) =>
  (el: HTMLElement) => {
    $effect(() => {
      const destroyMarkdown = renderMarkdown(el, getMarkdown());

      $effect(() => {
        addLineDataToCheckboxes(el, getTaskLines());
      });

      return () => {
        destroyMarkdown();
      };
    });

    return on(el, "click", async (event: PointerEvent) => {
      if (onCheckboxLineClick) {
        await readCheckboxLineData(event, onCheckboxLineClick);
      }
    });
  };
