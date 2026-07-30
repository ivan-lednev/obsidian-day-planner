import { Array } from "effect";
import { App, Modal, SettingGroup } from "obsidian";
import { get, type Writable } from "svelte/store";

import type { DayPlannerSettings } from "../settings";

const startHourOptions = Object.fromEntries(
  Array.range(0, 12).map((it) => [it, String(it)]),
);
const zoomLevelOptions = Object.fromEntries(
  Array.range(1, 8)
    .map(String)
    .map((it) => [it, String(it)]),
);

export function createTimelineSettingsModalOpener(
  app: App,
  settingsStore: Writable<DayPlannerSettings>,
) {
  const current = () => get(settingsStore);

  return () => {
    const modal = new Modal(app).setTitle("Timeline settings");
    const { contentEl } = modal;

    new SettingGroup(contentEl)
      .addSetting((setting) =>
        setting.setName("Start hour").addDropdown((dropdown) =>
          dropdown
            .addOptions(startHourOptions)
            .setValue(String(current().startHour))
            .onChange((value) => {
              settingsStore.update((previous) => ({
                ...previous,
                startHour: Number(value),
              }));
            }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Zoom").addDropdown((dropdown) =>
          dropdown
            .addOptions(zoomLevelOptions)
            .setValue(String(current().zoomLevel))
            .onChange((value) => {
              settingsStore.update((previous) => ({
                ...previous,
                zoomLevel: Number(value),
              }));
            }),
        ),
      );

    new SettingGroup(contentEl)
      .setHeading("Timeline")
      .addSetting((setting) =>
        setting.setName("Auto-scroll to now").addToggle((toggle) =>
          toggle.setValue(current().centerNeedle).onChange((value) => {
            settingsStore.update((previous) => ({
              ...previous,
              centerNeedle: value,
            }));
          }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Show completed tasks").addToggle((toggle) =>
          toggle.setValue(current().showCompletedTasks).onChange((value) => {
            settingsStore.update((previous) => ({
              ...previous,
              showCompletedTasks: value,
            }));
          }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Show full list content").addToggle((toggle) =>
          toggle
            .setValue(current().showSubtasksInTaskBlocks)
            .onChange((value) => {
              settingsStore.update((previous) => ({
                ...previous,
                showSubtasksInTaskBlocks: value,
              }));
            }),
        ),
      );

    // todo: use this setting
    new SettingGroup(contentEl)
      .setHeading("All day events")
      .addSetting((setting) =>
        setting.setName("Show sub-tasks as blocks").addToggle((toggle) =>
          toggle
            .setValue(current().showUnscheduledNestedTasks)
            .onChange((value) => {
              settingsStore.update((previous) => ({
                ...previous,
                showUnscheduledNestedTasks: value,
              }));
            }),
        ),
      );

    contentEl.createDiv("modal-button-container", (buttonsEl) => {
      buttonsEl
        .createEl("button", { cls: "mod-cta", text: "Close" })
        .addEventListener("click", () => {
          modal.close();
        });
    });

    modal.onClose = () => {
      contentEl.empty();
    };

    modal.open();
  };
}

export type OpenTimelineSettingsModal = ReturnType<
  typeof createTimelineSettingsModalOpener
>;
