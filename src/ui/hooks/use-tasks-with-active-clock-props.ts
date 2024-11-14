import { STask } from "obsidian-dataview";
import { derived, type Readable } from "svelte/store";
import { isExactly } from "typed-assert";

import { clockKey } from "../../constants";
import * as c from "../../util/clock";
import * as dv from "../../util/dataview";
import { liftToArray } from "../../util/lift";

interface UseActiveClocksProps {
  dataviewTasks: Readable<STask>;
}

export function useTasksWithActiveClockProps({
  dataviewTasks,
}: UseActiveClocksProps) {
  return derived([dataviewTasks], ([$dataviewTasks]) => {
    return (
      $dataviewTasks
        .filter(c.hasActiveClockProp)
        // todo: remove the hack
        .map((sTask: STask) => {
          const activeClockPropValue = liftToArray(sTask[clockKey]).find(
            c.isActiveClockPropValue,
          );

          isExactly(
            activeClockPropValue?.isLuxonDateTime,
            true,
            `Expected to receive a pre-parsed Luxon date for active clock, received: ${activeClockPropValue}`,
          );

          const startTime = window.moment(activeClockPropValue.toJSDate());

          return dv.toTaskWithActiveClock(sTask, startTime);
        })
    );
  });
}
