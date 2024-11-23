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

/**
 * A scheduler accepts a list of tasks (a batch) and reports back when all of them are done.
 * If a new batch of tasks is added, the scheduler will discard the previous batch and run the new one.
 */
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
