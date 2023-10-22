<script lang="ts">
  import { GripVertical } from "lucide-svelte";
  import { getContext } from "svelte";
  import { writable } from "svelte/store";

  import { obsidianContext } from "../../constants";
  import { getVisibleHours, snap } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";
  import type { ObsidianContext, PlacedPlanItem, PlanItem } from "../../types";
  import { isToday } from "../../util/moment";
  import { copy, getRenderKey } from "../../util/task-utils";
  import { styledCursor } from "../actions/styled-cursor";
  import { useCursor } from "../hooks/use-edit/cursor";
  import { createPlanItem } from "../hooks/use-edit/transform/create";
  import { EditMode } from "../hooks/use-edit/types";
  import { offsetYToMinutes, useEdit } from "../hooks/use-edit/use-edit";
  import { useTasksForDay } from "../hooks/use-tasks-for-day";

  import Column from "./column.svelte";
  import Needle from "./needle.svelte";
  import Ruler from "./ruler.svelte";
  import ScheduledTask from "./scheduled-task.svelte";
  import Task from "./task.svelte";
  import TimelineControls from "./timeline-controls.svelte";

  // export let day: Moment;
  // todo: won't work for week
  $: day = $visibleDayInTimeline;

  let el: HTMLDivElement;

  const { obsidianFacade, onUpdate, dataviewTasks, fileSyncInProgress } =
    getContext<ObsidianContext>(obsidianContext);

  const pointerOffsetY = writable(0);

  $: ({ scheduled: scheduledTasks, unscheduled: unscheduledTasks } =
    useTasksForDay({
      day,
      dataviewTasks: $dataviewTasks,
      settings: $settings,
    }));

  $: ({ startEdit, displayedTasks, cancelEdit, editStatus, confirmEdit } =
    useEdit({
      parsedTasks: scheduledTasks,
      settings,
      pointerOffsetY: pointerOffsetY,
      fileSyncInProgress,
      onUpdate,
    }));

  $: ({ bodyCursor, gripCursor, containerCursor } = useCursor({
    editBlocked: $fileSyncInProgress,
    editMode: $editStatus,
  }));

  async function handleMouseDown() {
    const newTask = await createPlanItem(
      day,
      offsetYToMinutes(
        $pointerOffsetY,
        $settings.zoomLevel,
        $settings.startHour,
      ),
    );

    startEdit({ task: { ...newTask, isGhost: true }, mode: EditMode.CREATE });
  }

  async function handleMouseUp() {
    await confirmEdit();
  }

  function handleResizeStart(event: MouseEvent, task: PlacedPlanItem) {
    const mode = event.ctrlKey
      ? EditMode.RESIZE_AND_SHIFT_OTHERS
      : EditMode.RESIZE;

    startEdit({ task, mode });
  }

  async function handleTaskMouseUp(task: PlanItem) {
    if ($editStatus) {
      return;
    }

    const { path, line } = task.location;
    await obsidianFacade.revealLineInFile(path, line);
  }

  async function handleGripMouseDown(event: MouseEvent, task: PlacedPlanItem) {
    if (event.ctrlKey) {
      startEdit({ task, mode: EditMode.DRAG_AND_SHIFT_OTHERS });
    } else if (event.shiftKey) {
      startEdit({ task: copy(task), mode: EditMode.CREATE });
    } else {
      startEdit({ task, mode: EditMode.DRAG });
    }
  }

  let userHoversOverScroller = false;

  function handleMouseEnter() {
    userHoversOverScroller = true;
  }

  function handleMouseLeave() {
    userHoversOverScroller = false;
  }
</script>

<svelte:window on:blur={cancelEdit} />
<svelte:body use:styledCursor={bodyCursor} />
<svelte:document
  on:mouseup={cancelEdit}
  on:mousemove={(event) => {
    const viewportToElOffsetY = el.getBoundingClientRect().top;
    const borderTopToPointerOffsetY = event.clientY - viewportToElOffsetY;

    pointerOffsetY.set(snap(borderTopToPointerOffsetY, $settings.zoomLevel));
  }}
/>

<TimelineControls day={$visibleDayInTimeline} />
<div class="unscheduled-task-container">
  {#each unscheduledTasks as planItem}
    <Task
      --task-height="{$settings.defaultDurationMinutes * $settings.zoomLevel}px"
      {planItem}
      on:mouseup={() => {}}
    >
      <div
        style:cursor={gripCursor}
        class="grip"
        on:mousedown|stopPropagation={(event) =>
          handleGripMouseDown(event, planItem)}
      >
        <GripVertical class="svg-icon" />
      </div>
    </Task>
  {/each}
</div>
<div
  class="scroller"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <div class="container">
    <Ruler visibleHours={getVisibleHours($settings)} />

    <Column visibleHours={getVisibleHours($settings)}>
      {#if isToday($visibleDayInTimeline)}
        <Needle autoScrollBlocked={userHoversOverScroller} />
      {/if}

      <div
        bind:this={el}
        style:cursor={containerCursor}
        class="tasks absolute-stretch-x"
        on:mousedown={handleMouseDown}
        on:mouseup|stopPropagation={handleMouseUp}
      >
        {#if $editStatus && $settings.showHelp}
          <div class="banner">Release outside this column to cancel edit</div>
        {/if}

        {#each $displayedTasks as planItem (getRenderKey(planItem))}
          <ScheduledTask
            {planItem}
            on:mouseup={() => handleTaskMouseUp(planItem)}
          >
            {#if !planItem.isGhost}
              <div
                style:cursor={gripCursor}
                class="grip"
                on:mousedown|stopPropagation={(event) =>
                  handleGripMouseDown(event, planItem)}
              >
                <GripVertical class="svg-icon" />
              </div>
              <hr
                class="workspace-leaf-resize-handle"
                on:mousedown|stopPropagation={(event) =>
                  handleResizeStart(event, planItem)}
              />
            {/if}
          </ScheduledTask>
        {/each}
      </div>
    </Column>
  </div>
</div>

<style>
  :not(#dummy).workspace-leaf-resize-handle {
    cursor: row-resize;

    right: 0;
    bottom: 0;
    left: 0;

    display: block; /* obsidian hides them sometimes, we don't want that */

    height: calc(var(--divider-width-hover) * 2);

    border-bottom-width: var(--divider-width);
  }

  .unscheduled-task-container {
    padding: 1px 20px 0 40px;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .container {
    display: flex;
  }

  .banner {
    position: sticky;
    z-index: 10;
    top: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: var(--size-4-4);

    animation: pulse 1s infinite alternate;
  }

  .tasks {
    top: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;

    margin-right: 10px;
    margin-left: 10px;
  }

  .grip {
    position: relative;
    right: -4px;

    grid-column: 2;
    align-self: flex-start;

    color: var(--text-faint);
  }

  .grip:hover {
    color: var(--text-muted);
  }

  .scroller {
    overflow: auto;
    flex: 1 0 0;
  }
</style>
