import { on } from "svelte/events";

import {
  scrollOnHoverZoneHeightPercent,
  scrollSpeedPixelsPerAnimationFrame,
} from "../constants";

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
  taskLines: Array<number | undefined>,
) {
  if (!taskLines) {
    return;
  }

  el.querySelectorAll(checkboxInRenderedMarkdownSelector).forEach(
    (checkbox, i) => {
      const taskLine = taskLines[i];

      if (!(checkbox instanceof HTMLElement) || !taskLine) {
        return;
      }

      checkbox.dataset.line = String(taskLine);
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

function stopPropagationForElWithLineData(event: Event) {
  if (event.target instanceof HTMLElement && event.target.dataset.line) {
    event.stopPropagation();
  }
}

export function createRenderMarkdownAttachment({
  renderMarkdown,
  markdown,
  taskLines,
  onCheckboxLineClick,
}: {
  renderMarkdown: (el: HTMLElement, markdown: string) => () => void;
  markdown: string;
  taskLines: Array<number | undefined>;
  onCheckboxLineClick?: (line: number) => Promise<void>;
}) {
  return (el: HTMLElement) => {
    const destroyMarkdown = renderMarkdown(el, markdown);

    addLineDataToCheckboxes(el, taskLines);

    const offPointerUp = on(el, "pointerup", (event: PointerEvent) => {
      if (onCheckboxLineClick) {
        readCheckboxLineData(event, onCheckboxLineClick);
      }
    });
    const offMouseUp = on(el, "mouseup", stopPropagationForElWithLineData);
    // todo: fix checkboxes
    const offTouchEnd = on(el, "touchend", stopPropagationForElWithLineData);

    return () => {
      destroyMarkdown();
      offPointerUp();
      offMouseUp();
      offTouchEnd();
    };
  };
}
