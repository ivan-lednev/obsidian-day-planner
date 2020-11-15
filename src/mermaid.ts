import moment from 'moment';
import type { PlanItem, PlanSummaryData } from './plan-data';
import type Progress from './progress';
interface Replacement {
    key: string;
    replacement: string;
}
const mermmaidEscapedCharacters: Replacement[] = [
    { key: ';', replacement:'#59;' },
    { key: ':', replacement:'#58;' },
    { key: '#', replacement:'#35;' },
    //HACK to re-introduce partially replaced replacements!
    { key: '#35;59;', replacement:'#59;' },
];

export default class PlannerMermaid {
    progress: Progress;

    constructor(progress: Progress) {
        this.progress = progress;
    }

    generate(planSummary: PlanSummaryData): string {
        const {tasks, breaks} = this.generateEntries(planSummary.validItems());
        return this.mermaidTemplate(tasks, breaks);
    }

    private generateEntries(items: PlanItem[]): {tasks: string[], breaks: string[]} {
        const tasks:string[] = [];
        const breaks:string[] = [];
        items.forEach((item, i) => {
            const next = items[i+1];
            const mins = this.minuteInterval(item, next);
            const text = `    ${this.escape(item.displayText())}     :${item.rawTime.replace(':', '-')}${mins}`;
            if(item.isBreak) {
                breaks.push(text);
            } else {
                tasks.push(text);
            }
        });
        return {tasks, breaks};
    }

    private minuteInterval(item: PlanItem, next: PlanItem): string {
        if(next === undefined){
            return ', 0mm';
        }
        const currentMoment = moment(item.time);
        const nextMoment = moment(next.time);
        const untilNext = Math.floor(moment.duration(nextMoment.diff(currentMoment)).asMinutes());
        return ', ' + untilNext + 'mm';
    }

    private escape(input: string){
        mermmaidEscapedCharacters.forEach(mec => {  
            input = input.replace(mec.key, mec.replacement)
        });
        return input;
    }

    private mermaidTemplate(tasks: string[], breaks: string[]):string {
        return `
\`\`\`mermaid
gantt
    dateFormat  HH-mm
    axisFormat %H:%M
    section Tasks
${tasks.join('\n')}
    section Breaks
${breaks.join('\n')}
\`\`\`
`
    }
}