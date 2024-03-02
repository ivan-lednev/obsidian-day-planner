// todo: handle errors
// todo: name: idleCallbackQueue
export function createBackgroundBatchScheduler<T>(
  onFinish: (results: T[]) => void,
) {
  // todo: move out
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
      currentTaskHandle = requestIdleCallback(runTaskQueue);
    } else {
      performance.mark("batch-end");
      const { duration } = performance.measure(
        "batch",
        "batch-start",
        "batch-end",
      );
      // todo: move out
      console.log("Batch duration: ", duration);

      onFinish(results);
      currentTaskHandle = null;
    }
  }

  function enqueueTasks(newTasks: Array<() => T>) {
    performance.mark("batch-start");
    if (currentTaskHandle) {
      cancelIdleCallback(currentTaskHandle);
      currentTaskHandle = null;
    }

    tasks = newTasks;
    results = [];
    currentTaskHandle = requestIdleCallback(runTaskQueue);
  }

  return { enqueueTasks };
}
