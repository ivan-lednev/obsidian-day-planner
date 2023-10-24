import { EditMode } from "./types";

interface UseCursorProps {
  editMode: EditMode;
  editBlocked: boolean;
}

export function useCursor({ editMode, editBlocked }: UseCursorProps) {
  if (editBlocked) {
    return {
      bodyCursor: "unset",
      gripCursor: "wait",
      containerCursor: "wait",
    };
  }

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
