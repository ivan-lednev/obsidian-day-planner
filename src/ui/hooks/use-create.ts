import { createPlanItemFromTimeline } from "../../parser/parser";
import { appendToPlan } from "../../plan";
import { tasks } from "../../store/timeline-store";
import { getDailyNoteForToday } from "../../util/daily-notes";
import { get, writable } from "svelte/store";

export function useCreate() {
  const creating = writable(false);

  function startCreation() {
    creating.set(true);
  }

  function cancelCreation() {
    creating.set(false);
  }

  async function confirmCreation(pointerYOffset: number) {
    // todo: out of place
    if (!get(creating)) {
      return;
    }

    creating.set(false);

    const newPlanItem = createPlanItemFromTimeline(pointerYOffset);

    // @ts-ignore
    tasks.update((previous) => [...previous, newPlanItem]);

    // @ts-ignore
    await appendToPlan(getDailyNoteForToday().path, newPlanItem);
  }

  return {
    creating,
    startCreation,
    cancelCreation,
    confirmCreation,
  };
}
