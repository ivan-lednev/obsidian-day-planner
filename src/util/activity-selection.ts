import { getOpenActivityLog } from "./activity-open-clock";
import type { StoredActivity } from "./activity-repository";

/** Platform notifications carry pointers only; records come from the shared repository. */
export interface ActivitySelectionPointer {
  id?: string;
  finishId?: string;
  finishRequested?: boolean;
  finishLogStart?: string;
}

export function resolveActivitySelection<
  T extends Pick<StoredActivity, "id" | "record">,
>(entries: T[], pointer: ActivitySelectionPointer) {
  const open = entries.filter(({ record }) => getOpenActivityLog(record));
  const requestedId =
    pointer.finishId ?? (pointer.finishRequested ? pointer.id : undefined);
  const matches = open.filter(({ id }) => id === requestedId);
  const requested = matches.length === 1 ? matches[0] : undefined;
  const log = requested && getOpenActivityLog(requested.record);
  const validRequest =
    !!log && (!pointer.finishLogStart || pointer.finishLogStart === log.start);
  return {
    requestedId,
    validRequest,
    requestedLog: validRequest ? log : undefined,
    current:
      (validRequest ? requested : undefined) ??
      open.find(({ id }) => id === pointer.id) ??
      open[0],
  };
}
