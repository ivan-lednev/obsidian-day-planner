import { App, PluginSettingTab, Setting } from "obsidian";
import type DayPlanner from "../main";
import { ICONS } from "../constants";
import { settings } from "src/store/settings";

export class DayPlannerSettingsTab extends PluginSettingTab {
  plugin: DayPlanner;

  constructor(app: App, plugin: DayPlanner) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Status Bar - Circular Progress")
      .setDesc("Display a circular progress bar in the status bar")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.circularProgress)
          .onChange((value: boolean) => {
            this.plugin.settings.circularProgress = value;
            this.plugin.saveData(this.plugin.settings);
          }),
      );

    new Setting(containerEl)
      .setName("Status Bar - Now and Next")
      .setDesc("Display now and next tasks in the status bar")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.nowAndNextInStatusBar)
          .onChange((value: boolean) => {
            this.plugin.settings.nowAndNextInStatusBar = value;
            this.plugin.saveData(this.plugin.settings);
          }),
      );

    new Setting(containerEl)
      .setName("Task Notification")
      .setDesc("Display a notification when a new task is started")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTaskNotification)
          .onChange((value: boolean) => {
            this.plugin.settings.showTaskNotification = value;
            this.plugin.saveData(this.plugin.settings);
          }),
      );

    new Setting(containerEl)
      .setName("Timeline Zoom Level")
      .setDesc(
        "The zoom level to display the timeline. The higher the number, the more vertical space each task will take up.",
      )
      .addSlider((slider) =>
        slider
          .setLimits(1, 5, 1)
          .setValue(Number(this.plugin.settings.zoomLevel) ?? 4)
          .setDynamicTooltip()
          .onChange(async (value: number) => {
            settings.update((settings) => ({ ...settings, zoomLevel: value }));

            this.plugin.settings.zoomLevel = value;
            await this.plugin.saveData(this.plugin.settings);
          }),
      );

    new Setting(containerEl)
      .setName("Timeline Icon")
      .setDesc(
        "The icon of the timeline pane. Reopen timeline pane or restart obsidian to see the change.",
      )
      .addDropdown((dropdown) => {
        ICONS.forEach((icon) => dropdown.addOption(icon, icon));
        return dropdown
          .setValue(
            this.plugin.settings.timelineIcon ?? "calendar-with-checkmark",
          )
          .onChange((value: string) => {
            this.plugin.settings.timelineIcon = value;
            this.plugin.saveData(this.plugin.settings);
          });
      });

    new Setting(containerEl)
      .setName("Start Hour")
      .setDesc("The planner is going to start at this hour each day")
      .addDropdown((component) =>
        component
          .addOptions({
            "0": "0",
            "1": "1",
            "2": "2",
            "3": "3",
            "4": "4",
            "5": "5",
            "6": "6",
            "7": "7",
            "8": "8",
            "9": "9",
            "10": "10",
            "11": "11",
            "12": "12",
          })
          .setValue(String(this.plugin.settings.startHour))
          .onChange(async (value: string) => {
            const asNumber = Number(value);

            settings.update((previous) => ({
              ...previous,
              startHour: asNumber,
            }));

            this.plugin.settings.startHour = asNumber;
            await this.plugin.saveData(this.plugin.settings);
          }),
      );

    new Setting(containerEl)
      .setName("Date Format in Timeline Header")
      .then((component) => {
        component.setDesc(
          createFragment((fragment) => {
            fragment.appendText("Your current syntax looks like this: ");
            component.addMomentFormat((momentFormat) =>
              momentFormat
                .setValue(this.plugin.settings.timelineDateFormat)
                .setSampleEl(fragment.createSpan())
                .onChange(async (value: string) => {
                  settings.update((previous) => ({
                    ...previous,
                    timelineDateFormat: value,
                  }));

                  this.plugin.settings.timelineDateFormat = value;
                  await this.plugin.saveData(this.plugin.settings);
                }),
            );
            fragment.append(
              createEl("br"),
              createEl(
                "a",
                {
                  text: "format reference",
                  href: "https://momentjs.com/docs/#/displaying/format/",
                },
                (a) => {
                  a.setAttr("target", "_blank");
                },
              ),
            );
          }),
        );
      });

    new Setting(containerEl)
      .setName("Center the Pointer in the Timeline View")
      .setDesc(
        "Should the pointer continuously get scrolled to the center of the view",
      )
      .addToggle((component) => {
        component
          .setValue(this.plugin.settings.centerNeedle)
          .onChange(async (value) => {
            settings.update((previous) => ({
              ...previous,
              centerNeedle: value,
            }));

            this.plugin.settings.centerNeedle = value;
            await this.plugin.saveData(this.plugin.settings);
          });
      });

    new Setting(containerEl)
      .setName("Planner Heading")
      .setDesc(
        `When you create a planner, this text is going to be in the heading.
When you open a file, the plugin will search for this heading to detect a day plan`,
      )
      .addText((component) =>
        component
          .setValue(this.plugin.settings.plannerHeading)
          .onChange(async (value) => {
            settings.update((previous) => ({
              ...previous,
              plannerHeading: value,
            }));

            this.plugin.settings.plannerHeading = value;
            await this.plugin.saveData(this.plugin.settings);
          }),
      );

    new Setting(containerEl)
      .setName("Planner heading level")
      .setDesc(
        "When you create a planner in a file, this level of heading is going to be used",
      )
      .addSlider((component) =>
        component
          .setLimits(1, 6, 1)
          .setDynamicTooltip()
          .setValue(this.plugin.settings.plannerHeadingLevel)
          .onChange(async (value) => {
            settings.update((previous) => ({
              ...previous,
              plannerHeadingLevel: value,
            }));

            this.plugin.settings.plannerHeadingLevel = value;
            await this.plugin.saveData(this.plugin.settings);
          }),
      );
  }

  private modeDescriptionContent(): DocumentFragment {
    const descEl = document.createDocumentFragment();
    descEl.appendText("Choose between 3 modes to use the Day Planner plugin:");
    descEl.appendChild(document.createElement("br"));
    descEl
      .appendChild(document.createElement("strong"))
      .appendText("File mode");
    descEl.appendChild(document.createElement("br"));
    descEl.appendText(
      "Plugin automatically generates day planner notes for each day within a Day Planners folder.",
    );
    descEl.appendChild(document.createElement("br"));
    descEl
      .appendChild(document.createElement("strong"))
      .appendText("Command mode");
    descEl.appendChild(document.createElement("br"));
    descEl.appendText(
      "Command used to insert a Day Planner for today within the current note.",
    );
    descEl.appendChild(document.createElement("br"));
    descEl
      .appendChild(document.createElement("strong"))
      .appendText("Daily mode");
    descEl.appendChild(document.createElement("br"));
    descEl.appendText(
      "Plugin automatically links to the current daily note. Daily notes plugin must be enabled.",
    );
    descEl.appendChild(document.createElement("br"));
    this.addDocsLink(descEl);
    return descEl;
  }

  private addDocsLink(descEl: DocumentFragment) {
    const a = document.createElement("a");
    a.href =
      "https://github.com/lynchjames/obsidian-day-planner/blob/main/README.md";
    a.text = "plugin README";
    a.target = "_blank";
    descEl.appendChild(a);
    descEl.appendChild(document.createElement("br"));
  }
}
