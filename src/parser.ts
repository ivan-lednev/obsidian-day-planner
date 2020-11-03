import { TFile, Vault } from 'obsidian';
import { PLAN_PARSER_REGEX } from './constants';


export class PlanSummaryData {
    empty: boolean;
    invalid: boolean;
    items: PlanItem[];
    
    constructor(items: PlanItem[]){
        this.empty = items.length < 1;
        this.invalid = false;
        this.items = items;
    }

    current(): {current: PlanItem, next: PlanItem} {
        const now = new Date();
        let result = null;
        this.items.forEach((item, i) => {
            const next = this.items[i+1];
            if(item.time < now && (!next || now < next.time)){
                result = {current: item, next: next};
            } 
        });
        return result;
    }
}

export class PlanRenderData {
    
    
    constructor(){

    }
}

export class PlanItem {
    matchIndex: number;
    charIndex: number;
    completed: boolean;
    time: Date;
    text: string;

    constructor(matchIndex: number, charIndex: number, completed: boolean, time: Date, text: string){
        this.matchIndex = matchIndex;
        this.charIndex = charIndex;
        this.completed = completed;
        this.time = time;
        this.text = text;
    }
}

export default class Parser {
    vault: Vault;

    constructor(vault: Vault) {
        this.vault = vault;
    }

    async parseMarkdown(fileContent: string): Promise<PlanSummaryData> {
        // if(file.basename !== 'Day Planner'){
        //     return this.empty();
        // }
        // if(file.extension !== 'md'){
        //     return this.invalid();
        // }
        const parsed = this.parse(fileContent);
        const transformed = this.transform(parsed);
        this.renderProgressInEditor(fileContent, transformed);
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
        const results = regexMatches.map((value:RegExpMatchArray, index) => {
            try {
                const completed = value.groups.completion.trim().toLocaleLowerCase() === 'x';
                const time = new Date();
                time.setHours(parseInt(value.groups.hours))
                time.setMinutes(parseInt(value.groups.minutes))
                return new PlanItem(index, value.index, completed, time, value.groups.text.trim());
            } catch (error) {

            }
        });
        return results;
    }

    private renderProgressInEditor(fileContent:string, items:PlanItem[]){

    }

    private empty(): PlanSummaryData {
        const planData = new PlanSummaryData()
        planData.empty= true;
        return planData;
    }

    private invalid(): PlanSummaryData {
        const planData = new PlanSummaryData()
        planData.invalid = true;
        return planData;
    }

}
