<script lang="ts">
  import type { Moment } from "moment";
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import { isNotVoid } from "typed-assert";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { isToday } from "../../global-store/current-time";
  import { getVisibleHours, snap } from "../../global-store/derived-settings";
  import {
    getIsomorphicClientY,
    isTouchEvent,
    offsetYToMinutes,
  } from "../../util/dom";
  import { minutesToMomentOfDay } from "../../util/moment";
  import { getRenderKey } from "../../util/task-utils";
  import { createGestures } from "../actions/gestures";

  import Column from "./column.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Needle from "./needle.svelte";
  import PositionedTimeBlock from "./positioned-time-block.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const {
    day,
    isUnderCursor = false,
  }: { day: Moment; isUnderCursor?: boolean } = $props();

  const {
    settings,
    editContext: {
      confirmEdit,
      handlers: { handleContainerMouseDown },
      getDisplayedTasksForTimeline,
      editOperation,
    },
    pointerDateTime,
    getDisplayedTasksWithClocksForTimeline,
    settingsSignal,
  } = getObsidianContext();

  const displayedTasksForTimeline = $derived(getDisplayedTasksForTimeline(day));
  const displayedTasksWithClocksForTimeline = $derived(
    getDisplayedTasksWithClocksForTimeline(day),
  );

  let el: HTMLElement | undefined = $state();

  function findOffsetForMinutes(
    targetMinutesSinceMidnight: number,
  ): number | undefined {
    if (!el) {
      return undefined;
    }

    const height = el.clientHeight;
    if (height <= 0) {
      return undefined;
    }

    const zoomLevel = settingsSignal.current.zoomLevel;
    const startHour = settingsSignal.current.startHour;

    const minMinutes = offsetYToMinutes(0, zoomLevel, startHour);
    const maxMinutes = offsetYToMinutes(height, zoomLevel, startHour);

    if (targetMinutesSinceMidnight <= minMinutes) {
      return 0;
    }

    if (targetMinutesSinceMidnight >= maxMinutes) {
      return height;
    }

    let low = 0;
    let high = height;

    for (let i = 0; i < 20; i += 1) {
      const mid = (low + high) / 2;
      const minutesAtMid = offsetYToMinutes(mid, zoomLevel, startHour);

      if (minutesAtMid < targetMinutesSinceMidnight) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return (low + high) / 2;
  }

  function updatePointerDateTime(event: MouseEvent | TouchEvent) {
    isNotVoid(el);

    const viewportToElOffsetY = el.getBoundingClientRect().top;
    const borderTopToPointerOffsetY =
      getIsomorphicClientY(event) - viewportToElOffsetY;
    const newOffsetY = snap(borderTopToPointerOffsetY, $settings);

    const minutesSinceMidnight = offsetYToMinutes(
      newOffsetY,
      settingsSignal.current.zoomLevel,
      settingsSignal.current.startHour,
    );
    const dateTime = minutesToMomentOfDay(
      minutesSinceMidnight,
      window.moment(day),
    );
    // todo: might hurt perf. Need to check for identity of time not to run on every change of coords
    pointerDateTime.set({ dateTime, type: "dateTime" });
  }

  function handleContainerPointerDown(event: MouseEvent | TouchEvent) {
    updatePointerDateTime(event);
    handleContainerMouseDown();
  }

  const timelineGestures = createGestures({
    onlongpress: (event) => {
      if (event.target !== el) {
        return;
      }

      handleContainerPointerDown(event);
    },
    onpanmove: (event) => {
      if (get(editOperation)) {
        updatePointerDateTime(event);
      }
    },
    onpanend: confirmEdit,
    options: { mouseSupport: false },
  });

  onMount(() => {
    // respect the existing setting
    if (!settingsSignal.current.centerNeedle) {
      return;
    }

    // only scroll when viewing today
    const isTodayFn = get(isToday);
    if (!isTodayFn(day)) {
      return;
    }

    // do not fight the user if cursor is already over the timeline
    if (isUnderCursor) {
      return;
    }

    if (!el) {
      return;
    }

    const scroller = el.closest(".scroller") as HTMLElement | null;
    if (!scroller) {
      return;
    }

    const now = window.moment();
    const minutesSinceMidnight = now.hours() * 60 + now.minutes();

    const offsetFromTop = findOffsetForMinutes(minutesSinceMidnight);
    if (offsetFromTop === undefined) {
      return;
    }

    const halfViewport = scroller.clientHeight / 2;
    const rawTarget = offsetFromTop - halfViewport;

    const maxScroll =
      scroller.scrollHeight > scroller.clientHeight
        ? scroller.scrollHeight - scroller.clientHeight
        : 0;

    const target = Math.max(0, Math.min(rawTarget, maxScroll));

    scroller.scrollTo({
      top: target,
      behavior: "auto",
    });
  });
</script>

{#if $settings.timelineColumns.planner}
  <Column visibleHours={getVisibleHours($settings)}>
    {#if $isToday(day)}
      <Needle autoScrollBlocked={isUnderCursor} />
    {/if}

    <div
      bind:this={el}
      class="tasks absolute-stretch-x"
      onpointerdown={(event) => {
        if (isTouchEvent(event) || event.target !== el) {
          return;
        }

        handleContainerPointerDown(event);
      }}
      onpointermove={updatePointerDateTime}
      onpointerup={confirmEdit}
      use:timelineGestures
    >
      {#each $displayedTasksForTimeline.withTime as task (getRenderKey(task))}
        <PositionedTimeBlock {task}>
          <UnscheduledTimeBlock {task} />
        </PositionedTimeBlock>
      {/each}
    </div>
  </Column>
{/if}

{#if $settings.timelineColumns.timeTracker}
  <Column
    --column-background-color="hsl(var(--color-accent-hsl), 0.03)"
    visibleHours={getVisibleHours($settings)}
  >
    {#if $isToday(day)}
      <Needle autoScrollBlocked={isUnderCursor} showBall={false} />
    {/if}

    <div class="tasks absolute-stretch-x">
      {#each $displayedTasksWithClocksForTimeline as task (getRenderKey(task))}
        <PositionedTimeBlock {task}>
          <LocalTimeBlock {task} />
        </PositionedTimeBlock>
      {/each}
    </div>
  </Column>
{/if}

<style>
  .tasks {
    top: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;

    margin-inline: var(--size-4-2);
  }
</style>
