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
import { DAY_PLANNER_FILENAME } from './constants';
import Parser, { PlanItem, PlanSummaryData } from './parser';

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
    this.registerEvent(this.app.on("codemirror", this.codeMirror));
    
    this.addSettingTab(new DayPlannerSettingsTab(this.app, this));
    this.parseDayPlanner();
    
    this.registerInterval(
      window.setInterval(() => this.refreshStatusBar(), 2500)
      );
    }
    
    async refreshStatusBar() {
      const planSummary = await this.parseDayPlanner();
      const current = planSummary.current();
      this.updateProgress(current.current, current.next);
    }
    
    updateProgress(current: PlanItem, next: PlanItem) {
      if(current.isEnd){
        this.progressBar(100, '0', current);
        return;
      }
      const nowMoment = moment(new Date());
      const currentMoment = moment(current.time);
      const nextMoment = moment(next.time);
      const diff = moment.duration(nextMoment.diff(currentMoment));
      const fromStart = moment.duration(nowMoment.diff(currentMoment));
      const untilNext = moment.duration(nextMoment.diff(nowMoment));
      let percentageComplete = (fromStart.asMinutes()/diff.asMinutes())*100;
      const minsUntilNext = untilNext.asMinutes().toFixed(0);
      this.progressBar(percentageComplete, minsUntilNext, current);
    }
    
    progressBar(percentageComplete: number, minsUntilNext:string, current: PlanItem) {
      console.log(percentageComplete);
      if(current.isBreak){
        this.statusBarCurrentProgress.addClass('green');
        this.statusBarProgress.style.display = 'block';
      } else if(current.isEnd) {
        this.statusBarProgress.style.display = 'none';
      } else {
        this.statusBarCurrentProgress.removeClass('green');
        this.statusBarProgress.style.display = 'block';
      }
      this.statusBarCurrentProgress.style.width = `${percentageComplete.toFixed(0)}%`;
      this.statusBarText.innerText = this.statusText(minsUntilNext, current);
    }
    
    private statusText(minsUntilNext: string, current: PlanItem): string{
      if(current.isEnd){
        return 'ALL DONE!'
      }
      const minsText = `${minsUntilNext} mins`;
      return current.isBreak ? `Break for ${minsText}` : `${minsText} left`;
    }
    
    async parseDayPlanner():Promise<PlanSummaryData> {
      const fileContent = await this.vault.adapter.read(DAY_PLANNER_FILENAME);
      const planData = await this.parser.parseMarkdown(fileContent);
      return planData;
    }
    
    linkToDayPlanBlock() {
      if(this.statusBarAdded) {
        return;
      }
      let minutes = new Date().getMinutes();
      let left = 60 - minutes;
      // let statusBarContent = new Array(count + 1).join('=');
      let status = this.statusBar.createEl('div', { cls: 'day-planner', 'title': 'View the Day Planner', prepend: true});
      this.statusBarText = status.createEl('span', { cls: ['status-bar-item-segment', 'day-planner-status-bar-text']});
      this.statusBarProgress = status.createEl('div', { cls: ['status-bar-item-segment', 'day-planner-progress-bar']});
      this.statusBarProgress.style.display = 'none';
      this.statusBarCurrentProgress = this.statusBarProgress.createEl('div', { cls: 'day-planner-progress-value'});
      status.onClickEvent((ev: any) => {
        this.app.workspace.openLinkText('Day Planner', '', false);
      });
      
      this.statusBarAdded = true;
    }
    
    updateDayPlannerMarkdown(instance: Editor, changes: EditorChangeLinkedList[]) {

    }
    
    codeMirror = (cm: Editor) => {
      cm.on('changes', this.updateDayPlannerMarkdown)
    }
    
    onunload() {
      console.log("Unloading Day Planner plugin");
    }
    
  }