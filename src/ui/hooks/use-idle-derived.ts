import { derived, type Readable } from "svelte/store";

import { createBackgroundBatchScheduler } from "../../util/scheduler";

export function useIdleDerived<T>(props: {
  batch: Readable<Array<() => T>>;
  timeRemainingLowerLimit: number;
  initial: T[];
}) {
  const { batch, timeRemainingLowerLimit, initial } = props;

  const scheduler = createBackgroundBatchScheduler<T>({
    timeRemainingLowerLimit,
  });

  return derived(
    batch,
    ($batch, set) => {
      scheduler.enqueueTasks($batch, set);
    },
    initial,
  );
}
