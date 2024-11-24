import type { STask } from "obsidian-dataview";
import { derived, writable, type Readable } from "svelte/store";

import { searchResultLimit } from "../../constants";
import * as dv from "../../util/dataview";

export function useSearch(props: {
  dataviewTasks: Readable<Array<STask>>;
  dataviewSource: Readable<string>;
}) {
  const { dataviewSource, dataviewTasks } = props;

  const query = writable("");

  const matchedStasks = derived(
    [query, dataviewTasks, dataviewSource],
    ([$query, $dataviewTasks]) =>
      $query.trim().length === 0
        ? []
        : $dataviewTasks.filter((task) =>
            task.text.toLowerCase().includes($query),
          ),
  );

  const description = derived(
    [query, matchedStasks],
    ([$query, $matchedStasks]) => {
      if ($query.trim().length === 0) {
        return "Empty";
      }

      if ($matchedStasks.length === 0) {
        return "No matches";
      }

      if ($matchedStasks.length > searchResultLimit) {
        return `Limited to ${searchResultLimit} entries. Try refining your search.`;
      }

      return `${$matchedStasks.length} matches`;
    },
  );

  const result = derived(matchedStasks, ($matchedStasks) => {
    return (
      $matchedStasks
        .slice(0, searchResultLimit)
        // todo: remove moment
        .map((task) => dv.toUnscheduledTask(task, window.moment()))
    );
  });

  return {
    query,
    result,
    description,
  };
}
