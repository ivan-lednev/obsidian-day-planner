import {
  MarkdownView,
  Plugin,
  Vault, 
  DataAdapter, 
  TFile,
  EventRef
} from 'obsidian';
import MomentDateRegex from './moment-date-regex';
import moment, { Duration, min } from 'moment';
import { Editor, EditorChangeLinkedList } from 'codemirror';
import { DayPlannerSettingsTab } from './settings-tab';
import { DayPlannerSettings } from './settings';
import { DAY_PLANNER_DEFAULT_CONTENT, DAY_PLANNER_FILENAME, PLAN_ITEM_REGEX } from './constants';
import Parser, { PlanItem, PlanSummaryData } from './parser';
import { timeStamp } from 'console';

export default class DayPlanner extends Plugin {
  settings: DayPlannerSettings;
  momentDateRegex: MomentDateRegex;
  parser: Parser;
  vault: Vault;
  statusBar: HTMLElement
  statusBarAdded: boolean;
  statusBarText: HTMLSpanElement;
  statusBarProgress: HTMLDivElement;
  statusBarCurrentProgress: HTMLDivElement;
  
  
  
  onInit() {}
  
  async onload() {
    console.log("Loading Day Planner plugin");
    this.settings = (await this.loadData()) || new DayPlannerSettings();
    this.vault = this.app.vault;
    this.statusBar = this.addStatusBarItem()
    this.momentDateRegex = new MomentDateRegex();
    this.parser = new Parser(this.app.vault);
    
    this.linkToDayPlanBlock();
    // this.registerEvent(this.app.on("codemirror", this.codeMirror));
    
    this.addSettingTab(new DayPlannerSettingsTab(this.app, this));
    this.parseDayPlanner();
    
    this.registerInterval(
      window.setInterval(async () => await this.refreshStatusBar(), 2000));

    this.registerInterval(
      window.setInterval(async () => this.updateDayPlannerMarkdown(await this.parseDayPlanner()), 30000));

      this.refreshStatusBar();
      this.updateDayPlannerMarkdown(await this.parseDayPlanner());
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

    async updateDayPlannerMarkdown(planSummary: PlanSummaryData) {
      const fileName = this.momentDateRegex.replace(DAY_PLANNER_FILENAME);

      let dayPlannerContents = await this.vault.adapter.read(fileName)
      planSummary.calculate();
      if(planSummary.empty){
        return;
      }
      dayPlannerContents = this.current(planSummary.current, dayPlannerContents);
      dayPlannerContents = this.past(planSummary.past, dayPlannerContents);
      await this.vault.adapter.write(fileName, dayPlannerContents);
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
    
    current(item: PlanItem, plannerText: string): string {
      plannerText = plannerText.replace(/((---\n*)(## Current Task\n*)?)*/g, '');
      if(!item) {
        return plannerText;
      }
      const replacementItem = `---\n## Current Task\n${item.raw}\n---`;
      plannerText = plannerText.replace(item.raw, replacementItem);
      return plannerText;
    }

    updateProgress(current: PlanItem, next: PlanItem) {
      if(current.isEnd){
        this.progressBar(100, '0', current);
        return;
      }
      const now = new Date();
      now.setSeconds(0);
      const nowMoment = moment(now);
      const currentMoment = moment(current.time);
      const nextMoment = moment(next.time);
      const diff = moment.duration(nextMoment.diff(currentMoment));
      const fromStart = moment.duration(nowMoment.diff(currentMoment));
      const untilNext = moment.duration(nextMoment.diff(nowMoment));
      let percentageComplete = (fromStart.asMinutes()/diff.asMinutes())*100;
      const minsUntilNext = (untilNext.asMinutes() + 1).toFixed(0);
      this.progressBar(percentageComplete, minsUntilNext, current);
    }
    
    progressBar(percentageComplete: number, minsUntilNext:string, current: PlanItem) {
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
      const minsText = `${minsUntilNext} min${minsUntilNext === '1' ? '' : 's'}`;
      return (current.isBreak ? `Break for ${minsText}` : `${minsText} left`);
    }
    
    async parseDayPlanner():Promise<PlanSummaryData> {
      const fileName = this.momentDateRegex.replace(DAY_PLANNER_FILENAME);
      if(!await this.vault.adapter.exists(fileName, false)){
        await this.vault.create(fileName, DAY_PLANNER_DEFAULT_CONTENT);   
      }
      const fileContent = await this.vault.adapter.read(fileName);
      const planData = await this.parser.parseMarkdown(fileContent);
      return planData;
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
        const fileName = this.momentDateRegex.replace(DAY_PLANNER_FILENAME);
        await this.vault.create(fileName, DAY_PLANNER_DEFAULT_CONTENT);      
        this.app.workspace.openLinkText(fileName, '', false);
      });
      
      this.statusBarAdded = true;
    }
    
    // codeMirror = (cm: Editor) => {
    //   cm.on('changes', async () => {
    //     console.log('CM Changes');
    //     window.setTimeout(async () => {

    //     }, 30000);
    //   });
    // }
    
    onunload() {
      console.log("Unloading Day Planner plugin");
    }
    
  }