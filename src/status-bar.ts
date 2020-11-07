import { Workspace } from 'obsidian';
import DayPlannerFile from './file';
import { PlanItem } from './plan-data';
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
    
    constructor(statusBar:HTMLElement, workspace:Workspace, progress:Progress, plannerMD:PlannerMarkdown, file:DayPlannerFile) {
        this.statusBar = statusBar;
        this.workspace = workspace;
        this.progress = progress;
        this.plannerMD = plannerMD;
        this.file = file;
    }

    async refreshStatusBar() {
        const planSummary = await this.plannerMD.parseDayPlanner();
        planSummary.calculate();
        if(!planSummary.empty && !planSummary.invalid){
            this.statusBar.style.display = 'block';      
            this.updateProgress(planSummary.current, planSummary.next);
        } else {
          this.hide();
        }
    }

    hide() {
      this.statusBar.style.display = 'none';
    }

    private updateProgress(current: PlanItem, next: PlanItem) {
        if(!current || !next || current.isEnd){
            this.statusBarProgress.style.display = 'none';
            this.statusBarText.innerText = 'ALL DONE!';
            return;
        }
        const { percentageComplete, minsUntilNext } = this.progress.getProgress(current, next);
        this.progressBar(percentageComplete, minsUntilNext, current);
      }

    private progressBar(percentageComplete: number, minsUntilNext:string, current: PlanItem) {
        if(current.isBreak){
          this.statusBarCurrentProgress.addClass('green');
          this.statusBarProgress.style.display = 'block';
        } else {
          this.statusBarCurrentProgress.removeClass('green');
          this.statusBarProgress.style.display = 'block';
        }
        this.statusBarCurrentProgress.style.width = `${percentageComplete}%`;
        this.statusBarText.innerText = this.statusText(minsUntilNext, current);
      }
      
      private statusText(minsUntilNext: string, current: PlanItem): string{
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
            try {
                const fileName = this.file.todayPlannerFilePath();
                this.workspace.openLinkText(fileName, '', false);
            } catch (error) {
                console.log(error)
            }
        });
        this.statusBarAdded = true;
      }
}

// <div class="day-planner-status-card" style="
//     position: absolute;
//     top: -136px;
//     width: 300px;
//     background-color: var(--background-secondary-alt);
//     padding: 8px;
//     border-radius: 4px;
// ">
//     <div>
// <strong>Current Task</strong><br> 16:05 Reading articles
// </div><br>
//     <span>
//    <strong>Up Next</strong><br> 17:00 BREAK</span><div style="
//     border-left: 20px solid transparent;
//     border-right: 20px solid transparent;
//     width: 20px;
//     position: absolute;
//     /* top: -25px; */
//     /* height: 29px; */
//     border-top: 20px solid var(--background-secondary-alt);
// "></div>
    
//     </div>