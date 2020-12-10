import type { Vault } from 'obsidian';
import { PLAN_PARSER_REGEX } from './constants';
import { PlanItem, PlanSummaryData } from './plan-data';

export default class Parser {
    vault: Vault;

    constructor(vault: Vault) {
        this.vault = vault;
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
                while(match = PLAN_PARSER_REGEX.exec(line)){
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
                const isBreak = this.matchValue(value.groups.break, 'break');
                const isEnd = this.matchValue(value.groups.end, 'end');
                const time = new Date();
                time.setHours(parseInt(value.groups.hours))
                time.setMinutes(parseInt(value.groups.minutes))
                time.setSeconds(0);
                return new PlanItem(
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
