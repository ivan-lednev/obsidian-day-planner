import moment, { Moment } from "moment";
import { App } from "obsidian";

import { defaultSettingsForTests } from "../settings";

import { ObsidianFacade } from "./obsidian-facade";
import { PlanEditor } from "./plan-editor";

jest.mock("obsidian");

const appMock = <jest.Mock<App>>App;

describe("PlanEditor", () => {
  describe("autoCompletePastTasks", () => {
    let obsidianFacadeMock: ObsidianFacade;
    let planEditor: PlanEditor;

    const pastItem = getFakePlanItem("1", 1, moment().subtract(30, "m"));
    const currentItem = getFakePlanItem("2", 2, moment().subtract(15, "m"));
    const futureItem = getFakePlanItem("3", 3, moment().add(30, "m"));

    beforeEach(() => {
      obsidianFacadeMock = new ObsidianFacade(appMock);

      jest
        .spyOn(obsidianFacadeMock, "editFile")
        .mockImplementation((path, cb) => Promise.resolve());

      planEditor = new PlanEditor(
        () => defaultSettingsForTests,
        obsidianFacadeMock,
      );
    });

    describe("auto-complete", () => {
      it("should complete past tasks given past tasks exist", () => {
        const pastItems = [pastItem];

        planEditor.autoCompleteTasks(pastItems);

        expect(obsidianFacadeMock.editFile).toHaveBeenCalled();
      });

      it("should NOT complete any tasks given first task is current task", () => {
        const planItems = [currentItem];

        planEditor.autoCompleteTasks(planItems);

        expect(obsidianFacadeMock.editFile).not.toHaveBeenCalled();
      });

      it("should NOT complete any tasks given only future tasks exist", () => {
        const planItems = [futureItem];

        planEditor.autoCompleteTasks(planItems);

        expect(obsidianFacadeMock.editFile).not.toHaveBeenCalled();
      });

      it("should NOT complete items given past item is not task list", () => {
        const planItems = [{ ...pastItem, listToken: "- " }];

        planEditor.autoCompleteTasks(planItems);

        expect(obsidianFacadeMock.editFile).not.toHaveBeenCalled();
      });
    });

    describe("auto-incomplete", () => {
      it("should incomplete future tasks given autoIncomplete is true", () => {
        const planItems = [{ ...futureItem, listTokens: "- [x] " }];

        planEditor.autoCompleteTasks(planItems, true);

        expect(obsidianFacadeMock.editFile).toHaveBeenCalled();
      });

      it("should NOT incomplete future tasks given autoIncomplete is false", () => {
        const planItems = [{ ...futureItem, listTokens: "- [x] " }];

        planEditor.autoCompleteTasks(planItems);

        expect(obsidianFacadeMock.editFile).not.toHaveBeenCalled();
      });

      it("should NOT incomplete future tasks given task is incomplete", () => {
        const planItems = [futureItem];

        planEditor.autoCompleteTasks(planItems, true);

        expect(obsidianFacadeMock.editFile).not.toHaveBeenCalled();
      });
    });

    it("should NOT complete any tasks given only future tasks exist", () => {
      const pastItems = [{ ...pastItem, startTime: moment().add(30, "m") }];

      planEditor.autoCompleteTasks(pastItems);

      expect(obsidianFacadeMock.editFile).not.toHaveBeenCalled();
    });

    it("should NOT complete items given past item is not task list", () => {
      const pastItems = [{ ...pastItem, listToken: "- " }];

      planEditor.autoCompleteTasks(pastItems);

      expect(obsidianFacadeMock.editFile).not.toHaveBeenCalled();
    });

    function getFakePlanItem(id: string, line: number, startTime: Moment) {
      return {
        startTime: startTime,
        rawStartTime: "",
        rawEndTime: "",
        listTokens: "- [ ] ",
        firstLineText: "",
        text: "",
        durationMinutes: 30,
        startMinutes: 30,
        location: {
          path: "/tmp",
          line: line,
          position: {
            start: { line: line, col: 0, offset: 0 },
            end: { line: line, col: 0, offset: 0 },
          },
        },
        id: id,
      };
    }
  });
});
