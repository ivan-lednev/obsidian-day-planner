import { parsePlanItems } from "./parser";
import * as basic from "./fixtures/basic";
import * as subtasks from "./fixtures/subtasks";
import * as withoutTasks from "./fixtures/without-tasks";
import * as endTime from "./fixtures/end-time";
import * as listItemsAbove from "./fixtures/list-items-above";
import * as subheadings from "./fixtures/subheadings";

const defaultPlannerHeading = "Day planner";

// todo: replace with toMatchObject
it.skip("parses tasks with timestamps from lines", () => {
  expect(
    parsePlanItems(
      basic.content,
      basic.metadata,
      defaultPlannerHeading,
      "",
      window.moment(),
    ),
  ).toMatchSnapshot();
});

// todo: replace with toMatchObject
it.skip("grabs subtasks", () => {
  expect(
    parsePlanItems(
      subtasks.content,
      subtasks.metadata,
      "Day planner",
      "",
      window.moment(),
    ),
  ).toMatchSnapshot();
});

// todo: replace with toMatchObject
it.skip("parses bullet lists without checkboxes", () => {
  expect(
    parsePlanItems(
      withoutTasks.content,
      withoutTasks.metadata,
      defaultPlannerHeading,
      "",
      window.moment(),
    ),
  ).toMatchSnapshot();
});

// todo: replace with toMatchObject
it.skip("parses end time", () => {
  expect(
    parsePlanItems(
      endTime.content,
      endTime.metadata,
      defaultPlannerHeading,
      "",
      window.moment(),
    ),
  ).toMatchSnapshot();
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
  ).toMatchObject([{ text: "Wake up" }]);
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
