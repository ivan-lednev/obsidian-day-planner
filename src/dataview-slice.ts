import {
  createAction,
  isAnyOf,
  type Action,
  type PayloadAction,
  type TypedStartListening,
} from "@reduxjs/toolkit";
import type { STask } from "obsidian-dataview";

import { createAppSlice } from "./createAppSlice";
import {
  checkDataviewSourceChanged,
  selectDataviewSource,
} from "./settings-slice";
import type { AppDispatch, RootState } from "./store";
import type { ReduxExtraArgument } from "./types";
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

export function initDataviewListeners(
  startListening: TypedStartListening<
    RootState,
    AppDispatch,
    ReduxExtraArgument
  >,
) {
  startListening({
    actionCreator: dataviewListenerStarted,
    effect: async (action, listenerApi) => {
      listenerApi.unsubscribe();

      const { dataviewFacade } = listenerApi.extra;
      const scheduler = createBackgroundBatchScheduler({
        timeRemainingLowerLimit: dataviewPageParseMinimalTimeMillis,
      });

      function checkUpdateRequired(action: Action, currentState: RootState) {
        return (
          isAnyOf(
            dataviewListenerStopped,
            dataviewRefreshRequested,
            dataviewChange,
          )(action) || checkDataviewSourceChanged(action, currentState)
        );
      }

      while (true) {
        const [action, currentState] =
          await listenerApi.take(checkUpdateRequired);

        if (action.type === dataviewListenerStopped.type) {
          listenerApi.subscribe();
          break;
        }

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
