import { ItemView, TFile, Vault } from 'obsidian';
import { PLAN_PARSER_REGEX } from './constants';


export class PlanSummaryData {
    empty: boolean;
    invalid: boolean;
    items: PlanItem[];
    past: PlanItem[];
    current: PlanItem;
    next: PlanItem;
    
    constructor(items: PlanItem[]){
        this.empty = items.length < 1;
        this.invalid = false;
        this.items = items;
        this.past = [];
    }

    calculate(): void {
        const now = new Date();
        now.setSeconds(0);
        if(this.items.length === 0){
            this.empty = true;
            return;
        }
        this.items.forEach((item, i) => {
            const next = this.items[i+1];
            if(item.time < now && (next && now < next.time)){
                this.current = item;
                this.next = item.isEnd ? null : next;
            } else if(item.time < now){
                this.past.push(item);
            }
        });
    }
}

export class PlanRenderData {
    
    
    constructor(){

    }
}

export class PlanItem {

    matchIndex: number;
    charIndex: number;
    isCompleted: boolean;
    isBreak: boolean;
    isEnd: boolean;
    time: Date;
    rawTime: string;
    text: string;
    raw: string;

    constructor(matchIndex: number, charIndex: number, isCompleted: boolean, 
        isBreak: boolean, isEnd: boolean, time: Date, rawTime:string, text: string, raw: string){
        this.matchIndex = matchIndex;
        this.charIndex = charIndex;
        this.isCompleted = isCompleted;
        this.isBreak = isBreak;
        this.isEnd = isEnd;
        this.time = time;
        this.rawTime = rawTime;
        this.text = text;
        this.raw = raw;
    }

    isPast() {
        const now = new Date();
        now.setSeconds(0);
        return this.time < now;
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

    private renderProgressInEditor(fileContent:string, items:PlanItem[]){

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
