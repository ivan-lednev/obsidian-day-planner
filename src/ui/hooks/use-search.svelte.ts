import { derived, get, writable, type Readable } from "svelte/store";

import type { DataviewFacade } from "../../service/dataview-facade";
import * as dv from "../../util/dataview";
import { getUpdateTrigger } from "../../util/store";

import { useDebounceWithDelay } from "./use-debounce-with-delay";

export function useSearch(props: {
  dataviewFacade: DataviewFacade;
  dataviewSource: Readable<string>;
  taskUpdateTrigger: Readable<unknown>;
  keyDown: Readable<unknown>;
}) {
  const { dataviewFacade, dataviewSource, taskUpdateTrigger, keyDown } = props;

  const sourceSignal = dataviewSource;
  const query = writable("");
  const updateSignal = derived([taskUpdateTrigger, query], getUpdateTrigger);
  // todo: pass through update signal
  const debouncedSearchSignal = useDebounceWithDelay(
    updateSignal,
    keyDown,
    500,
  );

  const result = derived(debouncedSearchSignal, () => {
    const currentQuery = get(query);
    const currentSource = get(sourceSignal);

    if (currentQuery.trim().length === 0) {
      return [];
    }

    return (
      dataviewFacade
        .getAllTasksFrom(currentSource)
        .filter((task) => {
          return task.text.toLowerCase().includes(currentQuery.toLowerCase());
        })
        // todo: remove moment
        .map((task) => dv.toUnscheduledTask(task, window.moment()))
    );
  });

  return {
    query,
    result,
  };
}
