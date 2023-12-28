import { isString } from "lodash/fp";
import { STask } from "obsidian-dataview";
import { derived } from "svelte/store";

import {
  areValidClockMoments,
  liftToArray,
  toClockMoments,
} from "../../util/clock";
import { unwrap } from "../../util/dataview";
import { splitMultiday } from "../../util/moment";
import { getDayKey } from "../../util/tasks-utils";

import { UseDayToScheduledStasksProps } from "./use-day-to-scheduled-stasks";

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

export function useDayToStasksWithClockMoments({
  dataviewTasks,
}: UseDayToScheduledStasksProps) {
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
