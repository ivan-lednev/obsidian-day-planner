<script lang="ts">
  import { range } from "lodash/fp";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { settings } from "../../global-store/settings";
  import { useDataviewSource } from "../hooks/use-dataview-source";

  import Callout from "./callout.svelte";
  import Dropdown from "./obsidian/dropdown.svelte";
  import SettingItem from "./obsidian/setting-item.svelte";

  const { refreshDataviewFn } = getObsidianContext();

  const { errorMessage: dataviewErrorMessage, dataviewSourceInput } =
    useDataviewSource({ refreshDataviewFn });

  const startHourOptions = range(0, 13).map(String);
  const zoomLevelOptions = range(1, 9).map(String);

  function handleStartHourInput(event: Event) {
    // @ts-expect-error
    $settings.startHour = Number(event.currentTarget.value);
  }

  function handleZoomLevelInput(event: Event) {
    // @ts-expect-error
    $settings.zoomLevel = Number(event.currentTarget.value);
  }
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
<div class="settings">
  <SettingItem>
    {#snippet name()}
      Start hour
    {/snippet}
    {#snippet control()}
      <Dropdown
        value={String($settings.startHour)}
        values={startHourOptions}
        on:input={handleStartHourInput}
      />
    {/snippet}
  </SettingItem>

  <SettingItem>
    {#snippet name()}
      Zoom
    {/snippet}
    {#snippet control()}
      <Dropdown
        value={String($settings.zoomLevel)}
        values={zoomLevelOptions}
        on:input={handleZoomLevelInput}
      />
    {/snippet}
  </SettingItem>

  <SettingItem class="mod-toggle">
    {#snippet name()}
      Show timeline
    {/snippet}
    {#snippet control()}
      <div
        class={[
          "checkbox-container",
          "mod-small",
          { "is-enabled": $settings.showTimelineInSidebar },
        ]}
        onclick={() => {
          $settings.showTimelineInSidebar = !$settings.showTimelineInSidebar;
        }}
      >
        <input tabindex="0" type="checkbox" />
      </div>
    {/snippet}
  </SettingItem>

  <SettingItem class="mod-toggle">
    {#snippet name()}
      Auto-scroll to now
    {/snippet}
    {#snippet control()}
      <div
        class={[
          "checkbox-container",
          "mod-small",
          { "is-enabled": $settings.centerNeedle },
        ]}
        onclick={() => {
          $settings.centerNeedle = !$settings.centerNeedle;
        }}
      >
        <input tabindex="0" type="checkbox" />
      </div>
    {/snippet}
  </SettingItem>

  <SettingItem class="mod-toggle">
    {#snippet name()}
      Show completed tasks
    {/snippet}
    {#snippet control()}
      <div
        class={[
          "checkbox-container",
          "mod-small",
          { "is-enabled": $settings.showCompletedTasks },
        ]}
        onclick={() => {
          $settings.showCompletedTasks = !$settings.showCompletedTasks;
        }}
      >
        <input tabindex="0" type="checkbox" />
      </div>
    {/snippet}
  </SettingItem>

  <SettingItem class="mod-toggle">
    {#snippet name()}
      Show full list content
    {/snippet}
    {#snippet control()}
      <div
        class={[
          "checkbox-container",
          "mod-small",
          { "is-enabled": $settings.showSubtasksInTaskBlocks },
        ]}
        onclick={() => {
          settings.update((previous) => ({
            ...previous,
            showSubtasksInTaskBlocks: !previous.showSubtasksInTaskBlocks,
          }));
        }}
      >
        <input tabindex="0" type="checkbox" />
      </div>
    {/snippet}
  </SettingItem>

  <div class="controls-section">Unscheduled tasks</div>

  <SettingItem class="mod-toggle">
    {#snippet name()}
      Show unscheduled tasks
    {/snippet}
    {#snippet control()}
      <div
        class={[
          "checkbox-container",
          "mod-small",
          { "is-enabled": $settings.showUncheduledTasks },
        ]}
        onclick={() => {
          $settings.showUncheduledTasks = !$settings.showUncheduledTasks;
        }}
      >
        <input tabindex="0" type="checkbox" />
      </div>
    {/snippet}
  </SettingItem>

  {#if $settings.showUncheduledTasks}
    <SettingItem class="mod-toggle">
      {#snippet name()}
        Show sub-tasks as blocks
      {/snippet}
      {#snippet control()}
        <div
          class={[
            "checkbox-container",
            "mod-small",
            { "is-enabled": $settings.showUnscheduledNestedTasks },
          ]}
          onclick={() => {
            $settings.showUnscheduledNestedTasks =
              !$settings.showUnscheduledNestedTasks;
          }}
        >
          <input tabindex="0" type="checkbox" />
        </div>
      {/snippet}
    </SettingItem>
  {/if}

  <div class="controls-section">Time tracker</div>

  <SettingItem class="mod-toggle">
    {#snippet name()}
      Show active clocks
    {/snippet}
    {#snippet control()}
      <div
        class={[
          "checkbox-container",
          "mod-small",
          { "is-enabled": $settings.showActiveClocks },
        ]}
        onclick={() => {
          $settings.showActiveClocks = !$settings.showActiveClocks;
        }}
      >
        <input tabindex="0" type="checkbox" />
      </div>
    {/snippet}
  </SettingItem>
</div>

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

  .controls-section {
    margin: var(--size-4-2) 0;
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
  }
</style>
