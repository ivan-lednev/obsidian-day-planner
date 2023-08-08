import { parsePlanItems } from "./parser";
import * as basic from "./fixtures/basic";
import * as subtasks from "./fixtures/subtasks";
import * as withoutTasks from "./fixtures/without-tasks";
import * as endTime from "./fixtures/end-time";
import * as listItemsAbove from "./fixtures/list-items-above";

const defaultPlannerHeading = "Day planner";

it("parses tasks with timestamps from lines", () => {
  expect(
    parsePlanItems(basic.content, basic.metadata, defaultPlannerHeading),
  ).toMatchSnapshot();
});

it("grabs subtasks", () => {
  expect(
    parsePlanItems(subtasks.content, subtasks.metadata, "Day planner"),
  ).toMatchSnapshot();
});

it("parses bullet lists without checkboxes", () => {
  expect(
    parsePlanItems(
      withoutTasks.content,
      withoutTasks.metadata,
      defaultPlannerHeading,
    ),
  ).toMatchSnapshot();
});

it("parses end time", () => {
  expect(
    parsePlanItems(endTime.content, endTime.metadata, defaultPlannerHeading),
  ).toMatchSnapshot();
});

it("handles list items above daily plan", () => {
  expect(
    parsePlanItems(
      listItemsAbove.content,
      listItemsAbove.metadata,
      defaultPlannerHeading,
    ),
  ).toMatchObject([{ text: "Wake up" }]);
});
