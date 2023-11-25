import { EditMode } from "./types";

interface UseCursorProps {
  editMode: EditMode;
}

export function useCursor({ editMode }: UseCursorProps) {
  if (
    editMode === EditMode.CREATE ||
    editMode === EditMode.DRAG ||
    editMode === EditMode.DRAG_AND_SHIFT_OTHERS
  ) {
    return {
      bodyCursor: "grabbing",
      gripCursor: "grabbing",
    };
  }

  if (
    editMode === EditMode.RESIZE ||
    editMode === EditMode.RESIZE_AND_SHIFT_OTHERS
  ) {
    return { bodyCursor: "row-resize", gripCursor: "grab" };
  }

  return {
    bodyCursor: "unset",
    gripCursor: "grab",
  };
}
