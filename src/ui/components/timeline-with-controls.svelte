<script lang="ts">
  import { Moment } from "moment";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import { settings } from "../../global-store/settings";
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";
  import type { ObsidianContext } from "../../types";
  import { styledCursor } from "../actions/styled-cursor";
  import { useCursor } from "../hooks/use-edit/cursor";

  import TimelineControls from "./timeline-controls.svelte";
  import Timeline from "./timeline.svelte";
  import UnscheduledTaskContainer from "./unscheduled-task-container.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  export let hideControls = false;
  export let day: Moment | undefined = undefined;

  const {
    editContext: { editOperation, getEditHandlers },
  } = getContext<ObsidianContext>(obsidianContext);

  $: actualDay = day || $visibleDayInTimeline;
  $: ({
    displayedTasks,
    cancelEdit,
    handleTaskMouseUp,
    handleUnscheduledTaskGripMouseDown,
  } = getEditHandlers(actualDay));

  // todo: move out
  $: ({ bodyCursor, gripCursor } = useCursor({
    editMode: $editOperation?.mode,
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
        <UnscheduledTimeBlock
          {gripCursor}
          onGripMouseDown={() => handleUnscheduledTaskGripMouseDown(task)}
          {task}
          on:mouseup={() => handleTaskMouseUp(task)}
        />
      {/each}
    </UnscheduledTaskContainer>
  {/if}
{/if}
<Timeline day={actualDay} {hideControls} />
