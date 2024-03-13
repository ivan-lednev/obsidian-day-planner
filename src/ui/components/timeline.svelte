<script lang="ts">
  import { Moment } from "moment";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import { getVisibleHours } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";
  import { ObsidianContext } from "../../types";
  import { isToday } from "../../util/moment";
  import { getRenderKey } from "../../util/task-utils";
  import { styledCursor } from "../actions/styled-cursor";

  import Column from "./column.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Needle from "./needle.svelte";
  import RemoteTimeBlock from "./remote-time-block.svelte";
  import Ruler from "./ruler.svelte";
  import ScheduledTaskContainer from "./scheduled-task-container.svelte";
  import Scroller from "./scroller.svelte";

  // TODO: showRuler or add <slot name="left-gutter" />
  export let hideControls = false;
  export let day: Moment | undefined = undefined;

  const {
    editContext: { confirmEdit, editOperation, getEditHandlers },
  } = getContext<ObsidianContext>(obsidianContext);

  $: actualDay = day || $visibleDayInTimeline;
  $: ({
    displayedTasks,
    cancelEdit,
    handleContainerMouseDown,
    handleResizerMouseDown,
    handleTaskMouseUp,
    handleGripMouseDown,
    handleMouseEnter,
    pointerOffsetY,
    cursor,
  } = getEditHandlers(actualDay));
</script>

<svelte:window on:blur={cancelEdit} />
<svelte:body use:styledCursor={$cursor.bodyCursor} />
<svelte:document on:mouseup={cancelEdit} />

<Scroller let:hovering={autoScrollBlocked}>
  {#if !hideControls}
    <Ruler visibleHours={getVisibleHours($settings)} />
  {/if}

  <Column visibleHours={getVisibleHours($settings)}>
    {#if isToday(actualDay)}
      <Needle {autoScrollBlocked} />
    {/if}

    <ScheduledTaskContainer
      {pointerOffsetY}
      on:mousedown={handleContainerMouseDown}
      on:mouseenter={handleMouseEnter}
      on:mouseup={confirmEdit}
    >
      {#each $displayedTasks.withTime as task (getRenderKey(task))}
        {#if task.calendar}
          <RemoteTimeBlock {task} />
        {:else}
          <LocalTimeBlock
            gripCursor={$cursor.gripCursor}
            isResizeHandleVisible={!$editOperation}
            onGripMouseDown={(event) => handleGripMouseDown(event, task)}
            onResizerMouseDown={(event) => handleResizerMouseDown(event, task)}
            {task}
            on:mouseup={() => handleTaskMouseUp(task)}
          />
        {/if}
      {/each}
    </ScheduledTaskContainer>
  </Column>
</Scroller>
