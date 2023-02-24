import type { MarkdownView, Workspace } from 'obsidian';
import { DAY_PLANNER_DEFAULT_CONTENT, MERMAID_REGEX } from './constants';
import type DayPlannerFile from './file';
import PlannerMermaid from './mermaid';
import type Parser from './parser';
import type { PlanItem, PlanSummaryData } from './plan-data';
import type Progress from './progress';
import { DayPlannerSettings, NoteForDateQuery} from './settings';

export default class PlannerMarkdown {
    workspace: Workspace;
    dayPlannerLastEdit: number;
    settings: DayPlannerSettings;
    file: DayPlannerFile;
    parser: Parser;
    progress: Progress;
    mermaid: PlannerMermaid;
    noteForDateQuery: NoteForDateQuery;
    
    constructor(workspace: Workspace, settings: DayPlannerSettings, file: DayPlannerFile, parser: Parser, progress: Progress){
        this.workspace = workspace;
        this.settings = settings;
        this.file = file;
        this.parser = parser;
        this.progress = progress;
        this.mermaid = new PlannerMermaid(this.progress);
        this.noteForDateQuery = new NoteForDateQuery();
    }
    
    async insertPlanner() {
        const filePath = this.file.todayPlannerFilePath();
        const fileContents = await (await this.file.getFileContents(filePath)).split('\n');
        const view = this.workspace.activeLeaf.view as MarkdownView;
        const currentLine = view.editor.getCursor().line;
        const insertResult = [...fileContents.slice(0, currentLine), ...DAY_PLANNER_DEFAULT_CONTENT.split('\n'), ...fileContents.slice(currentLine)];
        this.file.updateFile(filePath, insertResult.join('\n'));
    }

    async parseDayPlanner():Promise<PlanSummaryData> {
        try {
            const filePath = this.file.todayPlannerFilePath();
            const fileContent = await (await this.file.getFileContents(filePath)).split('\n');

            const planData = await this.parser.parseMarkdown(fileContent);
            return planData;
        } catch (error) {
            console.log(error)
        }
    }
    
    async updateDayPlannerMarkdown(planSummary: PlanSummaryData) {
        if((this.dayPlannerLastEdit + 6000) > new Date().getTime()) {
            return;
        }
        try {
            const filePath = this.file.todayPlannerFilePath();
            const fileContents = await (await this.file.getFileContents(filePath))
            const fileContentsArr = fileContents.split('\n');

            planSummary.calculate();
            if(planSummary.empty){
                return;
            }
            const results = planSummary.items.map((item) => {
                const result = this.updateItemCompletion(item, item.isPast);
                return {index: item.matchIndex, replacement: result};
            });

            results.forEach(result => {
                fileContentsArr[result.index] = result.replacement;
            });

            const fileContentsWithReplacedMermaid = this.replaceMermaid(fileContentsArr.join('\n'), planSummary);
            if(fileContents !== fileContentsWithReplacedMermaid) {
                this.file.updateFile(filePath, fileContentsWithReplacedMermaid);
            }
        } catch (error) {
            console.log(error);
        }
    }

    private replaceMermaid(input: string, planSummary: PlanSummaryData): string{
        const mermaidResult = this.settings.mermaid ? this.mermaid.generate(planSummary) + '\n\n' : '';
        const noMatch = input.match(MERMAID_REGEX) === null;
        if(noMatch) {
            return input.replace('# Day Planner\n', `# Day Planner\n${mermaidResult}`)
        }
        const replaced = input.replace(MERMAID_REGEX, mermaidResult);
        return replaced;
    }

    private updateItemCompletion(item: PlanItem, complete: boolean) {
        let check = this.check(complete);
        //Override to use current (user inputted) state if plugin setting is enabled
        if(!this.settings.completePastItems) {
            check = this.check(item.isCompleted);
        }

        let outputTask = `- [${check}] ${item.rawStartTime} `
        if (item.rawEndTime !== '') {
            outputTask += `- ${item.rawEndTime} `
        }

        return  outputTask + `${item.text}`;
    }

    private check(check: boolean) {
        return check ? 'x' : ' ';
    }

    checkIsDayPlannerEditing(){
        const activeLeaf = this.workspace.activeLeaf;
        if(!activeLeaf){
            return;
        }
        const viewState = activeLeaf.view.getState();
        if(viewState.file === this.file.todayPlannerFilePath()){
            this.dayPlannerLastEdit = new Date().getTime();
        }
    }
}