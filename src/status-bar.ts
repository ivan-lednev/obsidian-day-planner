import type { Workspace } from 'obsidian';
import type DayPlannerFile from './file';
import type { PlanItem, PlanSummaryData } from './plan-data';
import type PlannerMarkdown from './planner-md';
import type Progress from './progress';
import type { DayPlannerSettings } from './settings';

export default class StatusBar {
    settings: DayPlannerSettings;
    file: DayPlannerFile;
    statusBar: HTMLElement
    statusBarAdded: boolean;
    statusBarText: HTMLSpanElement;
    nextText: HTMLSpanElement;
    statusBarProgress: HTMLDivElement;
    statusBarCurrentProgress: HTMLDivElement;
    circle: HTMLDivElement;
    workspace: Workspace;
    progress: Progress;
    plannerMD: PlannerMarkdown;
    card: HTMLDivElement;
    cardCurrent: any;
    cardNext: any;
    currentTime: string;
    
    constructor(settings: DayPlannerSettings, statusBar:HTMLElement, workspace:Workspace, progress:Progress, plannerMD:PlannerMarkdown, file:DayPlannerFile) {
        this.settings = settings;
        this.statusBar = statusBar;
        this.workspace = workspace;
        this.progress = progress;
        this.plannerMD = plannerMD;
        this.file = file;
    }

    initStatusBar() {
      if(this.statusBarAdded) {
        return;
      }
      let status = this.statusBar.createEl('div', { cls: 'day-planner', title: 'View the Day Planner', prepend: true});
      
      this.setupCard(status);
      this.statusBarText = status.createEl('span', { cls: ['status-bar-item-segment', 'day-planner-status-bar-text']});
      
      this.setupCircularProgressBar(status);
      this.setupHorizontalProgressBar(status);
      
      this.nextText = status.createEl('span', { cls: ['status-bar-item-segment', 'day-planner-status-bar-text']});
      
      this.setupStatusBarEvents(status);
      this.statusBarAdded = true;
    }

    private setupStatusBarEvents(status: HTMLDivElement) {
      status.onClickEvent(async (ev: any) => {
          try {
              const fileName = this.file.todayPlannerFilePath();
              this.workspace.openLinkText(fileName, '', false);
          } catch (error) {
              console.log(error)
          }
      });
      status.on('mouseenter', '.day-planner', () => {
        this.show(this.card);
      });

      status.on('mouseleave', '.day-planner', () => {
        this.hide(this.card);
      });
    }

    async refreshStatusBar(planSummary: PlanSummaryData) {
        if(!planSummary.empty && !planSummary.invalid){
            this.updateProgress(planSummary.current, planSummary.next);
            this.show(this.statusBar);
        } else {
          this.hide(this.statusBar);
        }
        return planSummary;
    }

    hide(el: HTMLElement) {
      if(el) {
        el.style.display = 'none';
      }
    }

    show(el: HTMLElement) {
      if(el) {
        el.style.display = 'block';
      }
    }

    hideProgress () {
      this.hide(this.statusBarProgress);
      this.hide(this.circle);
      this.hide(this.nextText);
    }

    private updateProgress(current: PlanItem, next: PlanItem) {
        if(!current || !next || current.isEnd){
            this.hideProgress();
            this.statusBarText.innerText = this.settings.endLabel;
            return;
        }
        const { percentageComplete, minsUntilNext } = this.progress.getProgress(current, next);
        if(this.settings.circularProgress) {
          this.hide(this.statusBarProgress);
          this.progressCircle(percentageComplete, current);
        } else {
          this.hide(this.circle);
          this.progressBar(percentageComplete, current);
        }
        this.statusText(minsUntilNext, current, next, percentageComplete);
    }

    private progressBar(percentageComplete: number, current: PlanItem) {
      if(current.isBreak){
        this.statusBarCurrentProgress.addClass('green');
      } else {
        this.statusBarCurrentProgress.removeClass('green');
      }
      this.statusBarCurrentProgress.style.width = `${percentageComplete}%`;
      this.show(this.statusBarProgress);
    }
      
    private progressCircle(percentageComplete: number, current: PlanItem) {
      if(current.isBreak){
        this.circle.addClass('green');
      } else {
        this.circle.removeClass('green');
      }
      this.circle.setAttr('data-value', percentageComplete.toFixed(0));
      this.show(this.circle);
    }
    
    private statusText(minsUntilNext: string, current: PlanItem, next: PlanItem, percentageComplete: number) {
      minsUntilNext = minsUntilNext === '0' ? '1' : minsUntilNext;
      const minsText = `${minsUntilNext} min${minsUntilNext === '1' ? '' : 's'}`;
      // TODO: do I need to add an end time here pjk
      if(this.settings.nowAndNextInStatusBar) {
        this.statusBarText.innerHTML = `<strong>Now</strong> ${current.rawStartTime} ${this.ellipsis(current.text, 10)}`;
        this.nextText.innerHTML = `<strong>Next</strong> ${next.rawStartTime} ${this.ellipsis(next.text, 10)}`;
        this.show(this.nextText);
      } else {
        this.hide(this.nextText);
        const statusText = (current.isBreak ? `${this.settings.breakLabel} for ${minsText}` : `${minsText} left`);
        this.statusBarText.innerText = statusText;
      }
      const currentTaskStatus = `Current Task (${percentageComplete.toFixed(0)}% complete)`;
      const currentTaskTimeAndText = `${current.rawStartTime} ${current.text}`;
      const nextTask = `Next Task (in ${minsText})`;
      const nextTaskTimeAndText = `${next.rawStartTime} ${next.text}`;
      this.cardCurrent.innerHTML = `<strong>${currentTaskStatus}</strong><br> ${currentTaskTimeAndText}`;
      this.cardNext.innerHTML = `<strong>${nextTask}</strong><br> ${nextTaskTimeAndText}`;
      this.taskNotification(current, currentTaskTimeAndText, nextTask, nextTaskTimeAndText);
    }

    private taskNotification(current: PlanItem, currentTaskTimeAndText: string, nextTask: string, nextTaskText: string){
      if(this.settings.showTaskNotification && this.currentTime !== undefined && this.currentTime !== current.startTime.toUTCString()){
        new Notification(`Task started, ${currentTaskTimeAndText}`, {body: `${nextTask}: ${nextTaskText}`, requireInteraction: true});
      }
      this.currentTime = current.startTime.toUTCString();
    }

    private ellipsis(input: string, limit: number){
      if(input.length <= limit) {
        return input;
      }
      return input.substring(0, limit) + '...';
    }

    private setupHorizontalProgressBar(status: HTMLDivElement ) {
      this.statusBarProgress = status.createEl('div', { cls: ['status-bar-item-segment', 'day-planner-progress-bar']});
      this.statusBarProgress.style.display = 'none';
      this.statusBarCurrentProgress = this.statusBarProgress.createEl('div', { cls: 'day-planner-progress-value'});
    }

    private setupCircularProgressBar(status: HTMLDivElement){
      this.circle = status.createEl('div', {cls: ['status-bar-item-segment', 'progress-pie day-planner']});
    }

    private setupCard(status: HTMLDivElement) {
      this.card = status.createEl('div', {cls: 'day-planner-status-card'});
      this.cardCurrent = this.card.createEl('span');
      this.card.createEl('br');
      this.card.createEl('br');
      this.cardNext = this.card.createEl('span');
      this.card.createEl('div', {cls: 'arrow-down'});
    }

}