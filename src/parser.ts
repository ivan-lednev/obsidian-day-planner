import { Vault } from 'obsidian';
import { PLAN_PARSER_REGEX } from './constants';
import { PlanItem, PlanSummaryData } from './plan-data';

export default class Parser {
    vault: Vault;

    constructor(vault: Vault) {
        this.vault = vault;
    }

    async parseMarkdown(fileContent: string): Promise<PlanSummaryData> {
        const parsed = this.parse(fileContent);
        const transformed = this.transform(parsed);
        return new PlanSummaryData(transformed);
    }

    private parse(input: string): RegExpExecArray[] {
        const matches = [];
        let match;
        while(match = PLAN_PARSER_REGEX.exec(input)){
          matches.push(match)
        }
        return matches;
    }

    private transform(regexMatches: RegExpExecArray[]): PlanItem[]{
        const results = regexMatches.map((value:RegExpExecArray, index) => {
            try {
                const isCompleted = this.matchValue(value.groups.completion, 'x');
                const isBreak = this.matchValue(value.groups.break, 'break');
                const isEnd = this.matchValue(value.groups.end, 'end');
                const time = new Date();
                time.setHours(parseInt(value.groups.hours))
                time.setMinutes(parseInt(value.groups.minutes))
                time.setSeconds(0);
                return new PlanItem(
                    index, 
                    value.index, 
                    isCompleted, 
                    isBreak,
                    isEnd,
                    time, 
                    `${value.groups.hours}:${value.groups.minutes}`,
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

    private empty(): PlanSummaryData {
        const planData = new PlanSummaryData([])
        planData.empty= true;
        return planData;
    }

    private invalid(): PlanSummaryData {
        const planData = new PlanSummaryData([])
        planData.invalid = true;
        return planData;
    }

}
