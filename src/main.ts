import { Plugin, TAbstractFile, Vault, WorkspaceLeaf } from "obsidian";
import { DayPlannerSettingsTab } from "./settings-tab";
import {
  DayPlannerSettings,
  DayPlannerMode,
  NoteForDateQuery,
} from "./settings";
import StatusBar from "./status-bar";
import Progress from "./progress";
import PlannerMarkdown from "./planner-md";
import DayPlannerFile from "./file";
import Parser from "./parser";
import { VIEW_TYPE_TIMELINE } from "./constants";
import TimelineView from "./ui/timeline-view";
import { PlanSummaryData } from "./plan-data";
import { appHasDailyNotesPluginLoaded } from "obsidian-daily-notes-interface";

export default class DayPlanner extends Plugin {
  settings: DayPlannerSettings;
  vault: Vault;
  file: DayPlannerFile;
  plannerMD: PlannerMarkdown;
  statusBar: StatusBar;
  notesForDatesQuery: NoteForDateQuery;
  timelineView: TimelineView;

  async onload() {
    this.vault = this.app.vault;
    this.settings = Object.assign(
      new DayPlannerSettings(),
      await this.loadData(),
    );
    this.notesForDatesQuery = new NoteForDateQuery();
    this.file = new DayPlannerFile(this.vault, this.settings);
    const progress = new Progress();
    const parser = new Parser(this.settings);
    this.plannerMD = new PlannerMarkdown(
      this.app.workspace,
      this.settings,
      this.file,
      parser,
      progress,
    );
    this.statusBar = new StatusBar(
      this.settings,
      this.addStatusBarItem(),
      this.app.workspace,
      progress,
      new PlannerMarkdown(
        this.app.workspace,
        this.settings,
        this.file,
        parser,
        progress,
      ),
      this.file,
    );

    this.statusBar.initStatusBar();
    // todo: trigger on metadataCacheUpdate
    this.registerEvent(this.app.vault.on("modify", this.codeMirror, ""));

    this.addCommand({
      id: "show-day-planner-timeline",
      name: "Show the Day Planner Timeline",
      callback: async () => await this.initLeaf(),
      hotkeys: [],
    });

    this.addCommand({
      id: "show-day-planner-today-note",
      name: "Open today's Day Planner",
      callback: () =>
        this.app.workspace.openLinkText(
          this.file.getTodayPlannerFilePath(),
          "",
          true,
        ),
      hotkeys: [],
    });

    this.registerView(
      VIEW_TYPE_TIMELINE,
      (leaf: WorkspaceLeaf) =>
        (this.timelineView = new TimelineView(leaf, this.settings, this)),
    );

    this.addSettingTab(new DayPlannerSettingsTab(this.app, this));
    this.registerInterval(
      // todo: most of it should not be updated with a timer
      window.setInterval(async () => {
        if (await this.file.hasTodayNote()) {
          const planSummary = await this.plannerMD.parseDayPlanner();
          planSummary.calculate();
          await this.statusBar.refreshStatusBar(planSummary);
          await this.plannerMD.updateDayPlannerMarkdown(planSummary);
          this.timelineView && this.timelineView.update(planSummary);
        } else if (
          this.settings.mode == DayPlannerMode.DAILY &&
          appHasDailyNotesPluginLoaded()
        ) {
          const planSummary = new PlanSummaryData([]);
          await this.statusBar.refreshStatusBar(planSummary);
          this.timelineView && this.timelineView.update(planSummary);
        } else {
          // console.log('No active note, skipping file processing')
        }
      }, 2000),
    );
  }

  async initLeaf() {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_TIMELINE).length > 0) {
      return;
    }
    await this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_TIMELINE,
      active: true,
    });
  }

  codeMirror = (file: TAbstractFile) => {
    if (this.file.hasTodayNote()) {
      // console.log('Active note found, starting CodeMirror monitoring')
      this.plannerMD.checkIsDayPlannerEditing();
    } else {
      // console.log('No active note, skipping CodeMirror monitoring')
    }
  };

  onunload() {
    console.log("Unloading Day Planner plugin");
    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_TIMELINE)
      .forEach((leaf) => leaf.detach());
  }
}
