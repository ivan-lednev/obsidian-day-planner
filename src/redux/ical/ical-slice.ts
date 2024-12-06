import {
  createAction,
  createSelector,
  type PayloadAction,
} from "@reduxjs/toolkit";
import ical from "node-ical";

import type { RemoteTask } from "../../task-types";
import type { WithIcalConfig } from "../../types";
import { createAppSlice } from "../create-app-slice";
import { isVEvent } from "../../util/use-remote-tasks";
import type { IcalConfig } from "../../settings";

export type RawIcal = { icalConfig: IcalConfig; text: string };
export type RemoteTask_v2 = RemoteTask & { startTime: string };

interface IcalState {
  icalEvents: Array<WithIcalConfig<ical.VEvent>>;
  plainTextIcals: Array<RawIcal>;
  remoteTasks: Array<RemoteTask_v2>;
}

const initialState: IcalState = {
  icalEvents: [],
  plainTextIcals: [],
  remoteTasks: [],
};

export const icalSlice = createAppSlice({
  name: "ical",
  initialState,
  reducers: (create) => ({
    icalsFetched: create.reducer(
      (state, action: PayloadAction<Array<RawIcal>>) => {
        state.plainTextIcals = action.payload;
      },
    ),
    remoteTasksUpdated: create.reducer(
      (state, action: PayloadAction<Array<RemoteTask_v2>>) => {
        state.remoteTasks = action.payload;
      },
    ),
  }),
  selectors: {
    selectRemoteTasks: (state) => state.remoteTasks,
    selectPlainTextIcals: (state) => state.plainTextIcals,
  },
});

export const icalRefreshRequested = createAction("ical/icalRefreshRequested");
export const icalListenerStarted = createAction("ical/icalListenerStarted");

export const { remoteTasksUpdated, icalsFetched } = icalSlice.actions;
export const { selectRemoteTasks, selectPlainTextIcals } = icalSlice.selectors;

// todo: better naming
export const selectIcalEvents = createSelector(
  selectPlainTextIcals,
  (rawIcals) =>
    rawIcals.flatMap(
      ({ icalConfig, text }): Array<WithIcalConfig<ical.VEvent>> => {
        const parsed = ical.parseICS(text);

        return Object.values(parsed)
          .filter(isVEvent)
          .map((icalEvent) => ({
            ...icalEvent,
            calendar: icalConfig,
          }));
      },
    ),
);
