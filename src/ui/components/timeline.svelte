<script lang="ts">
  import { Moment } from "moment";
  import { getContext } from "svelte";
  import { Writable } from "svelte/store";

  import { dateRangeContextKey, obsidianContext } from "../../constants";
  import { getVisibleHours } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import { ObsidianContext } from "../../types";
  import { isToday } from "../../util/moment";
  import { copy, getRenderKey } from "../../util/task-utils";
  import { styledCursor } from "../actions/styled-cursor";
  import { EditMode } from "../hooks/use-edit/types";

  import Column from "./column.svelte";
  import LocalTimeBlockControls from "./local-time-block-controls.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Needle from "./needle.svelte";
  import RemoteTimeBlock from "./remote-time-block.svelte";
  import ScheduledTaskContainer from "./scheduled-task-container.svelte";

  // TODO: showRuler or add <slot name="left-gutter" />
  export let day: Moment | undefined = undefined;
  export let isUnderCursor = false;

  const {
    editContext: { confirmEdit, editOperation, getEditHandlers },
  } = getContext<ObsidianContext>(obsidianContext);
  const dateRange = getContext<Writable<Moment[]>>(dateRangeContextKey);

  $: actualDay = day || $dateRange[0];
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

<Column visibleHours={getVisibleHours($settings)}>
  {#if isToday(actualDay)}
    <Needle autoScrollBlocked={isUnderCursor} />
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
        <LocalTimeBlock {task} on:mouseup={() => handleTaskMouseUp(task)}>
          {#if !$editOperation}
            <LocalTimeBlockControls
              onCopy={() => handleGripMouseDown(copy(task), EditMode.DRAG)}
              onMove={() => handleGripMouseDown(task, EditMode.DRAG)}
              onMoveWithNeighbors={() =>
                handleGripMouseDown(task, EditMode.DRAG_AND_SHIFT_OTHERS)}
              onResize={() => handleResizerMouseDown(task, EditMode.RESIZE)}
              onResizeWithNeighbors={() =>
                handleResizerMouseDown(task, EditMode.RESIZE_AND_SHIFT_OTHERS)}
            />
          {/if}
        </LocalTimeBlock>
      {/if}
    {/each}
  </ScheduledTaskContainer>
</Column>
