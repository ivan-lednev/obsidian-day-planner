import { PLAN_PARSER_REGEX_CREATOR } from './constants';
import { PlanItem, PlanItemFactory, PlanSummaryData } from './plan-data';
import type { DayPlannerSettings } from './settings';

export default class Parser {

    private planItemFactory: PlanItemFactory;
    private PLAN_PARSER_REGEX: RegExp;

    constructor(settings: DayPlannerSettings) {
        this.planItemFactory = new PlanItemFactory(settings);
        this.PLAN_PARSER_REGEX = PLAN_PARSER_REGEX_CREATOR(settings.breakLabel, settings.endLabel);
    }

    async parseMarkdown(fileContent: string[]): Promise<PlanSummaryData> {
        const parsed = this.parse(fileContent);
        const transformed = this.transform(parsed);
        return new PlanSummaryData(transformed);
    }

    private parse(input: string[]): {index: number, value: RegExpExecArray}[] {
        try {
            const matches: {index: number, value: RegExpExecArray}[] = [];
            let match;
            input.forEach((line, i) => {
                while(match = this.PLAN_PARSER_REGEX.exec(line)){
                    matches.push({index:i, value: match});
                }
            });
            return matches;
        } catch (error) {
            console.log(error)
        }
    }

    private transform(regexMatches: {index: number, value: RegExpExecArray}[]): PlanItem[]{
        const results = regexMatches.map((match) => {
            try {
                const value = match.value;
                const isCompleted = this.matchValue(value.groups.completion, 'x');
                const isBreak = value.groups.break !== undefined;
                const isEnd = value.groups.end !== undefined;
                const time = new Date();
                time.setHours(parseInt(value.groups.hours))
                time.setMinutes(parseInt(value.groups.minutes))
                time.setSeconds(0);
                return this.planItemFactory.getPlanItem(
                    match.index, 
                    value.index, 
                    isCompleted, 
                    isBreak,
                    isEnd,
                    time, 
                    `${value.groups.hours.padStart(2, '0')}:${value.groups.minutes}`,
                    value.groups.text?.trim(),
                    value[0]
                );
            } catch (error) {
                console.log(error);
            }
        });
        return results;
    }

    private matchValue(input: any, match: string): boolean {
        return input?.trim().toLocaleLowerCase() === match;
    }

}
