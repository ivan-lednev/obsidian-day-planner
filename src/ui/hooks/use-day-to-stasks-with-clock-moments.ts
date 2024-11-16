import { isString } from "lodash/fp";
import { STask } from "obsidian-dataview";

import { areValidClockMoments, toClockMoments } from "../../util/clock";
import { liftToArray } from "../../util/lift";
import { splitMultiday } from "../../util/moment";
import { clockKey } from "../../constants";

// todo: move out
export function withClockMoments(sTask: STask) {
  return liftToArray(sTask[clockKey])
    .filter(isString)
    .map(toClockMoments)
    .filter(areValidClockMoments)
    .flatMap(([start, end]) => splitMultiday(start, end))
    .map((clockMoments) => ({
      sTask,
      clockMoments,
    }));
}
