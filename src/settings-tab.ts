import {
    App,
    PluginSettingTab,
    Setting
} from 'obsidian';
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
        .setName('Day planner notes folder')
        .setDesc('Day planner notes will appear under this folder.')
        .addTextArea((text) =>
            text
                .setPlaceholder("Example: Day Planners")
                .setValue(this.plugin.settings.customFolder)
                .onChange((value) => {
                    this.plugin.settings.customFolder = value;
                    this.plugin.saveData(this.plugin.settings);
              })
        );
    }

    close() {
      this.plugin.file.createFolderIfNotExists(this.plugin.settings.customFolder);
    }

  }