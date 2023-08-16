import type { CachedMetadata, ListItemCache } from "obsidian";
import { parseTimestamp } from "../util/timestamp";
import { timestampRegExp } from "../regexp";
import { isTopLevelListItem } from "../../obsidian-metadata-utils/src/list";
import { getTextAtPosition } from "../../obsidian-metadata-utils/src/position";
import {
  getDiffInMinutes,
  getMinutesSinceMidnightTo,
  minutesToMoment,
} from "../util/moment";
import { DEFAULT_DURATION_MINUTES } from "../constants";
import type { PlanItem, PlanItemLocation } from "src/plan-item";
import {
  appStore,
  getTimeFromYOffset,
  roundToSnapStep,
} from "src/store/timeline-store";
import { get } from "svelte/store";
import { getDailyNoteForToday } from "src/util/daily-notes";

// todo: out of place
export function calculateDefaultDuration(
  item: ReturnType<typeof createPlanItem>,
  next?: ReturnType<typeof createPlanItem>,
) {
  if (item.endTime) {
    return getDiffInMinutes(item.startTime, item.endTime);
  }

  if (next) {
    const minutesUntilNext = getDiffInMinutes(next.startTime, item.startTime);

    if (minutesUntilNext < DEFAULT_DURATION_MINUTES) {
      return minutesUntilNext;
    }
  }

  return DEFAULT_DURATION_MINUTES;
}

export function parsePlanItems(
  content: string,
  metadata: CachedMetadata,
  planHeadingContent: string,
  path: string,
): PlanItem[] {
  const listItemsUnderPlan = getListItemsUnderHeading(
    metadata,
    planHeadingContent,
  );

  const listItemsWithContent = getListItemContent(content, listItemsUnderPlan);

  return listItemsWithContent
    .map((li) =>
      createPlanItem({
        line: li.listItemLineContent,
        location: { path, line: li.line },
      }),
    )
    .filter((item) => item !== null)
    .map((item, index, items) => {
      const next = items[index + 1];

      const durationMinutes = calculateDefaultDuration(item, next);

      const endTime =
        item.endTime || item.startTime.clone().add(durationMinutes, "minutes");

      return {
        ...item,
        endTime,
        startMinutes: getMinutesSinceMidnightTo(item.startTime),
        endMinutes: getMinutesSinceMidnightTo(endTime),
        durationMinutes,
      };
    });
}

export function getListItemsUnderHeading(
  metadata: CachedMetadata,
  heading: string,
) {
  const { headings } = metadata;

  if (!headings) {
    return [];
  }

  const planHeadingIndex = headings.findIndex((h) => h.heading === heading);

  if (planHeadingIndex < 0) {
    return [];
  }

  const planHeading = headings[planHeadingIndex];
  const nextHeadingOfSameLevel = headings
    .slice(planHeadingIndex + 1)
    .find((heading) => heading.level <= planHeading.level);

  return metadata.listItems?.filter((li) => {
    const isBelowPlan =
      li.position.start.line > planHeading.position.start.line;
    const isAboveNextHeadingIfItExists =
      !nextHeadingOfSameLevel ||
      li.position.start.line < nextHeadingOfSameLevel.position.start.line;

    return isBelowPlan && isAboveNextHeadingIfItExists;
  });
}

function createPlanItem({
  line,
  location,
}: {
  line: string;
  location: PlanItemLocation;
}) {
  const match = timestampRegExp.exec(line.trim());
  if (!match) {
    return null;
  }

  const {
    groups: { listTokens, start, end, text },
  } = match;

  return {
    listTokens,
    startTime: parseTimestamp(start),
    endTime: parseTimestamp(end),
    rawStartTime: start,
    rawEndTime: end,
    text,
    location,
  };
}

function groupTopListItemsWithDescendants(listItems: ListItemCache[]) {
  return listItems.reduce((result, current) => {
    if (isTopLevelListItem(current)) {
      result.push({ root: current, descendants: [] });
    } else {
      const previousTopListItem = result[result.length - 1];
      previousTopListItem.descendants.push(current);
    }

    return result;
  }, []);
}

function getListItemContent(content: string, listItems: ListItemCache[]) {
  return groupTopListItemsWithDescendants(listItems).map(
    ({ root, descendants }) => {
      const lastDescendantPosition =
        descendants?.[descendants.length - 1]?.position?.end;
      const betweenRootAndLastDescendant = {
        start: root.position.start,
        end: lastDescendantPosition || root.position.end,
      };

      return {
        line: root.position.start.line,
        listItemLineContent: getTextAtPosition(content, root.position),
        listItemCompleteContent: getTextAtPosition(
          content,
          betweenRootAndLastDescendant,
        ),
      };
    },
  );
}

// todo: move
export function createPlanItemFromTimeline(pointerYOffset: number) {
  const startMinutes = getTimeFromYOffset(roundToSnapStep(pointerYOffset));
  const endMinutes = startMinutes + DEFAULT_DURATION_MINUTES;

  return {
    startMinutes,
    durationMinutes: DEFAULT_DURATION_MINUTES,
    endMinutes,
    text: "New item",
    startTime: minutesToMoment(startMinutes),
    endTime: minutesToMoment(endMinutes),
    // todo: no hardcode
    listTokens: "- ",
    location: {
      path: getDailyNoteForToday().path,
    },
  };
}
