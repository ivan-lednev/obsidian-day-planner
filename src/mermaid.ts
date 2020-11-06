import moment from 'moment';
import { PlanItem, PlanSummaryData } from './plan-data';
import Progress from './progress';

export default class PlannerMermaid {
    progress: Progress;

    constructor(progress: Progress) {
        this.progress = progress;
    }

    generate(planSummary: PlanSummaryData): string {
        const {tasks, breaks} = this.generateEntries(planSummary.items);
        return this.mermaidTemplate(moment(new Date()).format('Do MMMM YYYY'), tasks, breaks);
    }

    private generateEntries(items: PlanItem[]): {tasks: string[], breaks: string[]} {
        const tasks:string[] = [];
        const breaks:string[] = [];
        items.forEach((item, i) => {
            const next = items[i+1];
            const mins = this.minuteInterval(item, next);
            const text = `    ${item.displayText()}      :${item.rawTime.replace(':', '-')}${mins}`;
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
            return '';
        }
        const currentMoment = moment(item.time);
        const nextMoment = moment(next.time);
        const untilNext = moment.duration(nextMoment.diff(currentMoment)).asMinutes();
        return ', ' + untilNext + 'mm';
    }

    private mermaidTemplate(date: string, tasks: string[], breaks: string[]):string {
        return `
\`\`\`mermaid
gantt
    title Day Planner for ${date}
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