<script lang="ts">
  import { getContext } from "svelte";
  import { writable } from "svelte/store";

  import { defaultDurationMinutes, obsidianContext } from "../../constants";
  import { getVisibleHours, snap } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";
  import type {
    ObsidianContext,
    PlacedPlanItem,
    UnscheduledPlanItem,
  } from "../../types";
  import { isToday } from "../../util/moment";
  import { copy, getRenderKey } from "../../util/task-utils";
  import { styledCursor } from "../actions/styled-cursor";
  import { useCursor } from "../hooks/use-edit/cursor";
  import { createPlanItem } from "../hooks/use-edit/transform/create";
  import { EditMode } from "../hooks/use-edit/types";
  import { offsetYToMinutes, useEdit } from "../hooks/use-edit/use-edit";
  import { useTasksForDay } from "../hooks/use-tasks-for-day";

  import Column from "./column.svelte";
  import Grip from "./grip.svelte";
  import Needle from "./needle.svelte";
  import ResizeHandle from "./resize-handle.svelte";
  import Ruler from "./ruler.svelte";
  import ScheduledTask from "./scheduled-task.svelte";
  import Scroller from "./scroller.svelte";
  import Task from "./task.svelte";
  import TimelineControls from "./timeline-controls.svelte";

  // export let day: Moment;
  // todo: won't work for week
  $: day = $visibleDayInTimeline;

  let el: HTMLDivElement;

  const { obsidianFacade, onUpdate, dataviewTasks, fileSyncInProgress } =
    getContext<ObsidianContext>(obsidianContext);

  const pointerOffsetY = writable(0);
  $: cursorMinutes = offsetYToMinutes(
    $pointerOffsetY,
    $settings.zoomLevel,
    $settings.startHour,
  );

  // todo: use one big hook
  $: tasks = useTasksForDay({
    day,
    dataviewTasks: $dataviewTasks,
    settings: $settings,
  });

  $: ({ startEdit, displayedTasks, cancelEdit, editStatus, confirmEdit } =
    useEdit({
      tasks,
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
    const newTask = await createPlanItem(day, cursorMinutes);

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

  async function handleTaskMouseUp(task: UnscheduledPlanItem) {
    if ($editStatus) {
      return;
    }

    const { path, line } = task.location;
    await obsidianFacade.revealLineInFile(path, line);
  }

  function handleGripMouseDown(event: MouseEvent, task: PlacedPlanItem) {
    if (event.ctrlKey) {
      startEdit({ task, mode: EditMode.DRAG_AND_SHIFT_OTHERS });
    } else if (event.shiftKey) {
      startEdit({ task: copy(task), mode: EditMode.CREATE });
    } else {
      startEdit({ task, mode: EditMode.DRAG });
    }
  }

  function startScheduling(task: UnscheduledPlanItem) {
    const withAddedTime = {
      ...task,
      startMinutes: cursorMinutes,
      // todo: remove this. It's added just for type compatibility
      startTime: window.moment(),
    };

    startEdit({ task: withAddedTime, mode: EditMode.SCHEDULE });
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
{#if $displayedTasks.noTime.length > 0}
  <!--todo: remove repeated calculation-->
  <div
    style:max-height="{$settings.zoomLevel * defaultDurationMinutes * 2}px"
    class="unscheduled-task-container"
  >
    {#each $displayedTasks.noTime as planItem}
      <Task
        --task-height="{$settings.defaultDurationMinutes *
          $settings.zoomLevel}px"
        {planItem}
        on:mouseup={() => handleTaskMouseUp(planItem)}
      >
        <Grip
          cursor={gripCursor}
          on:mousedown={() => startScheduling(planItem)}
        />
      </Task>
    {/each}
  </div>
{/if}
<Scroller let:hovering={userHoversOverScroller}>
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

        {#each $displayedTasks.withTime as planItem (getRenderKey(planItem))}
          <ScheduledTask
            {planItem}
            on:mouseup={() => handleTaskMouseUp(planItem)}
          >
            {#if !planItem.isGhost}
              <Grip
                cursor={gripCursor}
                on:mousedown={(event) => handleGripMouseDown(event, planItem)}
              />
              <ResizeHandle
                on:mousedown={(event) => handleResizeStart(event, planItem)}
              />
            {/if}
          </ScheduledTask>
        {/each}
      </div>
    </Column>
  </div>
</Scroller>

<style>
  .unscheduled-task-container {
    padding: 1px 10px 0 10px;
    border-bottom: 1px solid var(--background-modifier-border);
    overflow: auto;
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
</style>
