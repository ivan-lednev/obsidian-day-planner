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
        try {
            const now = new Date();
            const validItems = this.validItems();
            if(validItems.length === 0){
                this.empty = true;
                return;
            }
            validItems.forEach((item, i) => {
                const next = validItems[i+1];
                if(item.time < now && (item.isEnd || (next && now < next.time))) {
                    this.current = item;
                    this.next = item.isEnd ? null : next;
                } else if(item.time < now) {
                    item.isPast = true;
                    this.past.push(item);
                }
            });
        } catch (error) {
            console.log(error)
        }
    }

    validItems(): PlanItem[] {
        return this.items.filter(item => !item.isUnMatched);
    }
}

export class PlanItem {

    matchIndex: number;
    charIndex: number;
    isCompleted: boolean;
    isPast: boolean;
    isBreak: boolean;
    isEnd: boolean;
    isUnMatched: boolean;
    time: Date;
    rawTime: string;
    text: string;
    raw: string;
    
    constructor(matchIndex: number, charIndex: number, isCompleted: boolean, 
        isBreak: boolean, isEnd: boolean, isUnMatched: boolean, time: Date, rawTime:string, text: string, raw: string){
        this.matchIndex = matchIndex;
        this.charIndex = charIndex;
        this.isCompleted = isCompleted;
        this.isBreak = isBreak;
        this.isEnd = isEnd;
        this.isUnMatched = isUnMatched;
        this.time = time;
        this.rawTime = rawTime;
        this.text = text;
        this.raw = raw;
    }

    displayText() {
        if(this.isBreak) {
            return 'BREAK';
        }
        if(this.isEnd) {
            return 'END';
        }
        return this.text;
    }
}