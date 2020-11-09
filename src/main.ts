import {
  Plugin,
  Vault, 
} from 'obsidian';
import { Editor } from 'codemirror';
import { DayPlannerSettingsTab } from './settings-tab';
import { DayPlannerSettings, DayPlannerMode, NoteForDate, NoteForDateQuery } from './settings';
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
  notesForDatesQuery: NoteForDateQuery;
  
  
  onInit() {}
  
  async onload() {
    console.log("Loading Day Planner plugin");
    this.vault = this.app.vault;
    this.settings = (await this.loadData()) || new DayPlannerSettings();
    this.notesForDatesQuery = new NoteForDateQuery();
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
    
    this.addCommand({
      id: 'app:add-day-planner-to-note',
      name: 'Add a Day Planner for today to the current note',
      callback: () => this.modeGuard(async () => await this.insertDayPlannerIntoCurrentNote()),
      hotkeys: []
    });

    this.addCommand({
      id: 'app:unlink-day-planner-from-note',
      name: 'Unlink today\'s Day Planner from its note',
      callback: () => this.modeGuard(async () => await this.unlinkDayPlanner()),
      hotkeys: []
    });

    this.addSettingTab(new DayPlannerSettingsTab(this.app, this));
    this.registerInterval(
      window.setInterval(async () => {
        try {            
          if(this.file.hasTodayNote()){
            // console.log('Active note found, starting file processing')
            await this.statusBar.refreshStatusBar()
            await this.plannerMD.updateDayPlannerMarkdown(await this.plannerMD.parseDayPlanner())
          } else{
            // console.log('No active note, skipping file processing')
          }
        } catch (error) {
            console.log(error)
        }
      }, 2000));
    }

    modeGuard(command: () => any): void {
      if(this.settings.mode !== DayPlannerMode.Command) {
        new Notification('Day Planner plugin in File mode', {silent: true, body: 'Switch to Command mode in settings to use this command'});
        return;
      } else {
        command();
      }
    }

    async insertDayPlannerIntoCurrentNote(){
      try {
        if(!this.settings.notesToDates){
          this.settings.notesToDates = [];
          this.saveData(this.settings)
        }
        
        const view = this.app.workspace.activeLeaf.view;
        const filePath = view.getState().file;
        const dayPlannerExists = this.notesForDatesQuery.exists(this.settings.notesToDates);
        const activeDayPlannerPath = this.notesForDatesQuery.active(this.settings.notesToDates)?.notePath;
        
        if(dayPlannerExists && activeDayPlannerPath !== filePath){
          new Notification('Day Planner exists', {silent: true, body: `A Day Planner for today already exists in ${activeDayPlannerPath}`});
          return;
        }
        if(!dayPlannerExists){
          this.settings.notesToDates.push(new NoteForDate(filePath, new Date().toDateString()));
          await this.saveData(this.settings);
        }
        this.plannerMD.insertPlanner();
      } catch (error) {
        console.error(error);
      }
    }

    async unlinkDayPlanner() {
      try {
        const activePlanner = this.notesForDatesQuery.active(this.settings.notesToDates);
        this.settings.notesToDates.remove(activePlanner);
        await this.saveData(this.settings);
        await this.loadData();
        this.statusBar.hide();
        new Notification('Day Planner reset', 
          {silent: true, body: `The Day Planner for today has been dissociated from ${activePlanner.notePath} and can be added to another note`});
      } catch (error) {
        console.error(error);
      }
    }
    
    codeMirror = (cm: Editor) => {
      cm.on('change', async () => {
        if(this.file.hasTodayNote()) {
          // console.log('Active note found, starting CodeMirror monitoring')
          this.plannerMD.checkIsDayPlannerEditing();
        } else {
          // console.log('No active note, skipping CodeMirror monitoring')
        }
      });
    }
    
    onunload() {
      console.log("Unloading Day Planner plugin");
    }
    
  }