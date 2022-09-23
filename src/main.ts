import {
  Plugin,
  TAbstractFile,
  Vault,
  WorkspaceLeaf, 
} from 'obsidian';
import type { Editor } from 'codemirror';
import { DayPlannerSettingsTab } from './settings-tab';
import { DayPlannerSettings, DayPlannerMode, NoteForDate, NoteForDateQuery } from './settings';
import StatusBar from './status-bar';
import Progress from './progress';
import PlannerMarkdown from './planner-md';
import DayPlannerFile from './file';
import Parser from './parser';
import { VIEW_TYPE_TIMELINE } from './constants';
import TimelineView from './timeline-view';
import { PlanSummaryData } from './plan-data';
import { appHasDailyNotesPluginLoaded } from 'obsidian-daily-notes-interface';

export default class DayPlanner extends Plugin {
  settings: DayPlannerSettings;
  vault: Vault;
  file: DayPlannerFile;
  plannerMD: PlannerMarkdown;
  statusBar: StatusBar; 
  notesForDatesQuery: NoteForDateQuery;
  timelineView: TimelineView;
  
  async onload() {
    console.log("Loading Day Planner plugin");
    this.vault = this.app.vault;
    this.settings = Object.assign(new DayPlannerSettings(), await this.loadData());
    this.notesForDatesQuery = new NoteForDateQuery();
    this.file = new DayPlannerFile(this.vault, this.settings);
    const progress = new Progress();
    const parser = new Parser(this.settings);
    this.plannerMD = new PlannerMarkdown(this.app.workspace, this.settings, this.file, parser, progress)
    this.statusBar = new StatusBar(
      this.settings,
      this.addStatusBarItem(), 
      this.app.workspace, 
      progress,
      new PlannerMarkdown(this.app.workspace, this.settings, this.file, parser, progress),
      this.file
    );

    this.statusBar.initStatusBar();
    this.registerEvent(this.app.vault.on('modify', this.codeMirror, ''));
    
    this.addCommand({
      id: 'app:add-day-planner-to-note',
      name: 'Add a Day Planner template for today to the current note',
      callback: () => this.modeGuard(async () => await this.insertDayPlannerIntoCurrentNote(true)),
      hotkeys: []
    });

    this.addCommand({
      id: 'app:link-day-planner-to-note',
      name: 'Link today\'s Day Planner to the current note',
      callback: () => this.modeGuard(async () => await this.insertDayPlannerIntoCurrentNote(false)),
      hotkeys: []
    });

    this.addCommand({
      id: 'app:unlink-day-planner-from-note',
      name: 'Unlink today\'s Day Planner from its note',
      callback: () => this.modeGuard(async () => await this.unlinkDayPlanner()),
      hotkeys: []
    });

    this.addCommand({
      id: 'app:show-day-planner-timeline',
      name: 'Show the Day Planner Timeline',
      callback: () => this.initLeaf(),
      hotkeys: []
    });

    this.addCommand({
      id: 'app:show-day-planner-today-note',
      name: 'Show today\'s Day Planner',
      callback: () => this.app.workspace.openLinkText(this.file.todayPlannerFilePath(), '', true),
      hotkeys: []
    });

    this.registerView(
      VIEW_TYPE_TIMELINE,
      (leaf: WorkspaceLeaf) =>
        (this.timelineView = new TimelineView(leaf, this.settings))
    );

    this.addSettingTab(new DayPlannerSettingsTab(this.app, this));
    this.registerInterval(
      window.setInterval(async () => {
        try {
          if(await this.file.hasTodayNote()){
            // console.log('Active note found, starting file processing')
            const planSummary = await this.plannerMD.parseDayPlanner();
            planSummary.calculate();
            await this.statusBar.refreshStatusBar(planSummary)
            await this.plannerMD.updateDayPlannerMarkdown(planSummary)
            this.timelineView && this.timelineView.update(planSummary);
          } else if (this.settings.mode == DayPlannerMode.Daily && appHasDailyNotesPluginLoaded()) {
              // console.log('Clearing status bar & timeline in case daily note was deleted')
              const planSummary = new PlanSummaryData([]);
              await this.statusBar.refreshStatusBar(planSummary)
              this.timelineView && this.timelineView.update(planSummary);
          } else {
            // console.log('No active note, skipping file processing')
          }
        } catch (error) {
            console.log(error)
        }
      }, 2000));
  }

    initLeaf() {
      if (this.app.workspace.getLeavesOfType(VIEW_TYPE_TIMELINE).length > 0) {
        return;
      }
      this.app.workspace.getRightLeaf(true).setViewState({
        type: VIEW_TYPE_TIMELINE,
      });
    }

    modeGuard(command: () => any): void {
      if(this.settings.mode !== DayPlannerMode.Command) {
        new Notification('Day Planner plugin in File mode', {silent: true, body: 'Switch to Command mode in settings to use this command'});
        return;
      } else {
        command();
      }
    }

    async insertDayPlannerIntoCurrentNote(insertTemplate: boolean){
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
          this.settings.notesToDates = [];
          this.settings.notesToDates.push(new NoteForDate(filePath, new Date().toDateString()));
          await this.saveData(this.settings);
        }
        if(insertTemplate) {
          this.plannerMD.insertPlanner();
        }
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
        this.statusBar.hide(this.statusBar.statusBar);
        this.timelineView && this.timelineView.update(new PlanSummaryData([]));
        new Notification('Day Planner reset', 
          {silent: true, body: `The Day Planner for today has been dissociated from ${activePlanner.notePath} and can be added to another note`});
      } catch (error) {
        console.error(error);
      }
    }
    
    codeMirror = (file: TAbstractFile) => {
      if(this.file.hasTodayNote()) {
        // console.log('Active note found, starting CodeMirror monitoring')
        this.plannerMD.checkIsDayPlannerEditing();
      } else {
        // console.log('No active note, skipping CodeMirror monitoring')
      }
    }
    
    onunload() {
      console.log("Unloading Day Planner plugin");
      this.app.workspace
      .getLeavesOfType(VIEW_TYPE_TIMELINE)
      .forEach((leaf) => leaf.detach());
    }
    
  }