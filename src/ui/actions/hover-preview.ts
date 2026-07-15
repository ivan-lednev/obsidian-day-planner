import { derived, writable } from "svelte/store";

import { getObsidianContext } from "../../context/obsidian-context";
import { isListItemSourced, type LocalTimeBlock } from "../../time-block-types";

export function hoverPreview(task: LocalTimeBlock) {
  return (el: HTMLElement) => {
    const { isModPressed, showPreview } = getObsidianContext();
    let currentEvent: MouseEvent | undefined;

    const hovering = writable(false);

    function handleMouseEnter(event: MouseEvent) {
      currentEvent = event;
      hovering.set(true);
    }

    function handleMouseLeave(event: MouseEvent) {
      currentEvent = undefined;
      hovering.set(false);
    }

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);

    const shouldShowPreview = derived(
      [isModPressed, hovering],
      ([$isModPressed, $hovering]) => {
        return $isModPressed && $hovering;
      },
    );

    const unsubscribe = shouldShowPreview.subscribe((newValue) => {
      if (!newValue || !currentEvent) {
        return;
      }

      if (task.source === "unwritten") {
        return;
      }

      showPreview(
        el,
        currentEvent,
        task.path,
        isListItemSourced(task) ? task.position.start.line : undefined,
      );
    });

    return {
      destroy() {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
        unsubscribe();
      },
    };
  };
}
