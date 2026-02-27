<script lang="ts">
  import { range } from "lodash/fp";
  import { SettingGroup } from "obsidian";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { useDataviewSource } from "../hooks/use-dataview-source";

  import Callout from "./callout.svelte";

  const { refreshDataviewFn, settings } = getObsidianContext();

  const { errorMessage: dataviewErrorMessage, dataviewSourceInput } =
    useDataviewSource({ refreshDataviewFn });

  const startHourOptions = Object.fromEntries(
    range(0, 13).map((it) => [it, String(it)]),
  );
  const zoomLevelOptions = Object.fromEntries(
    range(1, 9)
      .map(String)
      .map((it) => [it, String(it)]),
  );
</script>

<div class="dataview-source">
  <input
    placeholder={`-#archived and -"notes/personal"`}
    spellcheck="false"
    type="text"
    bind:value={$dataviewSourceInput}
  />

  {#if $dataviewErrorMessage.length > 0}
    <Callout type="error">
      <pre class="error-message">{$dataviewErrorMessage}</pre>
    </Callout>
  {/if}

  <Callout type="info">
    <a
      href="https://blacksmithgu.github.io/obsidian-dataview/reference/sources/"
      >Filter syntax reference</a
    >
  </Callout>
</div>

<div
  class="settings"
  style:--setting-items-padding="12px"
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

    new SettingGroup(el).setHeading("Time tracker").addSetting((setting) =>
      setting.setName("Show active clocks").addToggle((toggle) =>
        toggle.setValue($settings.showActiveClocks).onChange((value) => {
          $settings = {
            ...$settings,
            showActiveClocks: value,
          };
        }),
      ),
    );

    return () => {
      el.empty();
    };
  }}
></div>

<style>
  .dataview-source {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-2);

    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }

  .dataview-source input {
    font-family: var(--font-monospace);
  }

  .error-message {
    overflow-x: auto;

    margin-block: 0;
    padding: var(--size-4-1);

    border: 1px solid var(--text-error);
    border-radius: var(--radius-s);
  }
</style>
