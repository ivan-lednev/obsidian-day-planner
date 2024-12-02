import { isAnyOf, type Action } from "@reduxjs/toolkit";

import {
  dataviewChange,
  dataviewListenerStarted,
  dataviewRefreshRequested,
  dataviewTasksUpdated,
} from "./dataview-slice";
import {
  checkDataviewSourceChanged,
  selectDataviewSource,
} from "./settings-slice";
import type { RootState, StartListeningFn } from "./store";
import { createBackgroundBatchScheduler } from "./util/scheduler";

const dataviewPageParseMinimalTimeMillis = 5;

function checkIfDataviewUpdateNeeded(action: Action, currentState: RootState) {
  return (
    isAnyOf(dataviewRefreshRequested, dataviewChange)(action) ||
    checkDataviewSourceChanged(action, currentState)
  );
}

export function initDataviewListeners(startListening: StartListeningFn) {
  startListening({
    actionCreator: dataviewListenerStarted,
    effect: async (action, listenerApi) => {
      listenerApi.unsubscribe();

      const { dataviewFacade } = listenerApi.extra;
      const scheduler = createBackgroundBatchScheduler({
        timeRemainingLowerLimit: dataviewPageParseMinimalTimeMillis,
      });

      while (true) {
        const [, currentState] = await listenerApi.take(
          checkIfDataviewUpdateNeeded,
        );

        const dataviewSource = selectDataviewSource(currentState);

        const pagePaths = dataviewFacade.getPathsFrom(dataviewSource);
        const tasks = pagePaths.map(
          (path) => () => dataviewFacade.getTasksFromPath(path),
        );

        scheduler.enqueueTasks(tasks, (results) => {
          listenerApi.dispatch(dataviewTasksUpdated(results.flat()));
        });
      }
    },
  });
}
