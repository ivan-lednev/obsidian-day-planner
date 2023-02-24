import type { PlanItem, PlanSummaryData } from './plan-data';
import type Progress from './progress';
const moment = (window as any).moment;

interface Replacement {
    key: string;
    replacement: string;
}
const mermaidEscapedCharacters: Replacement[] = [
    //Escape characters are not currently supported for Mermaid Gantt
    { key: ';', replacement:'' },
    { key: ':', replacement:'' },
    { key: '#', replacement:'' },
];

export default class PlannerMermaid {
    progress: Progress;

    constructor(progress: Progress) {
        this.progress = progress;
    }

    generate(planSummary: PlanSummaryData): string {
        const {tasks, breaks} = this.generateEntries(planSummary.items);
        return this.mermaidTemplate(tasks, breaks);
    }

    private generateEntries(items: PlanItem[]): {tasks: string[], breaks: string[]} {
        const tasks:string[] = [];
        const breaks:string[] = [];
        items.forEach((item, i) => {
            const next = items[i+1];
            const mins = this.minuteInterval(item, next);
            // TODO: do I need to do something here pjk
            const text = `    ${this.escape(item.text)}     :${item.rawStartTime.replace(':', '-')}${mins}`;
            if(item.isBreak) {
                breaks.push(text);
            } else {
                tasks.push(text);
            }
        });
        return {tasks, breaks};
    }

    private minuteInterval(item: PlanItem, next: PlanItem): string {
        if(next === undefined && item.endTime === undefined){
            return ', 0mm';
        }
        const currentMoment = moment(item.startTime);
        let nextMoment: any;
        if (item.endTime !== undefined) {
            nextMoment = moment(item.endTime);
        } else {
            nextMoment = moment(next.startTime);
        }
        const untilNext = Math.floor(moment.duration(nextMoment.diff(currentMoment)).asMinutes());
        return ', ' + untilNext + 'mm';
    }

    private escape(input: string){
        mermaidEscapedCharacters.forEach(mec => {  
            const regex = new RegExp(mec.key, 'g');
            input = input.replace(regex, mec.replacement)
        });
        return input;
    }

    private mermaidTemplate(tasks: string[], breaks: string[]):string {
        const now = new Date();
        return `\`\`\`mermaid
gantt
    dateFormat  HH-mm
    axisFormat %H:%M
    %% Current Time: ${now.toLocaleTimeString()}
    section Tasks
${tasks.join('\n')}
    section Breaks
${breaks.join('\n')}
\`\`\``
    }
}