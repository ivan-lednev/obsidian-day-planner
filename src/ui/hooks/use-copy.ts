import { flow, map } from "lodash/fp";
import { get, Writable, writable } from "svelte/store";

import {
  getTimeFromYOffset,
  roundToSnapStep,
} from "../../global-stores/settings-utils";
import type { PlacedPlanItem } from "../../types";
import { getId } from "../../util/id";
import { addPlacing } from "../../util/obsidian";
import { appendToPlan } from "../../util/plan";

export function useCopy() {
  const copying = writable(false);

  function startCopy(
    planItem: PlacedPlanItem,
    tasks: Writable<PlacedPlanItem[]>,
  ) {
    copying.set(true);
    tasks.update((prev) => [
      ...prev,
      { ...planItem, isGhost: true, id: getId() },
    ]);
  }

  async function confirmCopy(
    tasks: Writable<PlacedPlanItem[]>,
    pointerYOffset: number,
  ) {
    if (!get(copying)) {
      return;
    }

    copying.set(false);

    const newPlanItem = get(tasks).find((task) => task.isGhost);

    const newStartMinutes = getTimeFromYOffset(roundToSnapStep(pointerYOffset));
    const newEndMinutes = newStartMinutes + newPlanItem.durationMinutes;

    const withRealTime = {
      ...newPlanItem,
      startMinutes: newStartMinutes,
      endMinutes: newEndMinutes,
      isGhost: false,
    };

    tasks.update(
      flow(
        map((task) => {
          if (task.isGhost) {
            return withRealTime;
          }

          return task;
        }),
        addPlacing,
      ),
    );

    await appendToPlan(newPlanItem.location.path, withRealTime);
  }

  return {
    copying,
    confirmCopy,
    startCopy,
  };
}
