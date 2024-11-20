<script lang="ts">
  import { range } from "lodash/fp";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { settings } from "../../global-store/settings";
  import { useDataviewSource } from "../hooks/use-dataview-source";

  import Callout from "./callout.svelte";
  import Dropdown from "./obsidian/dropdown.svelte";
  import SettingItem from "./obsidian/setting-item.svelte";

  const { refreshTasks } = getObsidianContext();

  const {
    sourceIsEmpty,
    errorMessage: dataviewErrorMessage,
    dataviewSourceInput,
  } = useDataviewSource({ refreshTasks });

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
  Include additional files, folders and tags with a Dataview source:
  <input
    placeholder={`-#archived and -"notes/personal"`}
    spellcheck="false"
    type="text"
    bind:value={$dataviewSourceInput}
  />

  {#if $sourceIsEmpty}
    <Callout type="warning"
      >Tasks are pulled only from daily notes
      {#if $settings.plannerHeading}
        under planner heading: "{$settings.plannerHeading}"
      {/if}
    </Callout>
  {/if}

  {#if $dataviewErrorMessage.length > 0}
    <Callout type="error">
      <pre class="error-message">{$dataviewErrorMessage}</pre>
    </Callout>
  {/if}

  <Callout type="info">
    <a
      href="https://blacksmithgu.github.io/obsidian-dataview/reference/sources/"
      >Dataview source reference</a
    >
  </Callout>
</div>
<div class="settings">
  <SettingItem>
    <svelte:fragment slot="name">Start hour</svelte:fragment>
    <Dropdown
      slot="control"
      value={String($settings.startHour)}
      values={startHourOptions}
      on:input={handleStartHourInput}
    />
  </SettingItem>

  <SettingItem>
    <svelte:fragment slot="name">Zoom</svelte:fragment>
    <Dropdown
      slot="control"
      value={String($settings.zoomLevel)}
      values={zoomLevelOptions}
      on:input={handleZoomLevelInput}
    />
  </SettingItem>
  <SettingItem>
    <svelte:fragment slot="name">Auto-scroll to now</svelte:fragment>
    <div
      slot="control"
      class="checkbox-container mod-small"
      class:is-enabled={$settings.centerNeedle}
      onclick={() => {
        $settings.centerNeedle = !$settings.centerNeedle;
      }}
    >
      <input tabindex="0" type="checkbox" />
    </div>
  </SettingItem>

  <SettingItem>
    <svelte:fragment slot="name">Show completed tasks</svelte:fragment>
    <div
      slot="control"
      class="checkbox-container mod-small"
      class:is-enabled={$settings.showCompletedTasks}
      onclick={() => {
        $settings.showCompletedTasks = !$settings.showCompletedTasks;
      }}
    >
      <input tabindex="0" type="checkbox" />
    </div>
  </SettingItem>

  <SettingItem>
    <svelte:fragment slot="name">Show subtasks in task blocks</svelte:fragment>
    <div
      slot="control"
      class="checkbox-container mod-small"
      class:is-enabled={$settings.showSubtasksInTaskBlocks}
      onclick={() => {
        // We create a new object to trigger immediate update in the timeline view
        settings.update((previous) => ({
          ...previous,
          showSubtasksInTaskBlocks: !previous.showSubtasksInTaskBlocks,
        }));
      }}
    >
      <input tabindex="0" type="checkbox" />
    </div>
  </SettingItem>

  <div class="controls-section">Unscheduled tasks</div>

  <SettingItem>
    <svelte:fragment slot="name">Show unscheduled tasks</svelte:fragment>
    <div
      slot="control"
      class="checkbox-container mod-small"
      class:is-enabled={$settings.showUncheduledTasks}
      onclick={() => {
        $settings.showUncheduledTasks = !$settings.showUncheduledTasks;
      }}
    >
      <input tabindex="0" type="checkbox" />
    </div>
  </SettingItem>

  {#if $settings.showUncheduledTasks}
    <SettingItem>
      <svelte:fragment slot="name"
        >Show unscheduled sub-tasks as separate blocks
      </svelte:fragment>
      <div
        slot="control"
        class="checkbox-container mod-small"
        class:is-enabled={$settings.showUnscheduledNestedTasks}
        onclick={() => {
          $settings.showUnscheduledNestedTasks =
            !$settings.showUnscheduledNestedTasks;
        }}
      >
        <input tabindex="0" type="checkbox" />
      </div>
    </SettingItem>
  {/if}

  <div class="controls-section">Time tracker</div>

  <SettingItem>
    <svelte:fragment slot="name">Show time tracker</svelte:fragment>
    <div
      slot="control"
      class="checkbox-container mod-small"
      class:is-enabled={$settings.showTimeTracker}
      onclick={() => {
        $settings.showTimeTracker = !$settings.showTimeTracker;
      }}
    >
      <input tabindex="0" type="checkbox" />
    </div>
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

  .settings,
  .dataview-source {
    margin-inline: var(--size-4-3);
  }
</style>
