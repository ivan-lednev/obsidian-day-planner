import { createListenerMiddleware } from "@reduxjs/toolkit";
import { store } from "./store";
import { icalRefreshRequested } from "./globalSlice";

export const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: icalRefreshRequested,
  effect: async (action, listenerApi) => {
    listenerApi.getState();
  },
});
