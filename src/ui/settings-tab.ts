import { produce } from "immer";
import { PluginSettingTab, SettingGroup } from "obsidian";
import { type Component, mount, unmount } from "svelte";
import type { Writable } from "svelte/store";
import { isOneOf } from "typed-assert";

import { icons } from "../constants";
import type DayPlanner from "../main";
import {
  type DayPlannerSettings,
  eventFormats,
  firstDaysOfWeek,
} from "../settings";
import Callout from "../ui/components/callout.svelte";

export class DayPlannerSettingsTab extends PluginSettingTab {
  private warningComponent?: Component;

  constructor(
    private readonly plugin: DayPlanner,
    private readonly settingsStore: Writable<DayPlannerSettings>,
  ) {
    super(plugin.app, plugin);
  }

  display(): void {
    const { containerEl, warningComponent } = this;

    if (warningComponent) {
      unmount(warningComponent);
    }

    containerEl.empty();

    // @ts-expect-error
    this.warningComponent = mount(Callout, {
      props: {
        type: "warning",
        title: "Any change to the settings requires a restart of Obsidian!",
        className: "planner-settings-warning",
      },
      target: containerEl,
    });

    const generalGroup = new SettingGroup(containerEl)
      .addSetting((setting) =>
        setting.setName("Show release notes after update").addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings().releaseNotes)
            .onChange((value: boolean) => {
              this.update({ releaseNotes: value });
            }),
        ),
      )
      .addSetting((setting) =>
        setting
          .setName("Task Notification")
          .setDesc("Display a notification when a new task is started")
          .addToggle((toggle) =>
            toggle
              .setValue(this.plugin.settings().showTaskNotification)
              .onChange((value: boolean) => {
                this.update({ showTaskNotification: value });
              }),
          ),
      )
      .addSetting((setting) =>
        setting
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
          }),
      )
      .addSetting((setting) =>
        setting
          .setName("Sort tasks in planner chronologically after edits")
          .addToggle((component) => {
            component
              .setValue(this.plugin.settings().sortTasksInPlanAfterEdit)
              .onChange((value) => {
                this.update({ sortTasksInPlanAfterEdit: value });
              });
          }),
      )
      .addSetting((setting) =>
        setting.setName("Event format on creation").addDropdown((dropdown) => {
          dropdown.addOptions({
            bullet: `Bullet (- New item)`,
            task: `Task (- [ ] New item)`,
          });
          return dropdown
            .setValue(this.plugin.settings().eventFormatOnCreation)
            .onChange((value) => {
              isOneOf(value, eventFormats);
              this.update({ eventFormatOnCreation: value });
              this.display();
            });
        }),
      )
      .addSetting((setting) =>
        setting
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
          ),
      );

    if (this.plugin.settings().eventFormatOnCreation === "task") {
      generalGroup.addSetting((setting) =>
        setting
          .setName("Default task status on creation")
          .setDesc(
            "You can use custom statuses for more advanced workflows. E.g.: '- [>] Task'",
          )
          .addText((el) =>
            el
              .setPlaceholder("Empty")
              .setValue(this.plugin.settings().taskStatusOnCreation)
              .onChange((value: string) => {
                this.settingsStore.update((previous) => {
                  const newValue =
                    value.length > 0 ? value.substring(0, 1) : " ";

                  return {
                    ...previous,
                    taskStatusOnCreation: newValue,
                  };
                });
              }),
          ),
      );
    }

    generalGroup
      .addSetting((setting) =>
        setting
          .setName("Timeline Icon")
          .setDesc(
            "The icon of the timeline pane. Reopen timeline pane or restart obsidian to see the change.",
          )
          .addDropdown((dropdown) => {
            icons.forEach((icon) => dropdown.addOption(icon, icon));
            return dropdown
              .setValue(
                this.plugin.settings().timelineIcon ??
                  "calendar-with-checkmark",
              )
              .onChange((value: string) => {
                this.update({ timelineIcon: value });
              });
          }),
      )
      .addSetting((setting) =>
        setting
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
          ),
      )
      .addSetting((setting) =>
        setting.setName("First day of week").addDropdown((component) =>
          component
            .addOptions({
              monday: "Monday",
              sunday: "Sunday",
              saturday: "Saturday",
              friday: "Friday",
            })
            .setValue(String(this.plugin.settings().firstDayOfWeek))
            .onChange((value: string) => {
              isOneOf(value, firstDaysOfWeek);

              this.update({ firstDayOfWeek: value });
            }),
        ),
      );

    new SettingGroup(containerEl)
      .setHeading("Remote calendars")
      .addExtraButton((button) =>
        button
          .setIcon("plus")
          .setTooltip("Add remote calendar")
          .onClick(() => {
            const newIcal = {
              name: "",
              email: "",
              url: "",
              color: "#ffffff",
            };

            this.settingsStore.update((previous) => ({
              ...previous,
              icals: [...previous.icals, newIcal],
            }));

            this.display();
          }),
      );

    this.plugin.settings().icals.forEach((ical, index) => {
      new SettingGroup(containerEl)
        .setHeading(`Calendar ${index + 1}`)
        .addSetting((setting) =>
          setting.setName("Mark calendar with color").addColorPicker((el) =>
            el.setValue(ical.color).onChange((value: string) => {
              this.settingsStore.update(
                produce((draft) => {
                  draft.icals[index].color = value;
                }),
              );
            }),
          ),
        )
        .addSetting((setting) =>
          setting
            .setName("Prepend this text to events from this calendar")
            .addText((el) =>
              el
                .setPlaceholder("Displayed name")
                .setValue(ical.name)
                .onChange((value: string) => {
                  this.settingsStore.update(
                    produce((draft) => {
                      draft.icals[index].name = value;
                    }),
                  );
                }),
            ),
        )
        .addSetting((setting) =>
          setting
            .setName(
              "Your email address, used to show 'tentative'/'needs action'/'declined' marker",
            )
            .addText((el) =>
              el
                .setPlaceholder("Your email address")
                .setValue(ical.email || "")
                .onChange((value: string) => {
                  this.settingsStore.update(
                    produce((draft) => {
                      draft.icals[index].email = value.trim();
                    }),
                  );
                }),
            ),
        )
        .addSetting((setting) =>
          setting.setName("Remote calendar URL").addText((el) =>
            el
              .setPlaceholder("URL")
              .setValue(ical.url)
              .onChange((value: string) => {
                const withCorrectProtocol = value.replace(
                  "webcal://",
                  "https://",
                );

                this.settingsStore.update(
                  produce((draft) => {
                    draft.icals[index].url = withCorrectProtocol;
                  }),
                );
              }),
          ),
        )
        .addSetting((setting) =>
          setting.addButton((el) =>
            el
              .setIcon("trash")
              .setButtonText(`Delete calendar ${index + 1}`)
              .onClick(() => {
                this.settingsStore.update((previous) => ({
                  ...previous,
                  icals: previous.icals.filter(
                    (editedIcal, editedIndex) => editedIndex !== index,
                  ),
                }));

                this.display();
              }),
          ),
        );
    });

    new SettingGroup(containerEl)
      .setHeading("Date & Time Formats")
      .addSetting((setting) => {
        setting.setName("Hour format").then((component) => {
          component.setDesc(
            createFragment((fragment) => {
              fragment.appendText(
                "This is the format used in the time ruler. Use 'H' for 24 hours; use 'h' for 12 hours. Your current syntax looks like this: ",
              );
              component.addMomentFormat((momentFormat) =>
                momentFormat
                  .setValue(this.plugin.settings().hourFormat)
                  .setSampleEl(fragment.createSpan())
                  .onChange((value: string) => {
                    this.update({ hourFormat: value.trim() });
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
      })
      .addSetting((setting) => {
        setting.setName("Default timestamp format").then((component) => {
          component.setDesc(
            createFragment((fragment) => {
              fragment.appendText(
                "When you create or edit tasks with drag-and-drop, the plugin use this format. Use 'HH:mm' for 24 hours; use 'hh:mm' for 12 hours. Your current syntax looks like this: ",
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
      })
      .addSetting((setting) => {
        setting.setName("Date Format in Timeline Header").then((component) => {
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
      });

    new SettingGroup(containerEl)
      .setHeading("Planner Heading")
      .addSetting((setting) =>
        setting
          .setName("Planner Heading Text")
          .setDesc(
            createFragment((fragment) => {
              fragment.append(
                createEl("p", {
                  text: "Only the items under this heading (and its subheadings) are going to be pulled from daily notes.",
                }),
                createEl("p", {
                  text: "If left empty, the plugin will pull all items from daily notes.",
                }),
                createEl("p", {
                  text: `Also used when creating a plan with drag-and-drop.`,
                }),
              );
            }),
          )
          .addText((component) =>
            component
              .setValue(this.plugin.settings().plannerHeading)
              .onChange((value) => {
                this.update({ plannerHeading: value });
              }),
          ),
      )
      .addSetting((setting) =>
        setting
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
          ),
      );

    new SettingGroup(containerEl)
      .setHeading("Status bar widget")
      .addSetting((setting) =>
        setting
          .setName("Show active clock and 'Clock in' button")
          .addToggle((toggle) =>
            toggle
              .setValue(this.plugin.settings().showActiveClockInStatusBar)
              .onChange((value: boolean) => {
                this.update({ showActiveClockInStatusBar: value });
              }),
          ),
      )
      .addSetting((setting) =>
        setting.setName("Show active task").addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings().showNow)
            .onChange((value: boolean) => {
              this.update({ showNow: value });
            }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Show upcoming task").addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings().showNext)
            .onChange((value: boolean) => {
              this.update({ showNext: value });
            }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Task progress indicator").addDropdown((component) =>
          component
            .addOptions({
              ["mini-timeline"]: "Mini-timeline",
              bar: "Bar",
              pie: "Pie",
              none: "None",
            })
            .setValue(String(this.plugin.settings().progressIndicator))
            .onChange((value) => {
              this.update({
                progressIndicator:
                  value as DayPlannerSettings["progressIndicator"],
              });
            }),
        ),
      );

    new SettingGroup(containerEl)
      .setHeading("Task decoration")
      .addSetting((setting) =>
        setting
          .setName("Show a timestamp next to task text in timeline")
          .addToggle((component) => {
            component
              .setValue(this.plugin.settings().showTimestampInTaskBlock)
              .onChange((value) => {
                this.update({ showTimestampInTaskBlock: value });
              });
          }),
      );

    new SettingGroup(containerEl)
      .setHeading("Duration")
      .addSetting((setting) =>
        setting
          .setName(
            "Stretch task until next one in timeline if it has no end time",
          )
          .setDesc(
            'By "no end time" we mean "- [ ] 10:00 Wake up" instead of "- [ ] 10:00 - 11:00 Wake up"',
          )
          .addToggle((component) => {
            component
              .setValue(this.plugin.settings().extendDurationUntilNext)
              .onChange((value) => {
                this.update({ extendDurationUntilNext: value });
              });
          }),
      )
      .addSetting((setting) =>
        setting
          .setName("Round time to minutes")
          .setDesc(
            "While editing, tasks are going to get rounded to this number",
          )
          .addSlider((slider) =>
            slider
              .setLimits(5, 20, 5)
              .setValue(this.plugin.settings().snapStepMinutes)
              .setDynamicTooltip()
              .onChange((value: number) => {
                this.update({ snapStepMinutes: value });
              }),
          ),
      )
      .addSetting((setting) =>
        setting
          .setName("Default task duration")
          .setDesc(
            "Used when you create a task with drag-and-drop & when you don't specify an end time",
          )
          .addSlider((slider) =>
            slider
              .setLimits(20, 120, 10)
              .setValue(Number(this.plugin.settings().defaultDurationMinutes))
              .setDynamicTooltip()
              .onChange((value: number) => {
                this.update({ defaultDurationMinutes: value });
              }),
          ),
      )
      .addSetting((setting) =>
        setting
          .setName("Minimal task duration")
          .setDesc("Used when you create a task with drag-and-drop")
          .addSlider((slider) =>
            slider
              .setLimits(5, 15, 5)
              .setValue(Number(this.plugin.settings().minimalDurationMinutes))
              .setDynamicTooltip()
              .onChange((value: number) => {
                this.update({ minimalDurationMinutes: value });
              }),
          ),
      );

    const colorBlockingGroup = new SettingGroup(containerEl)
      .setHeading("Color overrides")
      .addExtraButton((button) =>
        button
          .setIcon("plus")
          .setTooltip("Add color override")
          .onClick(() => {
            const newOverride = {
              text: "#important",
              darkModeColor: "#6e3737",
              color: "#ffa1a1",
            };

            this.settingsStore.update((previous) => ({
              ...previous,
              colorOverrides: [...previous.colorOverrides, newOverride],
            }));

            this.display();
          }),
      );

    this.plugin.settings().colorOverrides.forEach((colorOverride, index) => {
      colorBlockingGroup.addSetting((setting) =>
        setting
          .setName(`Color ${index + 1}`)
          .setDesc(
            index === 0
              ? "Define a background color for a block containing some text (it might be a tag, like '#important'). The first color is for light mode, the second is for dark mode."
              : "",
          )
          .addColorPicker((el) =>
            el.setValue(colorOverride.color).onChange((value: string) => {
              this.settingsStore.update(
                produce((draft) => {
                  draft.colorOverrides[index].color = value;
                }),
              );
            }),
          )
          .addColorPicker((el) =>
            el
              .setValue(colorOverride.darkModeColor)
              .onChange((value: string) => {
                this.settingsStore.update(
                  produce((draft) => {
                    draft.colorOverrides[index].darkModeColor = value;
                  }),
                );
              }),
          )
          .addText((el) =>
            el
              .setPlaceholder("Text")
              .setValue(colorOverride.text)
              .onChange((value: string) => {
                this.settingsStore.update((previous) => ({
                  ...previous,
                  colorOverrides: previous.colorOverrides.map(
                    (editedOverride, editedIndex) =>
                      editedIndex === index
                        ? { ...editedOverride, text: value }
                        : editedOverride,
                  ),
                }));
              }),
          )
          .addExtraButton((el) =>
            el
              .setIcon("trash")
              .setTooltip("Delete color override")
              .onClick(() => {
                this.settingsStore.update((previous) => ({
                  ...previous,
                  colorOverrides: previous.colorOverrides.filter(
                    (editedOverride, editedIndex) => editedIndex !== index,
                  ),
                }));

                this.display();
              }),
          ),
      );
    });

    new SettingGroup(containerEl)
      .setHeading("Colorful Timeline")
      .addSetting((setting) =>
        setting
          .setName("Enable Colorful Timeline")
          .setDesc(
            "If the planner timeline should be monochrome or color tasks based on time of day",
          )
          .addToggle((component) => {
            component
              .setValue(this.plugin.settings().timelineColored)
              .onChange((value) => {
                this.update({ timelineColored: value });
              });
          }),
      )
      .addSetting((setting) =>
        setting
          .setName("Colorful Timeline - Start Color")
          .addColorPicker((component) => {
            component
              .setValue(this.plugin.settings().timelineStartColor)
              .onChange((value) => {
                this.update({ timelineStartColor: value });
              });
          }),
      )
      .addSetting((setting) =>
        setting
          .setName("Colorful Timeline - End Color")
          .addColorPicker((component) => {
            component
              .setValue(this.plugin.settings().timelineEndColor)
              .onChange((value) => {
                this.update({ timelineEndColor: value });
              });
          }),
      );
  }

  private update(patch: Partial<DayPlannerSettings>) {
    this.settingsStore.update((previous) => ({ ...previous, ...patch }));
  }
}
