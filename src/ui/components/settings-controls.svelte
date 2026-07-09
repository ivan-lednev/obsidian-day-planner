<script lang="ts">
  import { range } from "lodash/fp";
  import { SettingGroup } from "obsidian";

  import { getObsidianContext } from "../../context/obsidian-context";

  const { settings } = getObsidianContext();

  const startHourOptions = Object.fromEntries(
    range(0, 13).map((it) => [it, String(it)]),
  );
  const zoomLevelOptions = Object.fromEntries(
    range(1, 9)
      .map(String)
      .map((it) => [it, String(it)]),
  );
</script>

<div
  class="settings"
  {@attach (el: HTMLDivElement) => {
    el.empty();

    new SettingGroup(el)
      .addSetting((setting) =>
        setting.setName("Start hour").addDropdown((dropdown) =>
          dropdown
            .addOptions(startHourOptions)
            .setValue(String($settings.startHour))
            .onChange((value) => {
              $settings = {
                ...$settings,
                startHour: Number(value),
              };
            }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Zoom").addDropdown((dropdown) =>
          dropdown
            .addOptions(zoomLevelOptions)
            .setValue(String($settings.zoomLevel))
            .onChange((value) => {
              $settings = {
                ...$settings,
                zoomLevel: Number(value),
              };
            }),
        ),
      );

    new SettingGroup(el)
      .setHeading("Timeline")
      .addSetting((setting) =>
        setting.setName("Show timeline").addToggle((toggle) =>
          toggle.setValue($settings.showTimelineInSidebar).onChange((value) => {
            $settings = {
              ...$settings,
              showTimelineInSidebar: value,
            };
          }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Auto-scroll to now").addToggle((toggle) =>
          toggle.setValue($settings.centerNeedle).onChange((value) => {
            $settings = {
              ...$settings,
              centerNeedle: value,
            };
          }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Show completed tasks").addToggle((toggle) =>
          toggle.setValue($settings.showCompletedTasks).onChange((value) => {
            $settings = {
              ...$settings,
              showCompletedTasks: value,
            };
          }),
        ),
      )
      .addSetting((setting) =>
        setting.setName("Show full list content").addToggle((toggle) =>
          toggle
            .setValue($settings.showSubtasksInTaskBlocks)
            .onChange((value) => {
              $settings = {
                ...$settings,
                showSubtasksInTaskBlocks: value,
              };
            }),
        ),
      );

    const allDayEventsGroup = new SettingGroup(el)
      .setHeading("All day events")
      .addSetting((setting) =>
        setting.setName("Show all day events").addToggle((toggle) =>
          toggle.setValue($settings.showUncheduledTasks).onChange((value) => {
            $settings = {
              ...$settings,
              showUncheduledTasks: value,
            };
          }),
        ),
      );

    if ($settings.showUncheduledTasks) {
      allDayEventsGroup.addSetting((setting) =>
        setting.setName("Show sub-tasks as blocks").addToggle((toggle) =>
          toggle
            .setValue($settings.showUnscheduledNestedTasks)
            .onChange((value) => {
              $settings = {
                ...$settings,
                showUnscheduledNestedTasks: value,
              };
            }),
        ),
      );
    }

    return () => {
      el.empty();
    };
  }}
></div>

<style>
  .settings {
    --planner-timeline-settings-font-size: var(--nav-item-size);
    --setting-items-padding: var(--size-4-2);
    --setting-group-heading-size: var(--planner-timeline-settings-font-size);
  }

  .settings :global(.setting-group .setting-item) {
    padding: var(--size-4-2) var(--size-4-4);
  }

  .settings :global(.setting-group .setting-item-heading) {
    padding: 0 var(--size-4-2);
  }

  .settings :global(.setting-group + .setting-group) {
    margin-top: var(--size-4-4);
  }

  .settings :global(.setting-item-name) {
    font-size: var(--planner-timeline-settings-font-size);
  }
</style>
