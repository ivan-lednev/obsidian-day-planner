import { derived, type Readable } from "svelte/store";

import { EditMode, type EditOperation } from "./types";

export function useCursor(editOperation: Readable<EditOperation | undefined>) {
  return derived(editOperation, ($editOperation) => {
    if (
      $editOperation?.mode === EditMode.CREATE ||
      $editOperation?.mode === EditMode.DRAG ||
      $editOperation?.mode === EditMode.DRAG_AND_SHIFT_OTHERS
    ) {
      return {
        bodyCursor: "grabbing",
        gripCursor: "grabbing",
      };
    }

    if (
      $editOperation?.mode === EditMode.RESIZE ||
      $editOperation?.mode === EditMode.RESIZE_AND_SHIFT_OTHERS
    ) {
      return { bodyCursor: "row-resize", gripCursor: "grab" };
    }

    return {
      bodyCursor: "unset",
      gripCursor: "grab",
    };
  });
}
