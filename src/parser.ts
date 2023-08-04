import { PLAN_REGEXP } from "./constants";
import { PlanSummaryData } from "./plan/plan-summary-data";
import { timestampRegExp } from "./regexp";
import { parseTimestamp } from "./util/timestamp";

export default class Parser {
  async parseMarkdown(fileContent: string[]): Promise<PlanSummaryData> {
    return new PlanSummaryData(this.parse(fileContent));
  }

  private parse(input: string[]) {
    return input
      .map((line, index) => ({
        matchArray: timestampRegExp.exec(line),
        index,
      }))
      .filter(({ matchArray }) => matchArray !== null)
      .map(
        ({
          matchArray: {
            groups: { completion, start, end, text },
          },
          index,
        }) => {
          const isCompleted = completion?.trim().toLocaleLowerCase() === "x";

          const startTime = parseTimestamp(start);
          const endTime = parseTimestamp(end);

          return {
            matchIndex: index,
            isCompleted,
            isBreak: false,
            isEnd: false,
            startTime,
            endTime,
            rawStartTime: start,
            rawEndTime: end,
            text,
          };
        },
      );
  }
}
