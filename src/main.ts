import {
  MarkdownView,
  Plugin,
  Vault, 
  DataAdapter, 
  TFile,
  EventRef
} from 'obsidian';
import MomentDateRegex from './moment-date-regex';
import DPFile from './file';
import moment, { Duration, min } from 'moment';
import { Editor, EditorChangeLinkedList } from 'codemirror';
import { DayPlannerSettingsTab } from './settings-tab';
import { DayPlannerSettings } from './settings';
import { CURRENT_ITEM_PROGRESS_REGEX, CURRENT_ITEM_REGEX, DAY_PLANNER_DEFAULT_CONTENT, DAY_PLANNER_FILENAME, PLAN_ITEM_REGEX } from './constants';
import Parser, { PlanItem, PlanSummaryData } from './parser';
import { timeStamp } from 'console';

export default class DayPlanner extends Plugin {
  settings: DayPlannerSettings;
  momentDateRegex: MomentDateRegex;
  file: DPFile;
  parser: Parser;
  vault: Vault;
  statusBar: HTMLElement
  statusBarAdded: boolean;
  statusBarText: HTMLSpanElement;
  statusBarProgress: HTMLDivElement;
  statusBarCurrentProgress: HTMLDivElement;
  dayPlannerLastEdit: number;
  
  
  
  onInit() {}
  
  async onload() {
    console.log("Loading Day Planner plugin");
    this.settings = (await this.loadData()) || new DayPlannerSettings();
    this.vault = this.app.vault;
    this.statusBar = this.addStatusBarItem()
    this.momentDateRegex = new MomentDateRegex();
    this.file = new DPFile();
    this.parser = new Parser(this.app.vault);
    
    this.linkToDayPlanBlock();
    this.registerEvent(this.app.on("codemirror", this.codeMirror));
    
    this.addSettingTab(new DayPlannerSettingsTab(this.app, this));
    this.parseDayPlanner();
    
    this.registerInterval(
      window.setInterval(async () => {
        await this.refreshStatusBar()
        this.updateDayPlannerMarkdown(await this.parseDayPlanner())
      }, 2000));
    }
    
    async refreshStatusBar() {
      const planSummary = await this.parseDayPlanner();
      planSummary.calculate();
      if(!planSummary.empty && !planSummary.invalid){
        const current = planSummary.current;
        if(current){
          this.updateProgress(planSummary.current, planSummary.next);
        }
      }
    }

    todayPlannerFileName():string {
      return this.file.normalizePath(this.momentDateRegex.replace(DAY_PLANNER_FILENAME));
    }

    async updateDayPlannerMarkdown(planSummary: PlanSummaryData) {
      if((this.dayPlannerLastEdit + 6000) > new Date().getTime()) {
        console.log('Skipping markdown rewrite');
        console.log(this.dayPlannerLastEdit, new Date().getTime());
        return;
      }
      let dayPlannerContents = await this.vault.adapter.read(this.todayPlannerFileName())
      planSummary.calculate();
      if(planSummary.empty){
        return;
      }
      dayPlannerContents = this.current(planSummary, dayPlannerContents);
      dayPlannerContents = this.past(planSummary.past, dayPlannerContents);
      await this.vault.adapter.write(this.todayPlannerFileName(), dayPlannerContents);
    }

    past(pastItems: PlanItem[], plannerText: string): string {
      if(!pastItems || pastItems.length === 0){
        return plannerText;
      }
      pastItems.forEach(item => {
        const replacementItem = item.raw.replace(PLAN_ITEM_REGEX, 
          `[x] ${item.rawTime}`);
        plannerText = plannerText.replace(item.raw, replacementItem);
      });
      return plannerText;
    }
    
    current(planSummary: PlanSummaryData, plannerText: string): string {
      plannerText = plannerText.replace(CURRENT_ITEM_REGEX, '');
      plannerText = plannerText.replace(CURRENT_ITEM_PROGRESS_REGEX, '');
      if(!planSummary.current) {
        return plannerText;
      }
      const replacementItem = this.currentItemText(planSummary);
      plannerText = plannerText.replace(planSummary.current.raw, replacementItem);
      return plannerText;
    }

    currentItemText(planSummary:PlanSummaryData): string{
      const current = planSummary.current;
      const next = planSummary.next;

      const progressMarkdown = `||${current.rawTime}||${this.progressMarkdown(current, next)}||${next.rawTime}||`;
      let replacementItem = `---\n## Current Task\n${current.raw}\n\n${progressMarkdown}\n\n---`;      
      return replacementItem;
    }

    private progressMarkdown(current: PlanItem, next: PlanItem) {
      const { percentageComplete, minsUntilNext } = this.getProgress(current, next);
      const completeCount = Math.floor(30*(percentageComplete/100));
      return new Array(completeCount).join('->') + new Array(30-completeCount).join('_ ');
    }

    private updateProgress(current: PlanItem, next: PlanItem) {
      if(current.isEnd){
        this.progressBar(100, '0', current);
        return;
      }
      const { percentageComplete, minsUntilNext } = this.getProgress(current, next);
      this.progressBar(percentageComplete, minsUntilNext, current);
    }
    
    private getProgress(current: PlanItem, next: PlanItem) {
      const now = new Date();
      const nowMoment = moment(now);
      const currentMoment = moment(current.time);
      const nextMoment = moment(next.time);
      const diff = moment.duration(nextMoment.diff(currentMoment));
      const fromStart = moment.duration(nowMoment.diff(currentMoment));
      const untilNext = moment.duration(nextMoment.diff(nowMoment));
      let percentageComplete = (fromStart.asMinutes() / diff.asMinutes()) * 100;
      const minsUntilNext = untilNext.asMinutes().toFixed(0);
      return { percentageComplete, minsUntilNext };
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
    
    async parseDayPlanner():Promise<PlanSummaryData> {
      const fileName = this.todayPlannerFileName();
      await this.createFileIfNotExists(fileName);
      const fileContent = await this.vault.adapter.read(fileName);
      const planData = await this.parser.parseMarkdown(fileContent);
      return planData;
    }
    
    private async createFileIfNotExists(fileName: string) {
      if (!await this.vault.adapter.exists(fileName, false)) {
        await this.vault.create(fileName, DAY_PLANNER_DEFAULT_CONTENT);
      }
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
        const fileName = this.todayPlannerFileName();
        await this.createFileIfNotExists(fileName);
        this.app.workspace.openLinkText(fileName, '', false);
      });
      
      this.statusBarAdded = true;
    }
    
    codeMirror = (cm: Editor) => {
      cm.on('changes', async () => {
        this.checkIsDayPlannerEditing();
      });
    }

    checkIsDayPlannerEditing(){
      const activeLeaf = this.app.workspace.activeLeaf;
      if(!activeLeaf){
        return;
      }
      const viewState = this.app.workspace.activeLeaf.view.getState();
      if(viewState.file === this.todayPlannerFileName()){
        this.dayPlannerLastEdit = new Date().getTime();
      };
    }
    
    onunload() {
      console.log("Unloading Day Planner plugin");
    }
    
  }