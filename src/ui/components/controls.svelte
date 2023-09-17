<script lang="ts">
  import { HelpCircle } from "lucide-svelte";
  import type { Moment } from "moment";
  import { DEFAULT_DAILY_NOTE_FORMAT } from "obsidian-daily-notes-interface";

  import { settings } from "../../global-stores/settings";
  import { visibleDayInTimeline } from "../../global-stores/visible-day-in-timeline";
  import { createDailyNoteIfNeeded } from "../../util/daily-notes";
  import type { ObsidianFacade } from "../../util/obsidian-facade";

  import ControlButton from "./control-button.svelte";
  import ArrowLeftIcon from "./icons/arrow-left.svelte";
  import ArrowRightIcon from "./icons/arrow-right.svelte";
  import GoToFileIcon from "./icons/go-to-file.svelte";
  import SettingsIcon from "./icons/settings.svelte";

  export let day: Moment;
  export let obsidianFacade: ObsidianFacade;

  let settingsVisible = false;
  let helpVisible = false;

  function toggleSettings() {
    settingsVisible = !settingsVisible;
  }

  function toggleHelp() {
    helpVisible = !helpVisible;
  }

  // todo: hide these in class

  async function goBack() {
    const previousDay = $visibleDayInTimeline.clone().subtract(1, "day");

    const previousNote = await createDailyNoteIfNeeded(previousDay);

    // todo: replace
    await obsidianFacade.openFileInEditor(previousNote);

    $visibleDayInTimeline = previousDay;
  }

  async function goForward() {
    const nextDay = $visibleDayInTimeline.clone().add(1, "day");

    const nextNote = await createDailyNoteIfNeeded(nextDay);

    await obsidianFacade.openFileInEditor(nextNote);

    $visibleDayInTimeline = nextDay;
  }

  async function goToToday() {
    const noteForToday = await createDailyNoteIfNeeded(window.moment());

    await obsidianFacade.openFileInEditor(noteForToday);
  }
</script>

<!-- todo: this is big enough to deserve its own component -->
<div class="controls">
  <div class="header">
    <ControlButton label="Open today's daily note" on:click={goToToday}>
      <GoToFileIcon />
    </ControlButton>

    <ControlButton
      --grid-column-start="3"
      --justify-self="flex-end"
      label="Go to previous daily plan"
      on:click={goBack}
    >
      <ArrowLeftIcon />
    </ControlButton>

    <ControlButton
      label="Go to file"
      on:click={async () => {
        const note = await createDailyNoteIfNeeded(day);
        await obsidianFacade.openFileInEditor(note);
      }}
    >
      <span class="date">{day.format(DEFAULT_DAILY_NOTE_FORMAT)}</span>
    </ControlButton>

    <ControlButton
      --justify-self="flex-start"
      label="Go to next daily plan"
      on:click={goForward}
    >
      <ArrowRightIcon />
    </ControlButton>

    <ControlButton isActive={helpVisible} label="Help" on:click={toggleHelp}>
      <HelpCircle class="svg-icon" />
    </ControlButton>
    <ControlButton
      isActive={settingsVisible}
      label="Settings"
      on:click={toggleSettings}
    >
      <SettingsIcon />
    </ControlButton>
  </div>
  <!--  TODO: unify formats for text-->
  {#if helpVisible}
    <p class="help-item"><strong>Advanced editing:</strong></p>
    <p class="help-item">Hold <strong>Shift</strong> and drag to copy</p>
    <p class="help-item">
      Hold <strong>Control</strong> and drag/resize to push neighboring tasks
    </p>
  {/if}
  {#if settingsVisible}
    <div class="settings">
      <div class="setting-item">
        <div class="setting-item-info">
          <div class="setting-item-name">Zoom</div>
        </div>
        <div class="setting-item-control">
          <select class="dropdown" bind:value={$settings.zoomLevel}>
            {#each ["1", "2", "3", "4"] as level}
              <option value={level}>{level}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="setting-item mod-toggle">
        <div class="setting-item-info">
          <div class="setting-item-name">Auto-scroll to now</div>
        </div>
        <div class="setting-item-control">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="checkbox-container mod-small"
            class:is-enabled={$settings.centerNeedle}
            on:click={() => {
              $settings.centerNeedle = !$settings.centerNeedle;
            }}
          >
            <input tabindex="0" type="checkbox" />
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .help-item {
    margin: var(--size-2-3) var(--size-4-4);
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }

  .date {
    display: flex;
    align-items: center;
    justify-content: center;

    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-normal);
  }

  .settings {
    margin: var(--size-4-1) var(--size-4-4);
  }

  .setting-item {
    padding: var(--size-2-3) 0;
    border: none;
  }

  .setting-item-name {
    font-size: var(--font-ui-small);
  }

  .controls {
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .header {
    display: grid;
    grid-template-columns: repeat(2, var(--size-4-8)) repeat(3, 1fr) repeat(
        2,
        var(--size-4-8)
      );

    margin: var(--size-4-2);
  }
</style>
