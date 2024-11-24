<script lang="ts">
  import { type Moment } from "moment";
  import { Menu } from "obsidian";
  import { get } from "svelte/store";
  import { slide } from "svelte/transition";

  import { getDateRangeContext } from "../../../context/date-range-context";
  import { getObsidianContext } from "../../../context/obsidian-context";
  import { isToday } from "../../../global-store/current-time";
  import { getVisibleHours } from "../../../global-store/derived-settings";
  import { isOnWeekend } from "../../../util/moment";
  import {
    getNextAdjacentRange,
    getNextWorkWeek,
    getPreviousAdjacentRange,
    getPreviousWorkWeek,
  } from "../../../util/range";
  import * as r from "../../../util/range";
  import Search from "../../components/search.svelte";
  import ControlButton from "../control-button.svelte";
  import { createSlide } from "../defaults";
  import {
    Settings,
    ChevronLeft,
    ChevronRight,
    CalendarArrowUp,
    Columns3,
    Search as SearchIcon,
  } from "../lucide";
  import ResizeHandle from "../resize-handle.svelte";
  import ResizeableBox from "../resizeable-box.svelte";
  import Ruler from "../ruler.svelte";
  import Scroller from "../scroller.svelte";
  import SettingsControls from "../settings-controls.svelte";
  import Timeline from "../timeline.svelte";
  import UnscheduledTaskContainer from "../unscheduled-task-container.svelte";

  const { workspaceFacade, settings } = getObsidianContext();
  const dateRange = getDateRangeContext();

  type SideControls = "none" | "settings" | "search";

  let visibleSideControls = $state<SideControls>("none");

  function toggleSideControls(toggledControls: SideControls) {
    visibleSideControls =
      visibleSideControls === toggledControls ? "none" : toggledControls;
  }

  function handleColumnChange(event: MouseEvent) {
    const currentMode = get(settings).multiDayRange;
    const menu = new Menu();

    menu.addItem((item) =>
      item
        .setTitle("Full week")
        .setChecked(currentMode === "full-week")
        .onClick(() => {
          settings.update((previous) => ({
            ...previous,
            multiDayRange: "full-week",
          }));
        }),
    );
    menu.addItem((item) => {
      item
        .setTitle("Work week")
        .setChecked(currentMode === "work-week")
        .onClick(() => {
          settings.update((previous) => ({
            ...previous,
            multiDayRange: "work-week",
          }));
        });
    });
    menu.addItem((item) => {
      item
        .setTitle("3 days")
        .setChecked(currentMode === "3-days")
        .onClick(() => {
          settings.update((previous) => ({
            ...previous,
            multiDayRange: "3-days",
          }));
        });
    });

    menu.showAtMouseEvent(event);
  }

  function getColumnBackgroundColor(day: Moment) {
    return isOnWeekend(day) ? "var(--background-primary)" : "";
  }

  let headerRef: HTMLDivElement | undefined;

  function handleScroll(event: Event) {
    if (headerRef && event.target instanceof Element) {
      headerRef.scrollLeft = event.target.scrollLeft;
    }
  }
</script>

<div
  bind:this={headerRef}
  style:--timeline-internal-column-count={$settings.showTimeTracker ? 2 : 1}
  class="header"
