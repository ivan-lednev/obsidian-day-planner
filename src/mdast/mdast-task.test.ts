import { fromMarkdown } from "mdast-util-from-markdown";

import { findNodeAtPoint, toMarkdown } from "./mdast";
import {
  attachTaskStartEndTimes,
  compareTaskStartEndTime,
  getFirstText,
  getTaskStartEndTime,
  orderListByTime,
  orderListItemByTime,
  TaskStartEndTime,
} from "./mdast-task";

describe(`${getTaskStartEndTime.name}`, () => {
  test("parse start and end times of list items", () => {
    const input = `## Day planner

- [ ] 10:00 - 11:00 Wake up

  I should wake up earlier but w/e.

- 11:00 - 12:00 Eat breakfast
- [ ] 12:00 - 13:00 Study
- 13:00 Item without end time

Some more content over here.

## Another heading

With more information.`;

    const parsed = fromMarkdown(input);
    const list = findNodeAtPoint({
      tree: parsed,
      point: {
        line: 3,
        column: 1,
      },
      searchedNodeType: "list",
    });

    expect(list).toBeDefined();

    expect(
      list.children.map((listItem) => getTaskStartEndTime(listItem)),
    ).toEqual([
      {
        startTime: window.moment.duration("10:00"),
        endTime: window.moment.duration("11:00"),
      },
      {
        startTime: window.moment.duration("11:00"),
        endTime: window.moment.duration("12:00"),
      },
      {
        startTime: window.moment.duration("12:00"),
        endTime: window.moment.duration("13:00"),
      },
      { startTime: window.moment.duration("13:00"), endTime: null },
    ] satisfies ReturnType<typeof getTaskStartEndTime>[]);
  });
});

describe(`${orderListItemByTime.name}`, () => {
  test("moves the task to the correct location", () => {
    const input = `- 10:00 - 11:00 Wake up
- Item without time
- 11:00 - 12:00 Eat breakfast

  I should not eat as long.

- 10:30 - 11:00 Misplaced item

  With more content inside.

- 14:00 Some final item`;

    const expectedOutput = `- 10:00 - 11:00 Wake up

- Item without time

- 10:30 - 11:00 Misplaced item

    With more content inside.

- 11:00 - 12:00 Eat breakfast

    I should not eat as long.

- 14:00 Some final item`;

    const root = fromMarkdown(input);
    expect(root).toBeDefined();

    const list = findNodeAtPoint({
      tree: root,
      searchedNodeType: "list",
      point: { line: 1, column: 1 },
    });
    expect(list).toBeDefined();

    const misplacedListItem = findNodeAtPoint({
      tree: list,
      searchedNodeType: "listItem",
      point: { line: 7, column: 1 },
    });
    expect(misplacedListItem).toBeDefined();
    expect(getFirstText(misplacedListItem)).toBe(
      "10:30 - 11:00 Misplaced item",
    );

    attachTaskStartEndTimes(list);

    orderListItemByTime({
      list,
      listItem: misplacedListItem,
    });

    expect(toMarkdown(root).trim()).toBe(expectedOutput.trim());
  });
});

describe(`${orderListByTime.name}`, () => {
  test("orders the list by time", () => {
    const input = `- 10:00 - 11:00 Wake up
- Item without time
- 11:00 - 12:00 Eat breakfast

  I should not eat as long.

- 9:00 Sleep

- 10:30 - 11:00 Misplaced item

  With more content inside.

- 14:00 Some final item`;

    const expectedOutput = `- 9:00 Sleep

- 10:00 - 11:00 Wake up

- Item without time

- 10:30 - 11:00 Misplaced item

    With more content inside.

- 11:00 - 12:00 Eat breakfast

    I should not eat as long.

- 14:00 Some final item`;

    const root = fromMarkdown(input);
    expect(root).toBeDefined();

    const list = findNodeAtPoint({
      tree: root,
      searchedNodeType: "list",
      point: { line: 1, column: 1 },
    });
    expect(list).toBeDefined();

    attachTaskStartEndTimes(list);
    orderListByTime(list);
    expect(toMarkdown(root).trim()).toBe(expectedOutput.trim());
  });
});

describe(`${compareTaskStartEndTime.name}`, () => {
  test("can be used to in Array.prototype.sort", () => {
    const input: TaskStartEndTime[] = [
      { startTime: window.moment.duration("10:00"), endTime: null },
      { startTime: window.moment.duration("5:15"), endTime: null },
      {
        startTime: window.moment.duration("5:00"),
        endTime: window.moment.duration("5:30"),
      },
      {
        startTime: window.moment.duration("5:00"),
        endTime: window.moment.duration("5:10"),
      },
      { startTime: window.moment.duration("5:00"), endTime: null },
      { startTime: window.moment.duration("20:00"), endTime: null },
      { startTime: window.moment.duration("18:00"), endTime: null },
      { startTime: window.moment.duration("21:00"), endTime: null },
    ];

    const expectedOutput: TaskStartEndTime[] = [
      { startTime: window.moment.duration("5:00"), endTime: null },
      {
        startTime: window.moment.duration("5:00"),
        endTime: window.moment.duration("5:10"),
      },
      {
        startTime: window.moment.duration("5:00"),
        endTime: window.moment.duration("5:30"),
      },
      { startTime: window.moment.duration("5:15"), endTime: null },
      { startTime: window.moment.duration("10:00"), endTime: null },
      { startTime: window.moment.duration("18:00"), endTime: null },
      { startTime: window.moment.duration("20:00"), endTime: null },
      { startTime: window.moment.duration("21:00"), endTime: null },
    ];

    const output = input.slice().sort(compareTaskStartEndTime);
    expect(output).toEqual(expectedOutput);
  });
});
