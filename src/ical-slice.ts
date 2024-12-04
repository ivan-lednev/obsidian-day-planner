import { createAction, type PayloadAction } from "@reduxjs/toolkit";
import ical from "node-ical";

import { createAppSlice } from "./createAppSlice";
import type { RemoteTask } from "./task-types";
import type { WithIcalConfig } from "./types";

interface IcalState {
  icalEvents: Array<WithIcalConfig<ical.VEvent>>;
  remoteTasks: Array<RemoteTask>;
}

const initialState: IcalState = {
  icalEvents: [],
  remoteTasks: [],
};

export const icalSlice = createAppSlice({
  name: "ical",
  initialState,
  reducers: (create) => ({
    icalEventsUpdated: create.reducer(
      (state, action: PayloadAction<Array<WithIcalConfig<ical.VEvent>>>) => {
        state.icalEvents = action.payload;
      },
    ),
    remoteTasksUpdated: create.reducer(
      (state, action: PayloadAction<Array<RemoteTask>>) => {
        state.remoteTasks = action.payload;
      },
    ),
  }),
  selectors: {
    selectIcalEvents: (state) => state.icalEvents,
    selectRemoteTasks: (state) => state.remoteTasks,
  },
});

export const icalRefreshRequested = createAction("ical/icalRefreshRequested");
export const icalListenerStarted = createAction("ical/icalListenerStarted");

export const { icalEventsUpdated, remoteTasksUpdated } = icalSlice.actions;
export const { selectIcalEvents, selectRemoteTasks } = icalSlice.selectors;
