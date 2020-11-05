import { strict } from 'assert';
import { MarkdownSourceView, MarkdownView, Workspace } from 'obsidian';
import { stringify } from 'querystring';
import { CURRENT_ITEM_PROGRESS_REGEX, CURRENT_ITEM_REGEX, DAY_PLANNER_DEFAULT_CONTENT, PLAN_ITEM_REGEX } from './constants';
import DayPlannerFile from './file';
import Parser from './parser';
import { PlanItem, PlanSummaryData } from './plan-data';
import Progress from './progress';
import { DayPlannerSettings, NoteForDateQuery} from './settings';

export default class PlannerMarkdown {
    workspace: Workspace;
    dayPlannerLastEdit: number;
    settings: DayPlannerSettings;
    file: DayPlannerFile;
    parser: Parser;
    progress: Progress;
    noteForDateQuery: NoteForDateQuery;
    
    constructor(workspace: Workspace, settings: DayPlannerSettings, file: DayPlannerFile, parser: Parser, progress: Progress){
        this.workspace = workspace;
        this.settings = settings;
        this.file = file;
        this.parser = parser;
        this.progress = progress;
        this.noteForDateQuery = new NoteForDateQuery();
    }
    
    async insertPlanner() {
        const filePath = this.file.todayPlannerFilePath();
        const fileContents = await (await this.file.getFileContents(filePath)).split('\n');
        console.log('Contents', fileContents);
        const view = this.workspace.activeLeaf.view as MarkdownView;
        const currentLine = view.sourceMode.cmEditor.getCursor().line;
        console.log('Line', currentLine);
        const insertResult = [...fileContents.slice(0, currentLine), ...DAY_PLANNER_DEFAULT_CONTENT.split('\n'), ...fileContents.slice(currentLine)];
        console.log('Insert Result', insertResult);
        this.file.updateFile(filePath, insertResult.join('\n'));
    }

    async parseDayPlanner():Promise<PlanSummaryData> {
        try {
            const filePath = this.file.todayPlannerFilePath();
            const fileContent = await this.file.getFileContents(filePath);
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
            let dayPlannerContents = await this.file.getFileContents(filePath);
            planSummary.calculate();
            if(planSummary.empty){
                return;
            }
            dayPlannerContents = this.current(planSummary, dayPlannerContents);
            dayPlannerContents = this.past(planSummary.past, dayPlannerContents);
            dayPlannerContents = this.end(planSummary, dayPlannerContents);
            this.file.updateFile(filePath, dayPlannerContents);
        } catch (error) {
            console.log(error)
        }
    }

    end(planSummary: PlanSummaryData, plannerText: string): string{
        if(planSummary.current && planSummary.current.isEnd){
            return this.updateItemCompletion(planSummary.current, plannerText);
        }
        return plannerText;
    }
  
    past(pastItems: PlanItem[], plannerText: string): string {
        if(!pastItems || pastItems.length === 0){
            return plannerText;
        }
        pastItems.forEach(item => {
            plannerText = this.updateItemCompletion(item, plannerText);
        });
        return plannerText;
    }

    updateItemCompletion(item: PlanItem, text: string) {
        const replacementItem = item.raw.replace(PLAN_ITEM_REGEX, 
        `[x] ${item.rawTime}`);
        return text.replace(item.raw, replacementItem);
    }
    
    current(planSummary: PlanSummaryData, plannerText: string): string {
        plannerText = plannerText.replace(CURRENT_ITEM_REGEX, '');
        plannerText = plannerText.replace(CURRENT_ITEM_PROGRESS_REGEX, '');
        if(!planSummary.current || !planSummary.next) {
            return plannerText;
        }
        const replacementItem = this.currentItemText(planSummary);
        plannerText = plannerText.replace(planSummary.current.raw, replacementItem);
        return plannerText;
    }

    currentItemText(planSummary:PlanSummaryData): string{
        try {
            const current = planSummary.current;
            const next = planSummary.next;
    
            const progressMarkdown = `||${current.rawTime}||${this.progress.progressMarkdown(current, next)}||${next.rawTime}||`;
            let replacementItem = `---\n**Current Task**\n${current.raw}\n\n${progressMarkdown}\n\n---`;      
            return replacementItem;
        } catch (error) {
            console.log(error)
        }
    }

    checkIsDayPlannerEditing(){
        const activeLeaf = this.workspace.activeLeaf;
        if(!activeLeaf){
            return;
        }
        const viewState = activeLeaf.view.getState();
        if(viewState.file === this.file.todayPlannerFilePath()){
            this.dayPlannerLastEdit = new Date().getTime();
        };
    }
}