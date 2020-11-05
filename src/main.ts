import {
  Plugin,
  Vault, 
} from 'obsidian';
import { Editor } from 'codemirror';
import { DayPlannerSettingsTab } from './settings-tab';
import DayPlannerSettings from './settings';
import StatusBar from './status-bar';
import Progress from './progress';
import PlannerMarkdown from './planner-md';
import DayPlannerFile from './file';
import Parser from './parser';

export default class DayPlanner extends Plugin {
  settings: DayPlannerSettings;
  vault: Vault;
  file: DayPlannerFile;
  plannerMD: PlannerMarkdown;
  statusBar: StatusBar; 
  
  
  onInit() {}
  
  async onload() {
    console.log("Loading Day Planner plugin");
    this.vault = this.app.vault;
    this.settings = (await this.loadData()) || new DayPlannerSettings();
    this.file = new DayPlannerFile(this.vault, this.settings);
    const progress = new Progress();
    const parser = new Parser(this.vault);
    this.plannerMD = new PlannerMarkdown(this.app.workspace, this.settings, this.file, parser, progress)
    this.statusBar = new StatusBar(
      this.addStatusBarItem(), 
      this.app.workspace, 
      progress,
      new PlannerMarkdown(this.app.workspace, this.settings, this.file, parser, progress),
      this.file
    );

    this.statusBar.linkToDayPlanBlock();
    this.registerEvent(this.app.on("codemirror", this.codeMirror));
    
    this.addSettingTab(new DayPlannerSettingsTab(this.app, this));
    this.registerInterval(
      window.setInterval(async () => {
        try {            
          if(this.file.hasTodayNote()){
            console.log('Active note found, starting file processing')
            await this.statusBar.refreshStatusBar()
            await this.plannerMD.updateDayPlannerMarkdown(await this.plannerMD.parseDayPlanner())
          } else{
            console.log('No active note, skipping file processing')
          }
        } catch (error) {
            console.log(error)
        }
      }, 2000));
    }
    
    codeMirror = (cm: Editor) => {
      cm.on('changes', async () => {
        if(this.file.hasTodayNote()) {
          console.log('Active note found, starting CodeMirror monitoring')
          this.plannerMD.checkIsDayPlannerEditing();
        } else {
          console.log('No active note, skipping CodeMirror monitoring')
        }
      });
    }
    
    onunload() {
      console.log("Unloading Day Planner plugin");
    }
    
  }