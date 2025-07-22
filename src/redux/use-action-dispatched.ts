import type { Action } from "@reduxjs/toolkit";
import { readable } from "svelte/store";

import type { AppListenerMiddlewareInstance } from "./store";

export function useActionDispatched(props: {
  listenerMiddleware: AppListenerMiddlewareInstance;
}) {
  const { listenerMiddleware } = props;

  return readable<Action>(undefined, (set) => {
    return listenerMiddleware.startListening({
      predicate: () => true,
      effect: (action) => {
        set(action);
      },
    });
  });
}
