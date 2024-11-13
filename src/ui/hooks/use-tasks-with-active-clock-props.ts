import { STask } from "obsidian-dataview";
import { derived, type Readable } from "svelte/store";

import { hasActiveClockProp } from "../../util/clock";
import * as dv from "../../util/dataview";

interface UseActiveClocksProps {
  dataviewTasks: Readable<STask>;
}

export function useTasksWithActiveClockProps({
  dataviewTasks,
}: UseActiveClocksProps) {
  return derived([dataviewTasks], ([$dataviewTasks]) => {
    return (
      $dataviewTasks
        .filter(hasActiveClockProp)
        // todo: remove the hack
        .map((sTask) => dv.toUnscheduledTask(sTask, window.moment()))
    );
  });
}
