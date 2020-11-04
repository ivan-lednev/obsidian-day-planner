import { Workspace } from 'obsidian';
import DayPlannerFile from './file';
import { PlanItem } from './parser';
import PlannerMarkdown from './planner-md';
import Progress from './progress';
import { DayPlannerSettings } from './settings';

export default class StatusBar {
    settings: DayPlannerSettings;
    file: DayPlannerFile;
    statusBar: HTMLElement
    statusBarAdded: boolean;
    statusBarText: HTMLSpanElement;
    statusBarProgress: HTMLDivElement;
    statusBarCurrentProgress: HTMLDivElement;
    workspace: Workspace;
    progress: Progress;
    plannerMD: PlannerMarkdown;
    
    constructor(statusBar:HTMLElement, workspace:Workspace, progress:Progress, plannerMD:PlannerMarkdown) {
        this.statusBar = statusBar;
        this.workspace = workspace;
        this.progress = progress;
        this.plannerMD = plannerMD;
    }

    async refreshStatusBar() {
        const planSummary = await this.plannerMD.parseDayPlanner();
        planSummary.calculate();
        if(!planSummary.empty && !planSummary.invalid){
            const current = planSummary.current;
            if(current){
                this.updateProgress(planSummary.current, planSummary.next);
            }
        }
    }

    private updateProgress(current: PlanItem, next: PlanItem) {
        if(current.isEnd || !next){
          this.progressBar(100, '0', current);
          return;
        }
        const { percentageComplete, minsUntilNext } = this.progress.getProgress(current, next);
        this.progressBar(percentageComplete, minsUntilNext, current);
      }

    private progressBar(percentageComplete: number, minsUntilNext:string, current: PlanItem) {
        if(current.isBreak){
          this.statusBarCurrentProgress.addClass('green');
          this.statusBarProgress.style.display = 'block';
        } else if(current.isEnd) {
          this.statusBarProgress.style.display = 'none';
        } else {
          this.statusBarCurrentProgress.removeClass('green');
          this.statusBarProgress.style.display = 'block';
        }
        this.statusBarCurrentProgress.style.width = `${percentageComplete}%`;
        this.statusBarText.innerText = this.statusText(minsUntilNext, current);
      }
      
      private statusText(minsUntilNext: string, current: PlanItem): string{
        if(current.isEnd){
          return 'ALL DONE!'
        }
        minsUntilNext = minsUntilNext === '0' ? '1' : minsUntilNext;
        const minsText = `${minsUntilNext} min${minsUntilNext === '1' ? '' : 's'}`;
        return (current.isBreak ? `Break for ${minsText}` : `${minsText} left`);
      }
  
      linkToDayPlanBlock() {
        if(this.statusBarAdded) {
          return;
        }
        let status = this.statusBar.createEl('div', { cls: 'day-planner', 'title': 'View the Day Planner', prepend: true});
        this.statusBarText = status.createEl('span', { cls: ['status-bar-item-segment', 'day-planner-status-bar-text']});
        this.statusBarProgress = status.createEl('div', { cls: ['status-bar-item-segment', 'day-planner-progress-bar']});
        this.statusBarProgress.style.display = 'none';
        this.statusBarCurrentProgress = this.statusBarProgress.createEl('div', { cls: 'day-planner-progress-value'});
        status.onClickEvent(async (ev: any) => {
          const fileName = this.settings.todayPlannerFileName();
          await this.file.createFileIfNotExists(fileName);
          this.workspace.openLinkText(fileName, '', false);
        });
        
        this.statusBarAdded = true;
      }
}