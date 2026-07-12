import { getDayKeysInRange, strictParse } from "../../util/moment";

export function createLogEntry(props: {
  start: string;
  end?: string;
  parent: string;
  id: string;
}) {
  const { start, end, parent, id } = props;

  const parsedStart = strictParse(start);

  const parsedEnd = end
    ? strictParse(end)
    : // TODO: P3 bug
      //  Solution 1: dispatch dayChanged() and update active clocks then; simple & works
      //  Solution 2: calculate dayKeys for active clocks on the fly in selectActiveLogEntries selector
      //  Solution 3: use sorted array instead of buckets
      window.moment();

  const dayKeys: string[] = getDayKeysInRange(parsedStart, parsedEnd);

  return { start, end, parent, dayKeys, id };
}
