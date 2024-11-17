import { STask } from "obsidian-dataview";
import { derived, type Readable } from "svelte/store";

import { clockKey } from "../../constants";
import * as c from "../../util/clock";
import * as dv from "../../util/dataview";
import { toTaskWithActiveClock } from "../../util/dataview";
import { liftToArray } from "../../util/lift";

type TasksWithActiveClockProps = Array<
  ReturnType<typeof toTaskWithActiveClock>
>;

export function useTasksWithActiveClockProps(props: {
  dataviewTasks: Readable<Array<STask>>;
}) {
  const { dataviewTasks } = props;

  return derived([dataviewTasks], ([$dataviewTasks]) =>
    $dataviewTasks.reduce<TasksWithActiveClockProps>((result, current) => {
      const activeClockPropValue = liftToArray(current[clockKey] ?? []).find(
        c.isActiveClockPropValue,
      );

      if (activeClockPropValue?.isLuxonDateTime) {
        const startTime = window.moment(activeClockPropValue.toJSDate());

        result.push(dv.toTaskWithActiveClock(current, startTime));
      }

      return result;
    }, []),
  );
}
