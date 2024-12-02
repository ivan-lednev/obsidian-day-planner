import { createAction, type PayloadAction } from "@reduxjs/toolkit";
import ical from "node-ical";

import { createAppSlice } from "./createAppSlice";
import type { WithIcalConfig } from "./types";

interface IcalState {
  icalEvents: Array<WithIcalConfig<ical.VEvent>>;
}

const initialState: IcalState = {
  icalEvents: [],
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
  }),
});

export const icalRefreshRequested = createAction("ical/icalRefreshRequested");
export const icalListenerStarted = createAction("ical/icalListenerStarted");

export const { icalEventsUpdated } = icalSlice.actions;
