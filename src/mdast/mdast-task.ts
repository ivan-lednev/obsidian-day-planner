import type { ListItem, List, RootContent } from "mdast";
import { Duration } from "moment";

import { parseTimestamp } from "../parser/timestamp/timestamp";
import { timestampRegExp } from "../regexp";

export interface TaskStartEndTime {
  startTime: Duration;
  endTime: Duration | null;
}

declare module "mdast" {
  export interface ListItemData {
    taskStartEndTime?: TaskStartEndTime;
  }
}

export function getTaskStartEndTime(
  listItem: ListItem,
): TaskStartEndTime | null {
  const firstLine = getFirstText(listItem.children[0]);
  if (!firstLine) {
    return null;
  }

  // NOTE: mdast list text does not include list tokens.
  // timestampRegExp expects a list token at the beginning of the line.
  // We need to manually add it so the regexp matches.
  const firstLineWithListToken = `- ${firstLine.trim()}`;
  const match = timestampRegExp.exec(firstLineWithListToken);

  if (!match) {
    return null;
  }

  const {
    groups: { start: startTime, end: endTime },
  } = match;

  // NOTE: `parseTimestamp` requires a Moment.
  // Since we are dealing with a list within the same day, we use today as the
  // day. It does not matter, all the list items will have the same day.
  const currentDay = window.moment().startOf("day");

  return {
    startTime: window.moment.duration(
      parseTimestamp(startTime, currentDay).diff(currentDay),
    ),
    endTime: endTime
      ? window.moment.duration(
          parseTimestamp(endTime, currentDay).diff(currentDay),
        )
      : null,
  };
}

/**
 * @returns the first text node in the {@link node}
 *
 * Does not support all node types.
 */
export function getFirstText(node: RootContent): string | null {
  if ("children" in node) {
    if (node.children.length === 0) {
      return null;
    }

    return getFirstText(node.children[0]);
  }

  switch (node.type) {
    case "text":
      return node.value;

    default:
      // NOTE: parsing text out of other node types is not supported yet
      return null;
  }
}

/**
 * Parses the start and end times of tasks in the list
 * and attaches them in the {@link ListItem.data} object.
 */
export function attachTaskStartEndTimes(list: List): void {
  for (const listItem of list.children) {
    const taskStartEndTime = getTaskStartEndTime(listItem);

    if (taskStartEndTime) {
      listItem.data = {
        ...listItem.data,
        taskStartEndTime,
      };
    }
  }
}

/**
 * Moves the {@link listItem} to a new location in the {@link list} based on
 * the {@link TaskStartEndTime}.
 *
 * This operation mutates the {@link list}.
 *
 * Expects the {@link listItem} to be a part of the {@link list}.
 *
 * Expects that the list items already have the {@link TaskStartEndTime} field
 * attached. This could be done by calling {@link attachTaskStartEndTimes}.
 *
 * Expects that all the other list items in the list are already ordered by
 * time. If they are not, then calling this function on all the list items in
 * order will order the list, since this is a single step of insertion sort.
 *
 * The task order is defined by {@link compareTaskStartEndTime}.
 */
export function reorderListItemByTime({
  list,
  listItem,

  onlyConsiderItemsBeforeCurrentListItem = false,
}: {
  list: List;
  listItem: ListItem;

  /**
   * If true, the {@link listItem} could be moved only to appear earlier in the list
   * (its index can only get smaller).
   *
   * This is useful when {@link reorderListItemByTime} is called on all the list
   * as a step of the insertion sort algorithm. It makes the algorithm output
   * more stable when some items do not have a time set.
   */
  onlyConsiderItemsBeforeCurrentListItem?: boolean;
}): void {
  const taskStartEndTime = listItem.data?.taskStartEndTime;
  if (!taskStartEndTime) {
    return;
  }

  const listItemIndex = list.children.indexOf(listItem);
  if (listItemIndex === -1) {
    throw new Error("listItem is not part of the list");
  }

  let beforeIndex: number | undefined = undefined;

  for (let index = 0; index < list.children.length; index++) {
    const otherListItem = list.children[index];
    if (otherListItem === listItem) {
      if (onlyConsiderItemsBeforeCurrentListItem) {
        // `beforeIndex` was not set yet, and we encountered the current list
        // item, so all tasks including the current one are already ordered.
        return;
      } else {
        continue;
      }
    }

    const otherTaskStartEndTime = otherListItem.data?.taskStartEndTime;
    if (!otherTaskStartEndTime) {
      continue;
    }

    const order = compareTaskStartEndTime(
      otherTaskStartEndTime,
      taskStartEndTime,
    );
    if (order > 0) {
      beforeIndex = index;
      break;
    }
  }

  if (beforeIndex === undefined) {
    // The task should appear at the end of the list

    if (listItemIndex === list.children.length - 1) {
      // The task is already at the end of the list
      return;
    }

    list.children.splice(listItemIndex, 1);
    list.children.push(listItem);
  } else {
    // The task should appear before `beforeIndex`
    if (listItemIndex === beforeIndex - 1) {
      // The task is already at the correct position
      return;
    }

    list.children.splice(listItemIndex, 1);
    list.children.splice(beforeIndex, 0, listItem);
  }
}

/**
 * Orders the list by the time of tasks.
 *
 * Mutates the {@link list}.
 *
 * List items without times are not moved.
 *
 * Does not require that {@link attachTaskStartEndTimes} had already been
 * called before calling this function.
 */
export function reorderListByTime(list: List): void {
  attachTaskStartEndTimes(list);

  // Manual insertion sort
  for (let index = 0; index < list.children.length; index++) {
    const listItem = list.children[index];
    reorderListItemByTime({
      list,
      listItem,
      onlyConsiderItemsBeforeCurrentListItem: true,
    });
  }
}

/**
 * Compares two {@link TaskStartEndTime}s.
 *
 * The tasks are ordered by their start time.
 *
 * If start times are equal, then the tasks are ordered by their end time (if exists).
 * Tasks without an end time will appear in front of tasks with the end time,
 * if both have the same start time.
 *
 * @returns a number with the same semantics as Array.prototype.sort's `compareFn`
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#comparefn
 */
export function compareTaskStartEndTime(
  a: TaskStartEndTime,
  b: TaskStartEndTime,
): number {
  const aStartTimeMs = a.startTime.asMilliseconds();
  const bStartTimeMs = b.startTime.asMilliseconds();

  const startTimeOrder = aStartTimeMs - bStartTimeMs;
  if (startTimeOrder === 0) {
    if (a.endTime && b.endTime) {
      return a.endTime.asMilliseconds() - b.endTime.asMilliseconds();
    }

    if (a.endTime) {
      return 1;
    }

    if (b.endTime) {
      return -1;
    }
  }

  return startTimeOrder;
}
