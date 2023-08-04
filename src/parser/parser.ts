import type { CachedMetadata, ListItemCache } from "obsidian";
import { parseTimestamp } from "../util/timestamp";
import type { PlanItem } from "../plan/plan-item";
import { timestampRegExp } from "../regexp";
import { isTopLevelListItem } from "../../obsidian-metadata-utils/src/list";
import { getTextAtPosition } from "../../obsidian-metadata-utils/src/position";

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
  const planHeading = headings[planHeadingIndex];
  const nextHeading = headings[planHeadingIndex + 1];

  const listItemsUnderPlan = metadata.listItems.filter((li) => {
    const isBelowPlan =
      li.position.start.line > planHeading.position.start.line;

    if (isBelowPlan && !nextHeading) {
      return true;
    }

    return li.position.start.line < nextHeading.position.start.line;
  });

  const listItemsWithContent = getListItemContent(content, listItemsUnderPlan);

  return listItemsWithContent.reduce((result, li) => {
    const planItem = createPlanItemFrom(li.listItemLineContent);
    if (planItem) {
      result.push(planItem);
    }

    return result;
  }, []);
}

function createPlanItemFrom(line: string): PlanItem {
  const match = timestampRegExp.exec(line);
  if (!match) {
    return null;
  }

  const {
    groups: { completion, start, end, text },
  } = match;

  return {
    matchIndex: -1,
    isCompleted: completion?.trim().toLocaleLowerCase() === "x",
    startTime: parseTimestamp(start),
    endTime: parseTimestamp(end),
    rawStartTime: start,
    rawEndTime: end,
    text,
  };
}

function groupTopListItemsWithDescendants(listItems: ListItemCache[]) {
  return listItems.reduce((result, current, i) => {
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
