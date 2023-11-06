<script lang="ts">
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import { getVisibleHours } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";
  import type { ObsidianContext } from "../../types";
  import { isToday } from "../../util/moment";
  import { getRenderKey } from "../../util/task-utils";
  import { styledCursor } from "../actions/styled-cursor";
  import { useCursor } from "../hooks/use-edit/cursor";

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

  const { fileSyncInProgress, editContext } =
    getContext<ObsidianContext>(obsidianContext);

  $: ({
    displayedTasks,
    cancelEdit,
    editStatus,
    confirmEdit,
    handleMouseDown,
    handleResizeStart,
    handleTaskMouseUp,
    handleGripMouseDown,
    startScheduling,
    handleMouseEnter,
    pointerOffsetY,
  } = $editContext.getEditHandlers(day));

  $: ({ bodyCursor, gripCursor, containerCursor } = useCursor({
    editBlocked: $fileSyncInProgress,
    editMode: $editStatus,
  }));
</script>

<svelte:window on:blur={cancelEdit} />
<svelte:body use:styledCursor={bodyCursor} />
<svelte:document on:mouseup={cancelEdit} />

{#if !hideControls}
  <TimelineControls />

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
      on:mouseenter={handleMouseEnter}
    >
      {#if $editStatus && $settings.showHelp}
        <Banner />
      {/if}

      {#each $displayedTasks.withTime as task (getRenderKey(task))}
        <ScheduledTask {task} on:mouseup={() => handleTaskMouseUp(task)}>
          <Grip
            cursor={gripCursor}
            on:mousedown={(event) => handleGripMouseDown(event, task)}
          />
          <ResizeHandle
            visible={!$editStatus && !$fileSyncInProgress}
            on:mousedown={(event) => handleResizeStart(event, task)}
          />
        </ScheduledTask>
      {/each}
    </ScheduledTaskContainer>
  </Column>
</Scroller>
