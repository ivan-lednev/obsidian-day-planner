import { fromStore, type Readable } from "svelte/store";
import type { DataviewFacade } from "../../service/dataview-facade";
import * as dv from "../../util/dataview";
import { debounce } from "obsidian";

export function useSearch(props: {
  dataviewFacade: DataviewFacade;
  dataviewSource: Readable<string>;
}) {
  const { dataviewFacade, dataviewSource } = props;
  const sourceSignal = fromStore(dataviewSource);

  let query = $state("");
  let result = $state([]);

  const debouncedSearch = debounce(
    (q: string) => {
      if (q.trim().length === 0) {
        result = [];
        return;
      }

      result = dataviewFacade
        .getAllTasksFrom(sourceSignal.current)
        .filter((task) => {
          return task.text.toLowerCase().includes(q.toLowerCase());
        })
        // todo: remove moment
        .map((task) => dv.toUnscheduledTask(task, window.moment()));
    },
    500,
    true,
  );

  return {
    get query() {
      return query;
    },
    set query(value) {
      query = value;
      debouncedSearch(value);
    },
    get result() {
      return result;
    },
  };
}
