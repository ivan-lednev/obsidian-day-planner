import TinyGesture from "tinygesture";

import type { LocalTask, WithTime } from "../../task-types";
import { EditMode } from "../hooks/use-edit/types";

const edgeThresholdPx = 6;

type EditStartFn = (task: WithTime<LocalTask>, mode: EditMode) => void;

interface BlockDragResizeOptions {
  getTask: () => LocalTask;
  handleGripMouseDown: EditStartFn;
  handleResizerMouseDown: EditStartFn;
}

type EdgeZone = "top" | "bottom" | "center";

function getEdgeZone(
  el: HTMLElement,
  clientY: number,
): EdgeZone {
  const rect = el.getBoundingClientRect();
  const relativeY = clientY - rect.top;
  const blockHeight = rect.height;

  if (relativeY <= edgeThresholdPx) {
    return "top";
  }

  if (relativeY >= blockHeight - edgeThresholdPx) {
    return "bottom";
  }

  return "center";
}

function getCursorForZone(zone: EdgeZone, isAllDay: boolean): string {
  if (isAllDay) {
    return "grab";
  }

  return zone === "center" ? "grab" : "ns-resize";
}

function getEditMode(zone: EdgeZone, isAllDay: boolean): EditMode {
  if (isAllDay || zone === "center") {
    return EditMode.DRAG;
  }

  return zone === "top" ? EditMode.RESIZE_FROM_TOP : EditMode.RESIZE;
}

function isCheckbox(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.dataset.line !== undefined ||
    (target instanceof HTMLInputElement && target.type === "checkbox")
  );
}

export function createBlockDragResize(options: BlockDragResizeOptions) {
  return (el: HTMLElement) => {
    const { getTask, handleGripMouseDown, handleResizerMouseDown } = options;

    let pointerDownZone: EdgeZone = "center";
    let editStarted = false;
    let pointerDownOnCheckbox = false;

    const gesture = new TinyGesture(el);

    function handlePointerDown(event: PointerEvent) {
      pointerDownOnCheckbox = isCheckbox(event.target);

      if (pointerDownOnCheckbox) {
        return;
      }

      pointerDownZone = getEdgeZone(el, event.clientY);
      editStarted = false;
    }

    function handlePointerMoveForCursor(event: PointerEvent) {
      if (!editStarted && !pointerDownOnCheckbox) {
        const currentTask = getTask();
        const isAllDay = Boolean(currentTask.isAllDayEvent);
        const zone = getEdgeZone(el, event.clientY);
        el.style.cursor = getCursorForZone(zone, isAllDay);
      }
    }

    function handlePointerLeave() {
      if (!editStarted) {
        el.style.cursor = "";
      }
    }

    gesture.on("panmove", () => {
      if (editStarted || pointerDownOnCheckbox) {
        return;
      }

      editStarted = true;
      const currentTask = getTask();
      const isAllDay = Boolean(currentTask.isAllDayEvent);
      el.style.cursor = pointerDownZone === "center" ? "grabbing" : "ns-resize";

      const mode = getEditMode(pointerDownZone, isAllDay);

      if (mode === EditMode.DRAG) {
        handleGripMouseDown(currentTask as WithTime<LocalTask>, mode);
      } else {
        handleResizerMouseDown(currentTask as WithTime<LocalTask>, mode);
      }
    });

    gesture.on("panend", () => {
      editStarted = false;
      pointerDownOnCheckbox = false;
      el.style.cursor = "";
    });

    el.addEventListener("pointerdown", handlePointerDown);
    el.addEventListener("pointermove", handlePointerMoveForCursor);
    el.addEventListener("pointerleave", handlePointerLeave);

    return {
      destroy() {
        gesture.destroy();
        el.removeEventListener("pointerdown", handlePointerDown);
        el.removeEventListener("pointermove", handlePointerMoveForCursor);
        el.removeEventListener("pointerleave", handlePointerLeave);
      },
    };
  };
}
