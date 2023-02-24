import type { DayPlannerSettings } from './settings';

const moment = (window as any).moment;

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
        this.items = items.sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
        this.past = [];
    }

    calculate(): void {
        try {
            const now = new Date();
            if(this.items.length === 0){
                this.empty = true;
                return;
            }
            this.items.forEach((item, i) => {
                const next = this.items[i+1];
                if(item.startTime < now && (item.isEnd || (next && now < next.startTime))) {
                    this.current = item;
                    if (item.isEnd) {
                        item.isPast = true;
                        this.past.push(item);
                    }
                    this.next = item.isEnd ? null : next;
                } else if(item.startTime < now) {
                    item.isPast = true;
                    this.past.push(item);
                }
                
                if (item.endTime !== undefined) {
                    item.durationMins = moment.duration(moment(item.endTime).diff(moment(item.startTime))).asMinutes()
                } else if(next){
                    const untilNext = moment.duration(moment(next.startTime).diff(moment(item.startTime))).asMinutes();
                    item.durationMins = untilNext;
                }
            });
        } catch (error) {
            console.log(error)
        }
    }

}

export class PlanItem {

    matchIndex: number;
    charIndex: number;
    isCompleted: boolean;
    isPast: boolean;
    isBreak: boolean;
    isEnd: boolean;
    startTime: Date;
    endTime: Date;
    durationMins: number;
    rawStartTime: string;
    rawEndTime: string;
    text: string;
    raw: string;

    constructor(matchIndex: number, charIndex: number, isCompleted: boolean, 
        isBreak: boolean, isEnd: boolean, startTime: Date, endTime: Date, rawStartTime:string, rawEndTime:string, text: string, raw: string){
        this.matchIndex = matchIndex;
        this.charIndex = charIndex;
        this.isCompleted = isCompleted;
        this.isBreak = isBreak;
        this.isEnd = isEnd;
        this.startTime = startTime;
        this.endTime = endTime
        this.rawStartTime = rawStartTime;
        this.rawEndTime = rawEndTime;
        this.text = text;
        this.raw = raw;
    }
}

export class PlanItemFactory {
    private settings: DayPlannerSettings;

    constructor(settings: DayPlannerSettings) {
        this.settings = settings;
    }

    getPlanItem(matchIndex: number, charIndex: number, isCompleted: boolean, isBreak: boolean, isEnd: boolean, startTime: Date, endTime: Date, rawStartTime: string, rawEndTime: string, text: string, raw: string) {
        const displayText = this.getDisplayText(isBreak, isEnd, text);
        return new PlanItem(matchIndex, charIndex, isCompleted, isBreak, isEnd, startTime, endTime, rawStartTime, rawEndTime, displayText, raw);
    }

    getDisplayText(isBreak: boolean, isEnd: boolean, text: string) {
        if(isBreak) {
            return this.settings.breakLabel;
        }
        if(isEnd) {
            return this.settings.endLabel;
        }
        return text;
    }
}