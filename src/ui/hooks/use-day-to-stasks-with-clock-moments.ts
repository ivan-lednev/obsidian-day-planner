import { isString } from "lodash/fp";
import { DataArray, STask } from "obsidian-dataview";
import { derived, type Readable } from "svelte/store";

import { areValidClockMoments, toClockMoments } from "../../util/clock";
import { unwrap } from "../../util/dataview";
import { liftToArray } from "../../util/lift";
import { splitMultiday } from "../../util/moment";
import { getDayKey } from "../../util/tasks-utils";

function withClockMoments(sTask: STask) {
  return liftToArray(sTask.clocked)
    .filter(isString)
    .map(toClockMoments)
    .filter(areValidClockMoments)
    .flatMap(([start, end]) => splitMultiday(start, end))
    .map((clockMoments) => ({
      sTask,
      clockMoments,
    }));
}

export function useDayToStasksWithClockMoments(
  dataviewTasks: Readable<DataArray<STask>>,
) {
  return derived(dataviewTasks, ($dataviewTasks) => {
    if (!$dataviewTasks) {
      return {};
    }

    return Object.fromEntries(
      unwrap(
        $dataviewTasks
          .filter((sTask) => sTask.clocked)
          .flatMap(withClockMoments)
          .groupBy(({ clockMoments: [start] }) => getDayKey(start)),
      ),
    );
  });
}
