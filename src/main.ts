import {
  MarkdownView,
  Plugin,
  Vault, 
  DataAdapter, 
  TFile,
  EventRef
} from 'obsidian';
import MomentDateRegex from './moment-date-regex';
import moment from 'moment';
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
    // this.registerEvent(this.app.workspace.on('file-open', this.parseDayPlanner));
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
      if(!current || !next){
        return;
      }
      const nowMoment = moment(new Date());
      const currentMoment = moment(current.time);
      const nextMoment = moment(next.time);
      const diff = moment.duration(nextMoment.diff(currentMoment));
      const fromStart = moment.duration(nowMoment.diff(currentMoment));
      const fromNext = moment.duration(nextMoment.diff(nowMoment));
      let percentageComplete = (fromStart.asMinutes()/diff.asMinutes())*100;
      console.log(fromStart.asMinutes(), fromNext.asMinutes(), diff.asMinutes(), percentageComplete);
      this.statusBarCurrentProgress.style.width = `${percentageComplete.toFixed(0)}%`;
      this.statusBarText.innerText = `${fromNext.asMinutes().toFixed(0)} mins left`;
    }
  
    async parseDayPlanner():Promise<PlanSummaryData> {
      const fileContent = await this.vault.adapter.read(DAY_PLANNER_FILENAME);
      const planData = await this.parser.parseMarkdown(fileContent);
      console.log('Current Task', planData.current());
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
      this.statusBarCurrentProgress = this.statusBarProgress.createEl('div', { cls: 'day-planner-progress-value'});
      status.onClickEvent((ev: any) => {
        this.app.workspace.openLinkText('Day Planner', '', false);
      });

      this.statusBarAdded = true;
    }

    codeMirror = (cm: any) => {
      console.log(cm);
    }

    onunload() {
      console.log("Unloading Day Planner plugin");
    }

}