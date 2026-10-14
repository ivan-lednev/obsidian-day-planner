import { getActivityDisplayLabel } from "./activity-definitions";
import { getOpenActivityLog } from "./activity-open-clock";
import { getActivityQualityLabel } from "./activity-presentation";
import type { StoredActivity } from "./activity-repository";
import { parseActivityTimestamp } from "./activity-time";
import { getActivityBlockColors } from "./color";

/** One clock per activity, with completed sessions retained in its log history. */
export function buildActivityActiveClocks(
  entries: StoredActivity[],
  dark = false,
) {
  return {
    clocks: entries.flatMap(({ id, record }) => {
      const colors = getActivityBlockColors(record.activity, dark);
      const log = getOpenActivityLog(record);
      if (!log) return [];
      const start = parseActivityTimestamp(log.start);
      return [
        {
          id,
          logStart: log.start,
          title: getActivityDisplayLabel(record.activity, record),
          startedAt: start.valueOf(),
          startLabel: start.format("HH:mm"),
          notes: record.notes ?? "",
          qualityLabel: getActivityQualityLabel(record.quality),
          background: colors?.background ?? (dark ? "#252525" : "#f5f5f5"),
          border: colors?.border ?? (dark ? "#777777" : "#b0b0b0"),
        },
      ];
    }),
  };
}
