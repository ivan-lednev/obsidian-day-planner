import {
    App,
    PluginSettingTab,
    Setting
} from 'obsidian';
import { TimeZone } from './settings';
import MomentDateRegex from './moment-date-regex';
import DayPlanner from './main';
  
  export class DayPlannerSettingsTab extends PluginSettingTab {
    momentDateRegex = new MomentDateRegex();
    plugin: DayPlanner;
    constructor(app: App, plugin: DayPlanner) {
      super(app, plugin);
      this.plugin = plugin;
  }
  
    display(): void {
      const { containerEl } = this;
  
      containerEl.empty();
  
      new Setting(containerEl)
        .setName('Default location for new notes')
        .setDesc('Where newly created notes are placed. Plugin settings will override this.')
        .addDropdown(dropDown => 
          dropDown
            .addOption(TimeZone[TimeZone.GMT], "Time zone")
            .setValue(TimeZone[this.plugin.settings.timeZone] || TimeZone.GMT.toString())
            .onChange((value:string) => {
              this.plugin.settings.timeZone = TimeZone[value as keyof typeof TimeZone];
              this.plugin.saveData(this.plugin.settings);
              this.display();
            }));

      
    }
  }