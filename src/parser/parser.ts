import type { CachedMetadata, ListItemCache } from "obsidian";
import { parseTimestamp } from "../util/timestamp";
import { timestampRegExp } from "../regexp";
import { isTopLevelListItem } from "../../obsidian-metadata-utils/src/list";
import { getTextAtPosition } from "../../obsidian-metadata-utils/src/position";
import { getDiffInMinutes, getMinutesSinceMidnightTo } from "../util/moment";
import { DEFAULT_DURATION_MINUTES } from "../constants";

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
) {
  const { headings } = metadata;

  if (!headings) {
    return [];
  }

  const planHeadingIndex = headings.findIndex(
    (h) => h.heading === planHeadingContent,
  );

  if (planHeadingIndex < 0) {
    return [];
  }

  const planHeading = headings[planHeadingIndex];
  const nextHeading = headings[planHeadingIndex + 1];

  const listItemsUnderPlan = metadata.listItems?.filter((li) => {
    const isBelowPlan =
      li.position.start.line > planHeading.position.start.line;

    if (isBelowPlan && !nextHeading) {
      return true;
    }

    return li.position.start.line < nextHeading.position.start.line;
  });

  const listItemsWithContent = getListItemContent(content, listItemsUnderPlan);

  return listItemsWithContent
    .map((li) => createPlanItem(li.listItemLineContent))
    .filter((item) => item !== null)
    .map((item, index, items) => {
      const next = items[index + 1];

      return {
        ...item,
        startMinutes: getMinutesSinceMidnightTo(item.startTime),
        endMinutes: item.endTime
          ? getMinutesSinceMidnightTo(item.endTime)
          : undefined,
        durationMinutes: calculateDefaultDuration(item, next),
      };
    });
}

function createPlanItem(line: string) {
  const match = timestampRegExp.exec(line);
  if (!match) {
    return null;
  }

  const {
    groups: { start, end, text },
  } = match;

  return {
    matchIndex: -1,
    startTime: parseTimestamp(start),
    endTime: parseTimestamp(end),
    rawStartTime: start,
    rawEndTime: end,
    text,
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
        listItemLineContent: getTextAtPosition(content, root.position),
        listItemCompleteContent: getTextAtPosition(
          content,
          betweenRootAndLastDescendant,
        ),
      };
    },
  );
}
