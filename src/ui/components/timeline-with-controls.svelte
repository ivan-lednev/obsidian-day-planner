<script lang="ts">
  import { Moment } from "moment";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import { settings } from "../../global-store/settings";
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";
  import type { ObsidianContext } from "../../types";
  import { styledCursor } from "../actions/styled-cursor";

  import TimelineControls from "./timeline-controls.svelte";
  import Timeline from "./timeline.svelte";
  import UnscheduledTaskContainer from "./unscheduled-task-container.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  // todo: refactor to remove this one
  export let hideControls = false;
  export let day: Moment | undefined = undefined;

  const {
    editContext: { getEditHandlers },
  } = getContext<ObsidianContext>(obsidianContext);

  // todo: refactor to remove this one
  $: actualDay = day || $visibleDayInTimeline;
  $: ({
    displayedTasks,
    cancelEdit,
    cursor,
    handleTaskMouseUp,
    handleUnscheduledTaskGripMouseDown,
  } = getEditHandlers(actualDay));
</script>

<svelte:window on:blur={cancelEdit} />
<svelte:body use:styledCursor={$cursor.bodyCursor} />
<svelte:document on:mouseup={cancelEdit} />

{#if !hideControls}
  <TimelineControls />

  {#if $displayedTasks.noTime.length > 0 && $settings.showUncheduledTasks}
    <UnscheduledTaskContainer>
      {#each $displayedTasks.noTime as task}
        <UnscheduledTimeBlock
          gripCursor={$cursor.gripCursor}
          onGripMouseDown={() => handleUnscheduledTaskGripMouseDown(task)}
          {task}
          on:mouseup={() => handleTaskMouseUp(task)}
        />
      {/each}
    </UnscheduledTaskContainer>
  {/if}
{/if}
<Timeline day={actualDay} {hideControls} />
