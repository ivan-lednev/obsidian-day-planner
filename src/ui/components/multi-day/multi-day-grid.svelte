<script lang="ts">
  import { type Moment } from "moment";
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
  import { createResizeState } from "../../actions/create-resize-state";
  import { createColumnChangeMenu } from "../../column-change-menu";
  import Search from "../../components/search.svelte";
  import ControlButton from "../control-button.svelte";
  import { createSlide } from "../defaults";
  import {
    Settings,
    ChevronLeft,
    ChevronRight,
    CalendarArrowUp,
    Columns3,
    GripHorizontal,
    Search as SearchIcon,
  } from "../lucide";
  import Ruler from "../ruler.svelte";
  import Scroller from "../scroller.svelte";
  import SettingsControls from "../settings-controls.svelte";
  import Timeline from "../timeline.svelte";

  import ColumnTracksOverlay from "./column-tracks-overlay.svelte";
  import MultiDayRow from "./multi-day-row.svelte";

  const { workspaceFacade, settings } = getObsidianContext();
  const dateRange = getDateRangeContext();

  type SideControls = "none" | "settings" | "search";

  let visibleSideControls = $state<SideControls>("none");

  function toggleSideControls(toggledControls: SideControls) {
    visibleSideControls =
      visibleSideControls === toggledControls ? "none" : toggledControls;
  }

  function getColumnBackgroundColor(day: Moment) {
    return isOnWeekend(day) ? "var(--background-primary)" : "";
  }

  let daysRef: HTMLDivElement | undefined;
  let multiDayRowRef: HTMLDivElement | undefined = $state();
  let multiDayRowBordersRef: HTMLDivElement | undefined = $state();
  let rulerRef: HTMLDivElement | undefined = $state();

  function handleScroll(event: Event) {
    if (!(event.target instanceof Element)) {
      return;
    }

    if (daysRef) {
      daysRef.scrollLeft = event.target.scrollLeft;
    }

    if (multiDayRowRef) {
      multiDayRowRef.scrollLeft = event.target.scrollLeft;
    }

    if (multiDayRowBordersRef) {
      multiDayRowBordersRef.scrollLeft = event.target.scrollLeft;
    }

    if (rulerRef) {
      rulerRef.scrollTop = event.target.scrollTop;
    }
  }

  const { startResizing, resizeAction } = createResizeState();
</script>

<div class="corner">
  {#if $settings.showUncheduledTasks}
    <GripHorizontal
      class="horizontal-grip"
      onmousedown={startResizing}
      ontouchstart={startResizing}
    />
  {/if}
</div>

<div bind:this={rulerRef} class="ruler">
  <Ruler
    --ruler-box-shadow="var(--shadow-right)"
    visibleHours={getVisibleHours($settings)}
  />
  <div class="scrollbar-filler"></div>
</div>

<div
  bind:this={daysRef}
  style:--timeline-internal-column-count={$settings.showTimeTracker ? 2 : 1}
  class={["dp-header-row", "day-buttons"]}
>
  {#each $dateRange as day}
    <div class="header-cell">
      <ControlButton
        --border-radius="0"
        label="Open note for day"
        onclick={async () => await workspaceFacade.openFileForDay(day)}
      >
        {#if $isToday(day)}
          🔵
        {/if}

        {day.format($settings.timelineDateFormat)}
      </ControlButton>
    </div>
  {/each}
</div>

{#if $settings.showUncheduledTasks}
  <div
    style:--timeline-internal-column-count={$settings.showTimeTracker ? 2 : 1}
    class={["dp-header-row", "horizontal-resize-box-wrapper"]}
    use:resizeAction
  >
    <div bind:this={multiDayRowRef} class="multi-day-row-wrapper">
      <MultiDayRow />
    </div>
    <ColumnTracksOverlay
      columnCount={$dateRange.length}
      bind:el={multiDayRowBordersRef}
    />
  </div>
{/if}

{#if visibleSideControls !== "none"}
  <div
    class="side-controls-wrapper"
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

<div class="multi-day-main-content">
  <Scroller onscroll={handleScroll}>
    {#each $dateRange as day}
      <Timeline
        --column-background-color={getColumnBackgroundColor(day)}
        {day}
        isUnderCursor={true}
      />
    {/each}
  </Scroller>

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

    <ControlButton
      label="Change columns"
      onclick={(event) => createColumnChangeMenu({ event, settings })}
    >
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
</div>

<style>
  :global(.dp-header-row) {
    --cell-flex-basis: calc(
      var(--timeline-flex-basis) * var(--timeline-internal-column-count, 1)
    );

    z-index: 1000;
    overflow-x: hidden;
    display: flex;
    box-shadow: var(--shadow-bottom);
  }

  .ruler {
    z-index: 500;
    overflow-y: hidden;
    grid-area: ruler;
    box-shadow: var(--shadow-bottom);
  }

  .scrollbar-filler {
    height: var(--scrollbar-width);
  }

  :global(.horizontal-grip) {
    flex: 0 0 auto;
    color: var(--icon-color);
    opacity: var(--icon-opacity);
  }

  :global(.horizontal-grip:hover) {
    cursor: grab;
    opacity: var(--icon-opacity-hover);
  }

  .multi-day-row-wrapper {
    position: relative;
    overflow: hidden scroll;
    display: flex;
    flex: 1 0 0;
  }

  .day-buttons {
    grid-area: dates;
    font-size: var(--font-ui-small);
  }

  :global(.horizontal-resize-box-wrapper) {
    position: relative;
    grid-area: multiday;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .controls-sidebar {
    position: absolute;
    top: 0;
    right: var(--scrollbar-width);

    display: flex;
    flex-direction: column;
    gap: var(--size-4-2);
    align-self: flex-start;

    padding: var(--size-4-2) var(--size-4-1);

    background-color: var(--background-primary);
    border-bottom: 1px solid var(--background-modifier-border);
    border-left: 1px solid var(--background-modifier-border);
    border-bottom-left-radius: var(--radius-m);
    box-shadow: var(--input-shadow);
  }

  .multi-day-main-content {
    position: relative;
    display: flex;
    grid-area: timelines;
    flex-direction: column;
  }

  .corner {
    z-index: 1000;

    display: flex;
    grid-area: corner;
    flex-direction: column-reverse;
    align-items: center;

    background-color: var(--background-primary);
    border-right: 1px solid var(--background-modifier-border);
    border-bottom: 1px solid var(--background-modifier-border);
    box-shadow: var(--shadow-bottom);
  }

  .header-cell {
    overflow-x: hidden;
    flex: 1 0 var(--cell-flex-basis);

    width: var(--cell-flex-basis);

    font-weight: var(--font-semibold);

    background-color: var(--background-primary);
    border-right: 1px solid var(--background-modifier-border);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .header-cell:last-of-type {
    flex: 1 0 calc(var(--cell-flex-basis) + var(--scrollbar-width));
    border-right: none;
  }

  .side-controls-wrapper {
    grid-area: settings;
    width: min(320px, 50vw);
    padding-inline: var(--size-4-3);
    border-left: 1px solid var(--background-modifier-border);
  }
</style>
