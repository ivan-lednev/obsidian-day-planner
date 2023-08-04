import { parsePlanItems } from "./parser";
import * as basic from "./fixtures/basic";
import * as subtasks from "./fixtures/subtasks";
import * as withoutTasks from "./fixtures/without-tasks";
import * as endTime from "./fixtures/end-time";

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
