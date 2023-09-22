import { PluginSettingTab, Setting } from "obsidian";
import type { Writable } from "svelte/store";

import { icons } from "../constants";
import type DayPlanner from "../main";
import type { DayPlannerSettings } from "../settings";

export class DayPlannerSettingsTab extends PluginSettingTab {
  constructor(
    private readonly plugin: DayPlanner,
    private readonly settingsStore: Writable<DayPlannerSettings>,
  ) {
    super(plugin.app, plugin);
  }

  private update(patch: Partial<DayPlannerSettings>) {
    this.settingsStore.update((previous) => ({ ...previous, ...patch }));
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Status Bar - Circular Progress")
      .setDesc("Display a circular progress bar in the status bar")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings().circularProgress)
          .onChange((value: boolean) => {
            this.update({ circularProgress: value });
          }),
      );

    new Setting(containerEl)
      .setName("Status Bar - Now and Next")
      .setDesc("Display now and next tasks in the status bar")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings().nowAndNextInStatusBar)
          .onChange((value: boolean) => {
            this.update({
              nowAndNextInStatusBar: value,
            });
          }),
      );

    new Setting(containerEl)
      .setName("Task Notification")
      .setDesc("Display a notification when a new task is started")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings().showTaskNotification)
          .onChange((value: boolean) => {
            this.update({ showTaskNotification: value });
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
          .setValue(Number(this.plugin.settings().zoomLevel) ?? 4)
          .setDynamicTooltip()
          .onChange((value: number) => {
            this.update({ zoomLevel: value });
          }),
      );

    new Setting(containerEl)
      .setName("Timeline Icon")
      .setDesc(
        "The icon of the timeline pane. Reopen timeline pane or restart obsidian to see the change.",
      )
      .addDropdown((dropdown) => {
        icons.forEach((icon) => dropdown.addOption(icon, icon));
        return dropdown
          .setValue(
            this.plugin.settings().timelineIcon ?? "calendar-with-checkmark",
          )
          .onChange((value: string) => {
            this.update({ timelineIcon: value });
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
          .setValue(String(this.plugin.settings().startHour))
          .onChange((value: string) => {
            const asNumber = Number(value);

            this.update({ startHour: asNumber });
          }),
      );

    new Setting(containerEl)
      .setName("Default timestamp format")
      .then((component) => {
        component.setDesc(
          createFragment((fragment) => {
            fragment.appendText(
              "When you create or edit tasks with drag-and-drop, the plugin use this format. Your current syntax looks like this: ",
            );
            component.addMomentFormat((momentFormat) =>
              momentFormat
                .setValue(this.plugin.settings().timestampFormat)
                .setSampleEl(fragment.createSpan())
                .onChange((value: string) => {
                  this.update({ timestampFormat: value.trim() });
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
      .setName("Date Format in Timeline Header")
      .then((component) => {
        component.setDesc(
          createFragment((fragment) => {
            fragment.appendText("Your current syntax looks like this: ");
            component.addMomentFormat((momentFormat) =>
              momentFormat
                .setValue(this.plugin.settings().timelineDateFormat)
                .setSampleEl(fragment.createSpan())
                .onChange((value: string) => {
                  this.update({ timelineDateFormat: value });
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
          .setValue(this.plugin.settings().centerNeedle)
          .onChange((value) => {
            this.update({ centerNeedle: value });
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
          .setValue(this.plugin.settings().plannerHeading)
          .onChange((value) => {
            this.update({ plannerHeading: value });
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
          .setValue(this.plugin.settings().plannerHeadingLevel)
          .onChange((value) => {
            this.update({ plannerHeadingLevel: value });
          }),
      );

    new Setting(containerEl)
      .setName("Colorful Timeline")
      .setDesc(
        "If the planner timeline should be monochrome or color tasks based on time of day",
      )
      .addToggle((component) => {
        component
          .setValue(this.plugin.settings().timelineColored)
          .onChange((value) => {
            this.update({ timelineColored: value });
          });
      });

    new Setting(containerEl)
      .setName("Colorful Timeline - Start Color")
      .addColorPicker((component) => {
        component
          .setValue(this.plugin.settings().timelineStartColor)
          .onChange((value) => {
            this.update({ timelineStartColor: value });
          });
      });

    new Setting(containerEl)
      .setName("Colorful Timeline - End Color")
      .addColorPicker((component) => {
        component
          .setValue(this.plugin.settings().timelineEndColor)
          .onChange((value) => {
            this.update({ timelineEndColor: value });
          });
      });
  }
}
