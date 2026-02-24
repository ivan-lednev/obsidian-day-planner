import { sanitizeHTMLToDom } from "obsidian";

import {
  scrollOnHoverZoneHeightPercent,
  scrollSpeedPixelsPerAnimationFrame,
} from "../constants";
import type { FileLine } from "../task-types";

import { liftToArray } from "./lift";

export function isTouchEvent(event: PointerEvent) {
  return ["pen", "touch"].includes(event.pointerType);
}

export function getIsomorphicClientY(
  event: PointerEvent | MouseEvent | TouchEvent,
) {
  if (event instanceof PointerEvent || event instanceof MouseEvent) {
    return event.clientY;
  }

  const firstTouch = event.touches[0];

  return firstTouch.pageY;
}

export function isEventRelated(
  event: PointerEvent,
  otherNode: HTMLElement | null,
) {
  if (!otherNode) {
    return false;
  }

  return (
    event.relatedTarget &&
    (event.relatedTarget === otherNode ||
      (event.relatedTarget instanceof Node &&
        otherNode.contains(event.relatedTarget)))
  );
}

export function isEventOutside(
  event: PointerEvent,
  container: HTMLElement | null,
) {
  if (!container) {
    return false;
  }

  return (
    event.target !== container &&
    event.target instanceof Node &&
    !container.contains(event.target)
  );
}

export function mountSanitized(el: HTMLElement, html: string) {
  if (!html) {
    return;
  }

  el.empty();

  const fragment = sanitizeHTMLToDom(html);

  el.appendChild(fragment);
}

export function offsetYToMinutes(
  offsetY: number,
  zoomLevel: number,
  startHour: number,
) {
  const hiddenHoursSize = startHour * 60 * zoomLevel;

  return (offsetY + hiddenHoursSize) / zoomLevel;
}

export function getDarkModeFlag() {
  return document.body.hasClass("theme-dark");
}

export function getPointerOffsetY(
  el: HTMLElement,
  event: MouseEvent | TouchEvent,
) {
  const viewportToElOffsetY = el.getBoundingClientRect().top;

  return getIsomorphicClientY(event) - viewportToElOffsetY;
}

export function getScrollZones(
  event: MouseEvent | TouchEvent,
  el: HTMLElement,
) {
  const pointerOffsetY = getPointerOffsetY(el, event);

  const isInTopScrollZone =
    (el.clientHeight / 100) * scrollOnHoverZoneHeightPercent >= pointerOffsetY;
  const isInBottomScrollZone =
    (el.clientHeight / 100) * (100 - scrollOnHoverZoneHeightPercent) <=
    pointerOffsetY;

  return { isInBottomScrollZone, isInTopScrollZone };
}

type ScrollDirection = "up" | "down";
type ScrollProps = { el: HTMLElement; direction: ScrollDirection };

export function createAutoScroll() {
  let scrolling = false;

  function stopScroll() {
    scrolling = false;
  }

  function scroll(props: ScrollProps) {
    const { el, direction } = props;

    requestAnimationFrame(() => {
      if (!scrolling) {
        return;
      }

      if (direction === "up") {
        el.scrollTop -= scrollSpeedPixelsPerAnimationFrame;
      } else if (direction === "down") {
        el.scrollTop += scrollSpeedPixelsPerAnimationFrame;
      }

      scroll(props);
    });
  }

  function startScroll(props: ScrollProps) {
    if (scrolling) {
      return;
    }

    scrolling = true;

    scroll(props);
  }

  return { startScroll, stopScroll };
}

export const checkboxInRenderedMarkdownSelector =
  '[data-task] input[type="checkbox"]';

export function addLineDataToCheckboxes(
  el: HTMLElement,
  lines?: FileLine[] | FileLine,
) {
  if (!lines) {
    return;
  }

  const linesWithCheckboxes = liftToArray(lines).filter((line) => line.task);

  el.querySelectorAll(checkboxInRenderedMarkdownSelector).forEach(
    (checkbox, i) => {
      if (!(checkbox instanceof HTMLElement)) {
        return;
      }

      checkbox.dataset.line = String(linesWithCheckboxes[i].line);
    },
  );
}

export async function readCheckboxLineData(
  event: PointerEvent,
  checkFn: (line: number) => Promise<void>,
) {
  if (!(event.target instanceof HTMLElement)) {
    return;
  }

  const line = event.target.dataset.line;

  if (!line) {
    return;
  }

  event.stopPropagation();

  await checkFn(Number(line));
}
