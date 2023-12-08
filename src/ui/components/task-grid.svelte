<script lang="ts">
  import { Moment } from "moment";
  import { getContext } from "svelte";


  import { editContextKey } from "../../constants";
  import { getVisibleHours } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";
  import { isToday } from "../../util/moment";
  import { getRenderKey } from "../../util/task-utils";
  import { styledCursor } from "../actions/styled-cursor";
  import { useCursor } from "../hooks/use-edit/cursor";

  import Column from "./column.svelte";
  import Grip from "./grip.svelte";
  import Needle from "./needle.svelte";
  import ResizeHandle from "./resize-handle.svelte";
  import Ruler from "./ruler.svelte";
  import ScheduledTaskContainer from "./scheduled-task-container.svelte";
  import ScheduledTask from "./scheduled-task.svelte";
  import Scroller from "./scroller.svelte";

  // todo: showRuler or add <slot name="left-gutter" />
  export let hideControls = false;
  export let day: Moment | undefined = undefined;

  $: actualDay = day || $visibleDayInTimeline;

  const { editContext } = getContext(editContextKey);

  $: ({ confirmEdit, editOperation, getEditHandlers } = $editContext);
  $: ({
    displayedTasks,
    cancelEdit,
    handleContainerMouseDown,
    handleResizerMouseDown,
    handleTaskMouseUp,
    handleGripMouseDown,
    handleMouseEnter,
    pointerOffsetY,
  } = getEditHandlers(actualDay));

  $: ({ bodyCursor, gripCursor } = useCursor({
    editMode: $editOperation?.mode,
  }));
</script>

<svelte:window on:blur={cancelEdit} />
<svelte:body use:styledCursor={bodyCursor} />
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
      on:mouseup={confirmEdit}
      on:mouseenter={handleMouseEnter}
    >
      {#each $displayedTasks.withTime as task (getRenderKey(task))}
        <ScheduledTask {task} on:mouseup={() => handleTaskMouseUp(task)}>
          <Grip
            cursor={gripCursor}
            on:mousedown={(event) => handleGripMouseDown(event, task)}
          />
          <ResizeHandle
            visible={!$editOperation}
            on:mousedown={(event) => handleResizerMouseDown(event, task)}
          />
        </ScheduledTask>
      {/each}
    </ScheduledTaskContainer>
  </Column>
</Scroller>
