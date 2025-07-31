import { type HeadingCache, MetadataCache, type Pos, TFile } from "obsidian";
import { type SListEntry, STask } from "obsidian-dataview";
import { derived, type Readable } from "svelte/store";

import { DataviewFacade } from "../../service/dataview-facade";
import type { DayPlannerSettings } from "../../settings";
import * as dv from "../../util/dataview";

function getHeadingIndexContaining(position: Pos, headings: HeadingCache[]) {
  return headings.findIndex(
    (heading) => heading.position.start.line === position.start.line,
  );
}

function getIndexOfHeadingAbove(position: Pos, headings: HeadingCache[]) {
  return headings.reduce(
    (previousIndex, lookingAtHeading, index) =>
      lookingAtHeading.position.start.line < position.start.line
        ? index
        : previousIndex,
    -1,
  );
}

/**
 * Copy-pasta from ivan-lednev/better-search-views
 */
function getHeadingBreadcrumbs(position: Pos, headings: HeadingCache[]) {
  const headingBreadcrumbs: HeadingCache[] = [];
  if (headings.length === 0) {
    return headingBreadcrumbs;
  }

  const collectAncestorHeadingsForHeadingAtIndex = (startIndex: number) => {
    let currentLevel = headings[startIndex].level;
    const previousHeadingIndex = startIndex - 1;

    for (let i = previousHeadingIndex; i >= 0; i--) {
      const lookingAtHeading = headings[i];

      if (lookingAtHeading.level < currentLevel) {
        currentLevel = lookingAtHeading.level;
        headingBreadcrumbs.unshift(lookingAtHeading);
      }
    }
  };

  const headingIndexAtPosition = getHeadingIndexContaining(position, headings);
  const positionIsInsideHeading = headingIndexAtPosition >= 0;

  if (positionIsInsideHeading) {
    headingBreadcrumbs.unshift(headings[headingIndexAtPosition]);
    collectAncestorHeadingsForHeadingAtIndex(headingIndexAtPosition);
    return headingBreadcrumbs;
  }

  const headingIndexAbovePosition = getIndexOfHeadingAbove(position, headings);
  const positionIsBelowHeading = headingIndexAbovePosition >= 0;

  if (positionIsBelowHeading) {
    const headingAbovePosition = headings[headingIndexAbovePosition];
    headingBreadcrumbs.unshift(headingAbovePosition);
    collectAncestorHeadingsForHeadingAtIndex(headingIndexAbovePosition);
    return headingBreadcrumbs;
  }

  return headingBreadcrumbs;
}

interface UseDataviewTasksProps {
  visibleDailyNotes: Readable<(TFile | null)[]>;
  dataviewFacade: DataviewFacade;
  metadataCache: MetadataCache;
  settings: Readable<DayPlannerSettings>;
  refreshSignal: Readable<unknown>;
}

export function useDataviewTasks({
  settings,
  visibleDailyNotes,
  dataviewFacade,
  metadataCache,
  refreshSignal,
}: UseDataviewTasksProps) {
  function getListsFromDailyNotesForVisibleDays(
    visibleDailyNotes: (TFile | null)[],
    settings: DayPlannerSettings,
  ) {
    if (visibleDailyNotes.length === 0) {
      return [];
    }

    const nonNullDailyNotes = visibleDailyNotes.filter<TFile>(
      (it) => it !== null,
    );

    const allLists = dataviewFacade.getAllListsFrom(
      nonNullDailyNotes.map((it) => it.path),
    );

    if (settings.plannerHeading === "") {
      return allLists;
    }

    const pathToHeadingMetadata = Object.fromEntries(
      nonNullDailyNotes.map((file) => [
        file.path,
        metadataCache.getFileCache(file)?.headings || [],
      ]),
    );

    return allLists.reduce<SListEntry[]>(
      (result: SListEntry[], list: SListEntry) => {
        const breadcrumbs = getHeadingBreadcrumbs(
          list.position,
          pathToHeadingMetadata[list.path],
        );

        const isUnderPlannerHeading = breadcrumbs.some(
          ({ heading }) => heading === settings.plannerHeading,
        );

        if (isUnderPlannerHeading) {
          result.push(list);
        }

        return result;
      },
      [],
    );
  }

  return derived(
    [visibleDailyNotes, settings, refreshSignal],
    ([$visibleDailyNotes, $settings], set: (tasks: SListEntry[]) => void) => {
      const listsFromDailyNotesForVisibleDays =
        getListsFromDailyNotesForVisibleDays($visibleDailyNotes, $settings);

      dataviewFacade
        .getAllTasksFrom($settings.dataviewSource)
        .then((result) => {
          const uniqueTasks = dv.uniq(
            listsFromDailyNotesForVisibleDays.concat(result),
          );

          const filteredTasks = $settings.showCompletedTasks
            ? uniqueTasks
            : uniqueTasks.filter((sTask: STask) => !sTask.completed);

          set(filteredTasks);
        })
        .catch((reason) => {
          console.error("Failed to fetch tasks from dataview source: ", reason);

          set([]);
        });
    },
    [],
  );
}
