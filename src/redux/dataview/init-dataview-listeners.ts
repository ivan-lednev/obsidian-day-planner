import { isAnyOf, type Action } from "@reduxjs/toolkit";

import { createBackgroundBatchScheduler } from "../../util/scheduler";
import {
  checkDataviewSourceChanged,
  selectDataviewSource,
} from "../settings-slice";
import type { RootState, StartListeningFn } from "../store";

import {
  dataviewChange,
  dataviewListenerStarted,
  dataviewRefreshRequested,
  dataviewTasksUpdated,
} from "./dataview-slice";

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

        // TODO: lists from daily notes go here

        const dataviewSource = selectDataviewSource(currentState);
        const pagePaths = dataviewFacade.getPathsFrom(dataviewSource);
        const tasks = pagePaths.map(
          (path: string) => () => dataviewFacade.getTasksFromPath(path),
        );

        scheduler.enqueueTasks(tasks, (results) => {
          listenerApi.dispatch(dataviewTasksUpdated(results.flat()));
        });
      }
    },
  });
}
