import moment from "moment";
import { App } from "obsidian";

import { defaultSettingsForTests } from "../settings";
import { PlanItem } from "../types";

import { ObsidianFacade } from "./obsidian-facade";
import { PlanEditor } from "./plan-editor";

jest.mock("obsidian");

const appMock = <jest.Mock<App>>App;

describe("PlanEditor", () => {
  describe("autoCompletePastTasks", () => {
    let obsidianFacadeMock;
    let planEditor: PlanEditor;

    beforeEach(() => {
      obsidianFacadeMock = new ObsidianFacade(
        appMock,
        () => defaultSettingsForTests,
      );

      jest.spyOn(obsidianFacadeMock, "editFile").mockImplementation(() => {});

      planEditor = new PlanEditor(
        () => defaultSettingsForTests,
        obsidianFacadeMock,
      );
    });

    it("should complete past tasks given past tasks exist", () => {
      const pastTasks = [fakePastPlanItem];

      planEditor.autoCompleteTasks(pastTasks);

      expect(obsidianFacadeMock.editFile).toHaveBeenCalled();
    });

    it("should NOT complete any tasks given first task is current task", () => {
      const pastTasks = [{ ...fakePastPlanItem, startTime: moment() }];

      planEditor.autoCompleteTasks(pastTasks);

      expect(obsidianFacadeMock.editFile).not.toHaveBeenCalled();
    });

    it("should NOT complete any tasks given only future tasks exist", () => {
      const pastTasks = [
        { ...fakePastPlanItem, startTime: moment().add(30, "m") },
      ];

      planEditor.autoCompleteTasks(pastTasks);

      expect(obsidianFacadeMock.editFile).not.toHaveBeenCalled();
    });

    it("should NOT complete items given past item is not task list", () => {
      const pastTasks = [{ ...fakePastPlanItem, listToken: "- " }];

      planEditor.autoCompleteTasks(pastTasks);

      expect(obsidianFacadeMock.editFile).not.toHaveBeenCalled();
    });
  });

  const fakePastPlanItem: PlanItem = {
    startTime: moment().subtract(45, "m"),
    rawStartTime: "",
    rawEndTime: "",
    listTokens: "- [ ] ",
    firstLineText: "",
    text: "",
    durationMinutes: 30,
    startMinutes: 30,
    location: { path: "/tmp", line: 0 },
    id: "",
  };
});
