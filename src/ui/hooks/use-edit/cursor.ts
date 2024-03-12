import { derived, Readable } from "svelte/store";

import { EditMode, EditOperation } from "./types";

export function useCursor(editOperation: Readable<EditOperation>) {
  return derived(editOperation, ($editOperation) => {
    const { mode } = $editOperation;

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
      bodyCursor: "unset",
      gripCursor: "grab",
    };
  });
}
