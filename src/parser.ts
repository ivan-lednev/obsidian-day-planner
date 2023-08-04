import { PLAN_PARSER_REGEX_CREATOR } from "./constants";
import { PlanSummaryData } from "./plan/plan-summary-data";
import type { DayPlannerSettings } from "./settings";
import { PlanItemFactory } from "./plan/plan-item-factory";

export default class Parser {
  private planItemFactory: PlanItemFactory;
  private PLAN_PARSER_REGEX: RegExp;

  constructor(settings: DayPlannerSettings) {
    this.planItemFactory = new PlanItemFactory(settings);
    this.PLAN_PARSER_REGEX = PLAN_PARSER_REGEX_CREATOR(
      settings.breakLabel,
      settings.endLabel,
    );
  }

  async parseMarkdown(fileContent: string[]): Promise<PlanSummaryData> {
    return new PlanSummaryData(this.parse(fileContent));
  }

  private parse(input: string[]) {
    return input
      .map((line, index) => ({
        matchArray: this.PLAN_PARSER_REGEX.exec(line),
        index,
      }))
      .filter(({ matchArray }) => matchArray !== null)
      .map(
        ({
          matchArray: {
            groups: { completion, hours, minutes, endHours, endMinutes, text },
          },
          index,
        }) => {
          const isCompleted = completion?.trim().toLocaleLowerCase() === "x";

          const startTime = new Date();
          const startTimeRaw = `${hours.padStart(2, "0")}:${minutes}`;
          startTime.setHours(parseInt(hours));
          startTime.setMinutes(parseInt(minutes));
          startTime.setSeconds(0);

          let endTime;
          let endTimeRaw = "";

          if (endHours && endMinutes) {
            endTime = new Date();
            endTime.setHours(parseInt(endHours));
            endTime.setMinutes(parseInt(endMinutes));
            endTime.setSeconds(0);

            endTimeRaw = `${endHours.padStart(2, "0")}:${endMinutes}`;
          }

          return this.planItemFactory.getPlanItem(
            index,
            isCompleted,
            false,
            false,
            startTime,
            endTime,
            startTimeRaw,
            endTimeRaw,
            text?.trim(),
          );
        },
      );
  }
}
