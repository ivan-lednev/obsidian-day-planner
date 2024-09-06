/**
 * This is needed for iOS Safari. Obsidian might add its own shims. We don't want to mess with those.
 */
const enqueueJob =
  window.requestIdleCallback ||
  ((callback, options) => {
    const optionsWithDefaults = options || {};
    const relaxation = 1;
    const timeout = optionsWithDefaults.timeout || relaxation;
    const start = performance.now();

    return window.setTimeout(() => {
      callback({
        get didTimeout() {
          return optionsWithDefaults.timeout
            ? false
            : performance.now() - start - relaxation > timeout;
        },
        timeRemaining: function () {
          return Math.max(0, relaxation + (performance.now() - start));
        },
      });
    }, relaxation);
  });

const cancelJob =
  window.cancelIdleCallback ||
  ((id) => {
    clearTimeout(id);
  });

export function createBackgroundBatchScheduler<T>(
  onFinish: (results: T[]) => void,
) {
  const timeRemainingLowerLimit = 10;

  let results: T[] = [];
  let tasks: Array<() => T> = [];
  let currentTaskHandle: number | null = null;

  function runTaskQueue(deadline: IdleDeadline) {
    while (
      (deadline.timeRemaining() > timeRemainingLowerLimit ||
        deadline.didTimeout) &&
      tasks.length > 0
    ) {
      const task = tasks.shift();

      if (task) {
        results.push(task());
      }
    }

    if (tasks.length > 0) {
      currentTaskHandle = enqueueJob(runTaskQueue);
    } else {
      performance.mark("batch-end");
      // const { duration } = performance.measure(
      //   "batch",
      //   "batch-start",
      //   "batch-end",
      // );

      onFinish(results);
      currentTaskHandle = null;
    }
  }

  function enqueueTasks(newTasks: Array<() => T>) {
    performance.mark("batch-start");
    if (currentTaskHandle) {
      cancelJob(currentTaskHandle);
      currentTaskHandle = null;
    }

    tasks = newTasks;
    results = [];
    currentTaskHandle = enqueueJob(runTaskQueue);
  }

  return { enqueueTasks };
}
