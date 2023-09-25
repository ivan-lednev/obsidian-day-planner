import { EditMode } from "./types";

export function cursorForMode(mode: EditMode) {
  if (
    mode === EditMode.CREATE ||
    mode === EditMode.DRAG ||
    mode === EditMode.DRAG_AND_SHIFT_OTHERS
  ) {
    return {
      bodyCursor: "grabbing",
      gripCursor: "grabbing",
    };
  }

  if (mode === EditMode.RESIZE || mode === EditMode.RESIZE_AND_SHIFT_OTHERS) {
    return { bodyCursor: "row-resize", gripCursor: "grab" };
  }

  return {
    bodyCursor: undefined,
    gripCursor: "grab",
  };
}
