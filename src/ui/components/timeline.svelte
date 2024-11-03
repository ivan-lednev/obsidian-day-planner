<script lang="ts">
  import type { Moment } from "moment";
  import { getContext } from "svelte";
  import { isNotVoid } from "typed-assert";

  import { obsidianContext } from "../../constants";
  import { isToday } from "../../global-store/current-time";
  import { getVisibleHours, snap } from "../../global-store/derived-settings";
  import { isRemote } from "../../task-types";
  import { type ObsidianContext } from "../../types";
  import { minutesToMomentOfDay } from "../../util/moment";
  import { getRenderKey, offsetYToMinutes } from "../../util/task-utils";
  import { isTouchEvent } from "../../util/util";

  import Column from "./column.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Needle from "./needle.svelte";
  import RemoteTimeBlock from "./remote-time-block.svelte";
  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  export let day: Moment;
  export let isUnderCursor = false;

  const {
    pointerDateTime,
    settings,
    editContext: { confirmEdit, handlers, getDisplayedTasksForTimeline },
  } = getContext<ObsidianContext>(obsidianContext);

  $: ({
    handleContainerMouseDown,
    handleResizerMouseDown,
    handleTaskMouseUp,
    handleGripMouseDown,
  } = handlers);

  $: displayedTasksForTimeline = getDisplayedTasksForTimeline(day);
  let el: HTMLElement | undefined;

  function updatePointerOffsetY(event: PointerEvent) {
    isNotVoid(el);

    const viewportToElOffsetY = el.getBoundingClientRect().top;
    const borderTopToPointerOffsetY = event.clientY - viewportToElOffsetY;
    const newOffsetY = snap(borderTopToPointerOffsetY, $settings);
    const minutes = offsetYToMinutes(
      newOffsetY,
      $settings.zoomLevel,
      $settings.startHour,
    );
    const dateTime = minutesToMomentOfDay(minutes, day);

    console.log("dateTime", dateTime.toString());
    pointerDateTime.set({
      dateTime,
      type: "dateTime",
    });
  }
</script>

<Column visibleHours={getVisibleHours($settings)}>
  {#if $isToday(day)}
    <Needle autoScrollBlocked={isUnderCursor} />
  {/if}

  <div
    bind:this={el}
    class="tasks absolute-stretch-x"
    on:pointerdown={(event) => {
      if (isTouchEvent(event) || event.target !== el) {
        return;
      }

      handleContainerMouseDown();
    }}
    on:pointermove={updatePointerOffsetY}
    on:pointerup={confirmEdit}
    on:pointerup|stopPropagation
  >
    {#each $displayedTasksForTimeline.withTime as task (getRenderKey(task))}
      {#if isRemote(task)}
        <ScheduledTimeBlock {task}>
          <RemoteTimeBlock {task} />
        </ScheduledTimeBlock>
      {:else}
        <LocalTimeBlock
          onFloatingUiPointerDown={updatePointerOffsetY}
          onGripMouseDown={handleGripMouseDown}
          onMouseUp={() => {
            handleTaskMouseUp(task);
          }}
          onResizerMouseDown={handleResizerMouseDown}
          {task}
        />
      {/if}
    {/each}
  </div>
</Column>

<style>
  .tasks {
    top: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;

    margin-right: 10px;
    margin-left: 10px;
  }
</style>
