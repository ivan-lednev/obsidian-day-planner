import * as amPm from "./fixtures/am-pm";
import * as endTime from "./fixtures/end-time";
import * as listItemsAbove from "./fixtures/list-items-above";
import * as subheadings from "./fixtures/subheadings";
import * as subtasks from "./fixtures/subtasks";
import * as withoutTasks from "./fixtures/without-tasks";
import { parsePlanItems } from "./parser";

const defaultPlannerHeading = "Day planner";

it("grabs complete text", () => {
  const [first] = parsePlanItems(
    subtasks.content,
    subtasks.metadata,
    "Day planner",
    "",
    window.moment(),
  );

  expect(first).toMatchObject({
    text: expect.stringContaining("1.1"),
  });
});

it("preserves checkbox when task has no sub-items", () => {
  const [{ text }] = parsePlanItems(
    endTime.content,
    endTime.metadata,
    "Day planner",
    "",
    window.moment(),
  );

  expect(text).toMatch(/^- \[ ] /);
});

it("removes bullets from non-tasks", () => {
  const [{ text }] = parsePlanItems(
    subtasks.content,
    subtasks.metadata,
    "Day planner",
    "",
    window.moment(),
  );

  expect(text).not.toMatch(/^- /);
});

it("removes indentation for sub-items under non-tasks", () => {
  const [{ text }] = parsePlanItems(
    subtasks.content,
    subtasks.metadata,
    "Day planner",
    "",
    window.moment(),
  );

  expect(text).not.toMatch(/^\s+- /);
});

it("parses bullet lists without checkboxes", () => {
  const [first, second] = parsePlanItems(
    withoutTasks.content,
    withoutTasks.metadata,
    defaultPlannerHeading,
    "",
    window.moment(),
  );

  expect(first).toMatchObject({
    text: expect.stringContaining("1"),
  });
  expect(second).toMatchObject({
    text: expect.stringContaining("2"),
  });
});

it("parses end time", () => {
  const planItems = parsePlanItems(
    endTime.content,
    endTime.metadata,
    defaultPlannerHeading,
    "",
    window.moment(),
  );
  const first = planItems[0];

  expect(first).toMatchObject({ durationMinutes: 80 });
});

it("trims space from text when timestamps end with am/pm", () => {
  const planItems = parsePlanItems(
    amPm.content,
    amPm.metadata,
    defaultPlannerHeading,
    "",
    window.moment(),
  );
  const first = planItems[0];

  expect(first).toMatchObject({ firstLineText: "Wake up" });
});

it("handles list items above daily plan", () => {
  expect(
    parsePlanItems(
      listItemsAbove.content,
      listItemsAbove.metadata,
      defaultPlannerHeading,
      "",
      window.moment(),
    ),
  ).toMatchObject([{ text: expect.stringContaining("Wake up") }]);
});

it("handles tasks under subheadings", () => {
  expect(
    parsePlanItems(
      subheadings.content,
      subheadings.metadata,
      defaultPlannerHeading,
      "",
      window.moment(),
    ),
  ).toMatchObject([
    { text: "Wake up" },
    { text: "Grab a brush and put a little make up" },
  ]);
});
