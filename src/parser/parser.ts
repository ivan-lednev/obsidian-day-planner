import type { CachedMetadata, ListItemCache } from "obsidian";
import { parseTimestamp } from "../timestamp/timestamp";
import { timestampRegExp } from "../regexp";
import { isTopLevelListItem } from "../../obsidian-metadata-utils/src/list";
import { getTextAtPosition } from "../../obsidian-metadata-utils/src/position";
import { getMinutesSinceMidnightOfDayTo } from "../util/moment";
import { getMomentOfActiveDay } from "../store/timeline-store";
import type { PlanItem, PlanItemLocation } from "../types";
import { calculateDefaultDuration } from "./calculate-default-duration";
import type { Moment } from "moment";

export function parsePlanItems(
  content: string,
  metadata: CachedMetadata,
  planHeadingContent: string,
  path: string,
  day: Moment,
): PlanItem[] {
  const listItemsUnderPlan = getListItemsUnderHeading(
    metadata,
    planHeadingContent,
  );

  if (!listItemsUnderPlan) {
    return [];
  }

  const listItemsWithContent = getListItemContent(content, listItemsUnderPlan);

  return listItemsWithContent
    .map((li) =>
      createPlanItem({
        line: li.listItemLineContent,
        location: { path, line: li.line },
        day,
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
        startMinutes: getMinutesSinceMidnightOfDayTo(
          getMomentOfActiveDay(),
          item.startTime,
        ),
        endMinutes: getMinutesSinceMidnightOfDayTo(
          getMomentOfActiveDay(),
          endTime,
        ),
        durationMinutes,
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

// todo: this belongs to metadata-utils
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

export function getHeadingByText(metadata: CachedMetadata, text: string) {
  const { headings } = metadata;

  return headings?.find((h) => h.heading === text);
}

export function createPlanItem({
  line,
  location,
  day,
}: {
  line: string;
  location: PlanItemLocation;
  day: Moment;
}) {
  const match = timestampRegExp.exec(line.trim());
  if (!match) {
    return null;
  }

  const {
    groups: { listTokens, start, end, text },
  } = match;

  // todo: parser should not depend on UI state
  const startTime = parseTimestamp(start, day);

  return {
    listTokens,
    startTime,
    // todo: parser should not depend on UI state
    endTime: parseTimestamp(end, day),
    rawStartTime: start,
    rawEndTime: end,
    text,
    location,
    id: String(Math.random()),
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
