import { createPlanItemFromTimeline } from "src/parser/parser";
import { appendToPlan } from "src/plan";
import { tasks } from "src/store/timeline-store";
import { getDailyNoteForToday } from "src/util/daily-notes";
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
