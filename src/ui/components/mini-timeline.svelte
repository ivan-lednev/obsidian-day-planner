<script lang="ts">
  import { fromStore, type Readable } from "svelte/store";

  import { currentTimeSignal } from "../../global-store/current-time";
  import {
    isRemote,
    type TimeBlock,
    type WithDuration,
  } from "../../time-block-types";
  import * as t from "../../util/time-block-utils";

  import { MiniTimeline } from "./mini-timeline-headless.svelte.js";

  const {
    tasksWithTimeForToday,
  }: {
    tasksWithTimeForToday: Readable<Array<WithDuration<TimeBlock>>>;
  } = $props();

  const timeline = $derived(
    new MiniTimeline(currentTimeSignal, fromStore(tasksWithTimeForToday)),
  );
</script>

<div
  style:--time-marker-half-width-px="{timeline.timeMarkerHalfWidthPx}px"
  style:--time-marker-offset-y-px="-3px"
  class="status-bar-item-segment mini-timeline"
>
  <div
    style:left="{timeline.timeMarkerOffsetPx}px"
    class="time-marker top"
  ></div>
  <div
    style:left="{timeline.timeMarkerOffsetPx}px"
    class="time-marker bottom"
  ></div>

  <div class="mini-time-block-wrapper">
    {#each timeline.displayedBlocks as block}
      <div
        style:width="{block.durationMinutes}px"
        style:left="{block.leftPx}px"
        style:height="{block.placing.spanPercent}%"
        style:bottom="{block.placing.offsetPercent}%"
        class="mini-time-block"
        aria-label={t.getOneLineSummary(block)}
      >
        {#if isRemote(block)}
          <div
            style:background-color={block.calendar.color}
            class="remote-block-strip"
          ></div>
        {/if}
      </div>
    {/each}
  </div>

  {#each Array.from({ length: timeline.totalBlocks }) as _, index}
    <div
      class={[
        "hour-segment",
        (index + 1) % timeline.blocksPerHour === 0 && "hour-end-segment",
      ]}
    ></div>
  {/each}
</div>

<style>
  .mini-timeline {
    position: relative;

    display: flex;
    gap: 0;
    align-items: stretch;

    height: 100%;

    background-color: var(--color-base-30);
  }

  .time-marker {
    position: absolute;
    z-index: 2;

    width: 0;
    height: 0;

    border-right: var(--time-marker-half-width-px) solid transparent;
    border-left: var(--time-marker-half-width-px) solid transparent;
  }

  .time-marker.top {
    top: var(--time-marker-offset-y-px);
    border-top: var(--time-marker-half-width-px) solid var(--color-accent);
    border-top-left-radius: 2px;
    border-top-right-radius: 2px;
  }

  .time-marker.bottom {
    bottom: var(--time-marker-offset-y-px);
    border-bottom: var(--time-marker-half-width-px) solid var(--color-accent);
    border-bottom-right-radius: 2px;
    border-bottom-left-radius: 2px;
  }

  .hour-segment {
    position: relative;
    top: -15%;

    width: 10px;
    height: 130%;

    background-color: transparent;
  }

  .hour-segment:not(:last-child) {
    border-right: 1px solid var(--text-faint);
  }

  .hour-end-segment:not(:last-child) {
    top: -20%;
    left: 1px;
    height: 140%;
    border-right: 2px solid var(--text-faint);
  }

  .mini-time-block-wrapper {
    position: absolute;
    z-index: 1;
    inset: 0;
    overflow: hidden;
  }

  .mini-time-block {
    position: absolute;

    display: flex;
    align-items: center;

    background-color: var(--background-primary);
    border: 1px solid var(--text-faint);
  }

  .remote-block-strip {
    flex: 1 0 0;
    height: 30%;
  }
</style>
