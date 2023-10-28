<script lang="ts">
  import { getContext } from "svelte";
  import { writable } from "svelte/store";

  import { obsidianContext } from "../../constants";
  import { getVisibleHours } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";
  import type {
    ObsidianContext,
    PlacedTask,
    UnscheduledTask,
  } from "../../types";
  import { isToday } from "../../util/moment";
  import { copy, getRenderKey } from "../../util/task-utils";
  import { styledCursor } from "../actions/styled-cursor";
  import { useCursor } from "../hooks/use-edit/cursor";
  import { createTask } from "../hooks/use-edit/transform/create";
  import { EditMode } from "../hooks/use-edit/types";
  import { offsetYToMinutes, useEdit } from "../hooks/use-edit/use-edit";
  import { useTasksForDay } from "../hooks/use-tasks-for-day";

  import Banner from "./banner.svelte";
  import Column from "./column.svelte";
  import Grip from "./grip.svelte";
  import Needle from "./needle.svelte";
  import ResizeHandle from "./resize-handle.svelte";
  import Ruler from "./ruler.svelte";
  import ScheduledTaskContainer from "./scheduled-task-container.svelte";
  import ScheduledTask from "./scheduled-task.svelte";
  import Scroller from "./scroller.svelte";
  import Task from "./task.svelte";
  import TimelineControls from "./timeline-controls.svelte";
  import UnscheduledTaskContainer from "./unscheduled-task-container.svelte";

  export let hideControls = false;
  export let day = $visibleDayInTimeline;

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
    const newTask = await createTask(day, cursorMinutes);

    startEdit({ task: { ...newTask, isGhost: true }, mode: EditMode.CREATE });
  }

  function handleResizeStart(event: MouseEvent, task: PlacedTask) {
    const mode = event.ctrlKey
      ? EditMode.RESIZE_AND_SHIFT_OTHERS
      : EditMode.RESIZE;

    startEdit({ task, mode });
  }

  async function handleTaskMouseUp(task: UnscheduledTask) {
    if ($editStatus) {
      return;
    }

    const { path, line } = task.location;
    await obsidianFacade.revealLineInFile(path, line);
  }

  function handleGripMouseDown(event: MouseEvent, task: PlacedTask) {
    if (event.ctrlKey) {
      startEdit({ task, mode: EditMode.DRAG_AND_SHIFT_OTHERS });
    } else if (event.shiftKey) {
      startEdit({ task: copy(task), mode: EditMode.CREATE });
    } else {
      startEdit({ task, mode: EditMode.DRAG });
    }
  }

  function startScheduling(task: UnscheduledTask) {
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
<svelte:document on:mouseup={cancelEdit} />

{#if !hideControls}
  <TimelineControls {day} />

  {#if $displayedTasks.noTime.length > 0 && $settings.showUncheduledTasks}
    <UnscheduledTaskContainer>
      {#each $displayedTasks.noTime as task}
        <Task
          --task-height="{$settings.defaultDurationMinutes *
            $settings.zoomLevel}px"
          {task}
          on:mouseup={() => handleTaskMouseUp(task)}
        >
          <Grip
            cursor={gripCursor}
            on:mousedown={() => startScheduling(task)}
          />
        </Task>
      {/each}
    </UnscheduledTaskContainer>
  {/if}
{/if}
<Scroller let:hovering={autoScrollBlocked}>
  {#if !hideControls}
    <Ruler visibleHours={getVisibleHours($settings)} />
  {/if}

  <Column visibleHours={getVisibleHours($settings)}>
    {#if isToday(day)}
      <Needle {autoScrollBlocked} />
    {/if}

    <ScheduledTaskContainer
      cursor={containerCursor}
      {pointerOffsetY}
      on:mousedown={handleMouseDown}
      on:mouseup={confirmEdit}
    >
      {#if $editStatus && $settings.showHelp}
        <Banner />
      {/if}

      {#each $displayedTasks.withTime as task (getRenderKey(task))}
        <ScheduledTask
          {task}
          on:mouseup={() => handleTaskMouseUp(task)}
        >
          <Grip
            cursor={gripCursor}
            on:mousedown={(event) => handleGripMouseDown(event, task)}
          />
          {#if !task.isGhost}
            <ResizeHandle
              on:mousedown={(event) => handleResizeStart(event, task)}
            />
          {/if}
        </ScheduledTask>
      {/each}
    </ScheduledTaskContainer>
  </Column>
</Scroller>
