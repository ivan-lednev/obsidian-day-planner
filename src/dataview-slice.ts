import { createAction, isAnyOf, type PayloadAction } from "@reduxjs/toolkit";
import type { STask } from "obsidian-dataview";

import { createAppSlice } from "./createAppSlice";
import { selectSettings } from "./globalSlice";
import { DataviewFacade } from "./service/dataview-facade";
import { createBackgroundBatchScheduler } from "./util/scheduler";

interface DataviewSliceState {
  dataviewTasks: Array<STask>;
  dataviewLoaded: boolean;
}

const initialState: DataviewSliceState = {
  dataviewTasks: [],
  dataviewLoaded: false,
};

export const dataviewSlice = createAppSlice({
  name: "dataview",
  initialState,
  reducers: (create) => ({
    dataviewChange: create.reducer((state) => {
      state.dataviewLoaded = true;
    }),
    dataviewTasksUpdated: create.reducer(
      (state, action: PayloadAction<Array<STask>>) => {
        state.dataviewTasks = action.payload;
      },
    ),
  }),
  selectors: {
    selectDataviewTasks: (state) => state.dataviewTasks,
  },
});

export const dataviewRefreshRequested = createAction(
  "obsidian/dataviewRefreshRequested",
);
export const dataviewListenerStarted = createAction(
  "obsidian/dataviewListenerStarted",
);
export const dataviewListenerStopped = createAction(
  "obsidian/dataviewListenerStopped",
);

export const { dataviewChange, dataviewTasksUpdated } = dataviewSlice.actions;

export const { selectDataviewTasks } = dataviewSlice.selectors;

const dataviewPageParseMinimalTimeMillis = 5;

// todo: fix types
export function startDataviewListeners(startListening) {
  startListening({
    actionCreator: dataviewListenerStarted,
    effect: async (action, listenerApi) => {
      listenerApi.unsubscribe();

      // todo: move types out
      const { dataviewFacade }: { dataviewFacade: DataviewFacade } =
        listenerApi.extra;

      const scheduler = createBackgroundBatchScheduler({
        timeRemainingLowerLimit: dataviewPageParseMinimalTimeMillis,
      });

      while (true) {
        // todo: react to settings
        const [action, currentState] = await listenerApi.take(
          isAnyOf(dataviewRefreshRequested, dataviewListenerStopped),
        );

        if (action.type === dataviewListenerStopped.type) {
          listenerApi.subscribe();
          break;
        }

        const { dataviewSource } = selectSettings(currentState);

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
