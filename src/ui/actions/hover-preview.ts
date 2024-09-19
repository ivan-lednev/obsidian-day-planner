import { getContext } from "svelte";
import { derived, writable } from "svelte/store";

import { obsidianContext } from "../../constants";
import type { LocalTask } from "../../task-types";
import type { ObsidianContext } from "../../types";

export function hoverPreview(el: HTMLElement, task: LocalTask) {
  const { isModPressed, showPreview } =
    getContext<ObsidianContext>(obsidianContext);

  const hovering = writable(false);

  function handleMouseEnter() {
    hovering.set(true);
  }

  function handleMouseLeave() {
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
    if (newValue && task.location?.path) {
      showPreview(el, task.location.path, task.location.position?.start?.line);
    }
  });

  return {
    destroy() {
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      unsubscribe();
    },
  };
}
