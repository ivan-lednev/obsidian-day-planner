import { derived, get, Writable } from "svelte/store";

import { editStatus } from "../../store/timeline-store";

export function useEdit(editing: Writable<boolean>) {
  const editConfirmed = derived(
    [editing, editStatus],
    ([$editing, $editStatus]) => $editing && $editStatus === "confirmed",
  );

  function startEdit() {
    editing.set(true);
    editStatus.set("started");
  }

  function stopEdit() {
    editing.set(false);
    editStatus.set("idle");
  }

  editStatus.subscribe((value) => {
    if (value === "cancelled" && get(editing)) {
      stopEdit();
    }
  });

  return {
    startEdit,
    stopEdit,
    editConfirmed,
  };
}