>
  <div class="header-row day-buttons">
    <div class="corner"></div>
    {#each $dateRange as day}
      <div class="header-cell" class:today={$isToday(day)}>
        <ControlButton
          --color={$isToday(day) ? "white" : "var(--icon-color)"}
          label="Open note for day"
          onclick={async () => await workspaceFacade.openFileForDay(day)}
        >
          {day.format($settings.timelineDateFormat)}
        </ControlButton>
      </div>
    {/each}
  </div>

  <ResizeableBox className="header-row">
    {#snippet children(startEdit)}
      <div class="corner"></div>
      {#each $dateRange as day}
        <div class="header-cell">
          <UnscheduledTaskContainer {day} />
        </div>
      {/each}
      <ResizeHandle on:mousedown={startEdit} />
    {/snippet}
  </ResizeableBox>
</div>

<div class="controls-sidebar">
  <ControlButton
    isActive={visibleSideControls === "search"}
    onclick={() => toggleSideControls("search")}
  >
    <SearchIcon />
  </ControlButton>

  <ControlButton
    isActive={visibleSideControls === "settings"}
    onclick={() => toggleSideControls("settings")}
  >
    <Settings />
  </ControlButton>

  <ControlButton label="Change columns" onclick={handleColumnChange}>
    <Columns3 />
  </ControlButton>

  <ControlButton
    label="Show current period"
    onclick={() => {
      dateRange.set(
        r.createRange($settings.multiDayRange, $settings.firstDayOfWeek),
      );
    }}
  >
    <CalendarArrowUp />
  </ControlButton>

  <ControlButton
    label="Show next period"
    onclick={() => {
      dateRange.update(
        $settings.multiDayRange === "work-week"
          ? ([firstDay]) => getNextWorkWeek(firstDay)
          : getNextAdjacentRange,
      );
    }}
  >
    <ChevronRight />
  </ControlButton>

  <ControlButton
    label="Show previous period"
    onclick={() => {
      dateRange.update(
        $settings.multiDayRange === "work-week"
          ? ([firstDay]) => getPreviousWorkWeek(firstDay)
          : getPreviousAdjacentRange,
      );
    }}
  >
    <ChevronLeft />
  </ControlButton>
</div>

{#if visibleSideControls !== "none"}
  <div
    class="side-controls-container"
    transition:slide={createSlide({ axis: "x" })}
  >
    {#if visibleSideControls === "settings"}
      <SettingsControls />
    {/if}
    {#if visibleSideControls === "search"}
      <Search />
    {/if}
  </div>
{/if}

<Scroller className="multiday-main-content" on:scroll={handleScroll}>
  <Ruler
    --ruler-box-shadow="var(--shadow-right)"
    visibleHours={getVisibleHours($settings)}
  />
  {#each $dateRange as day}
    <Timeline
      --column-background-color={getColumnBackgroundColor(day)}
      {day}
      isUnderCursor={true}
    />
  {/each}
</Scroller>

<style>
  :global(.header-row) {
    position: relative;
    display: flex;
  }

  .day-buttons {
    font-size: var(--font-ui-small);
  }

  .controls-sidebar {
    display: flex;
    grid-column: 2;
    grid-row: 1 / 3;
    flex-direction: column;
    gap: var(--size-4-2);

    padding: var(--size-4-2) var(--size-4-1);

    border-left: 1px solid var(--background-modifier-border);
  }

  :global(.multiday-main-content) {
    grid-row: 2;
  }

  .corner {
    position: sticky;
    z-index: 100;
    top: 0;
    left: 0;

    flex: 0 0 var(--time-ruler-width);

    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-top: none;
    border-left: none;
  }

  .header {
    --cell-flex-basis: calc(
      var(--timeline-flex-basis) * var(--timeline-internal-column-count, 1)
    );

    position: relative;
    z-index: 1000;

    overflow-x: hidden;
    display: flex;
    flex-direction: column;

    box-shadow: var(--shadow-bottom);
  }

  .header-cell {
    overflow-x: hidden;
    flex: 1 0 var(--cell-flex-basis);

    width: var(--cell-flex-basis);

    background-color: var(--background-primary);
    border-right: 1px solid var(--background-modifier-border);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .header-cell:last-of-type {
    flex: 1 0 calc(var(--cell-flex-basis) + var(--scrollbar-width));
    border-right: none;
  }

  .today {
    color: white;
    background-color: var(--color-accent);
  }

  .weekend {
    background-color: var(--background-primary);
  }

  .side-controls-container {
    grid-column: 3;
    grid-row: span 2;
    width: min(320px, 50vw);
    border-left: 1px solid var(--background-modifier-border);
  }
</style>
