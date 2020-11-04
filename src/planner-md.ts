import { Workspace } from 'obsidian';
import { CURRENT_ITEM_PROGRESS_REGEX, CURRENT_ITEM_REGEX, PLAN_ITEM_REGEX } from './constants';
import DayPlannerFile from './file';
import Parser from './parser';
import { PlanItem, PlanSummaryData } from './plan-data';
import Progress from './progress';
import { DayPlannerSettings } from './settings';

export default class PlannerMarkdown {
    workspace: Workspace;
    dayPlannerLastEdit: number;
    settings: DayPlannerSettings;
    file: DayPlannerFile;
    parser: Parser;
    progress: Progress;

    constructor(workspace: Workspace, settings: DayPlannerSettings, file: DayPlannerFile, parser: Parser, progress: Progress){
        this.workspace = workspace;
        this.settings = settings;
        this.file = file;
        this.parser = parser;
        this.progress = progress;
    }

    async parseDayPlanner():Promise<PlanSummaryData> {
        const fileName = this.settings.todayPlannerFileName();
        await this.file.createFileIfNotExists(fileName);
        const fileContent = await this.file.getFileContents(fileName);
        const planData = await this.parser.parseMarkdown(fileContent);
        return planData;
    }

    async updateDayPlannerMarkdown(planSummary: PlanSummaryData) {
        if((this.dayPlannerLastEdit + 6000) > new Date().getTime()) {
            return;
        }
        const fileName = this.settings.todayPlannerFileName();
        let dayPlannerContents = await this.file.getFileContents(fileName);
        planSummary.calculate();
        if(planSummary.empty){
            return;
        }
        dayPlannerContents = this.current(planSummary, dayPlannerContents);
        dayPlannerContents = this.past(planSummary.past, dayPlannerContents);
        dayPlannerContents = this.end(planSummary, dayPlannerContents);
        this.file.updateFile(fileName, dayPlannerContents);
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
        const current = planSummary.current;
        const next = planSummary.next;

        const progressMarkdown = `||${current.rawTime}||${this.progress.progressMarkdown(current, next)}||${next.rawTime}||`;
        let replacementItem = `---\n**Current Task**\n${current.raw}\n\n${progressMarkdown}\n\n---`;      
        return replacementItem;
    }

    checkIsDayPlannerEditing(){
        const activeLeaf = this.workspace.activeLeaf;
        if(!activeLeaf){
            return;
        }
        const viewState = activeLeaf.view.getState();
        if(viewState.file === this.settings.todayPlannerFileName()){
            this.dayPlannerLastEdit = new Date().getTime();
        };
    }
}