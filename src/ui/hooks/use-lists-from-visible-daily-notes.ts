import { MetadataCache, TFile, type HeadingCache, type Pos } from "obsidian";
import { derived, type Readable } from "svelte/store";

import { DataviewFacade } from "../../service/dataview-facade";
import type { DayPlannerSettings } from "../../settings";
import * as query from "../../util/dataview-query";

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

export function useListsFromVisibleDailyNotes(props: {
  visibleDailyNotes: Readable<TFile[]>;
  debouncedTaskUpdateTrigger: Readable<unknown>;
  dataviewFacade: DataviewFacade;
  metadataCache: MetadataCache;
  settings: Readable<DayPlannerSettings>;
}) {
  const {
    visibleDailyNotes,
    debouncedTaskUpdateTrigger,
    dataviewFacade,
    metadataCache,
    settings,
  } = props;

  return derived(
    [visibleDailyNotes, settings, debouncedTaskUpdateTrigger],
    ([$visibleDailyNotes, $settings]) => {
      if ($visibleDailyNotes.length === 0) {
        return [];
      }

      const allLists = dataviewFacade.getAllListsFrom(
        query.anyOf($visibleDailyNotes),
      );

      if ($settings.plannerHeading === "") {
        return allLists;
      }

      const pathToHeadingMetadata = Object.fromEntries(
        $visibleDailyNotes.map((file) => [
          file.path,
          metadataCache.getFileCache(file)?.headings || [],
        ]),
      );

      return allLists.reduce((result, list) => {
        const breadcrumbs = getHeadingBreadcrumbs(
          list.position,
          pathToHeadingMetadata[list.path],
        );

        const isUnderPlannerHeading = breadcrumbs.some(
          ({ heading }) => heading === $settings.plannerHeading,
        );

        if (isUnderPlannerHeading) {
          result.push(list);
        }

        return result;
      }, []);
    },
  );
}
