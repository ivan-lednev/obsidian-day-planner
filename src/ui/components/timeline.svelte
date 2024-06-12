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

  import Column from "./column.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Needle from "./needle.svelte";
  import RemoteTimeBlock from "./remote-time-block.svelte";
  import ScheduledTaskContainer from "./scheduled-task-container.svelte";
  import ExpandingControls from "./expanding-controls.svelte";
  import BlockControlButton from "./block-control-button.svelte";
  import {
    ArrowDownToLine,
    Copy,
    GripVertical,
    MoveVertical,
  } from "lucide-svelte";
  import { EditMode } from "../hooks/use-edit/types";

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
    on:mousedown={handleContainerMouseDown}
    on:mouseenter={handleMouseEnter}
    on:mouseup={confirmEdit}
    {pointerOffsetY}
  >
    {#each $displayedTasks.withTime as task (getRenderKey(task))}
      {#if task.calendar}
        <RemoteTimeBlock {task} />
      {:else}
        <LocalTimeBlock {task} on:mouseup={() => handleTaskMouseUp(task)}>
          {#if !$editOperation}
            <ExpandingControls --top="4px" --right="4px">
              <BlockControlButton
                slot="visible"
                label="Start moving"
                cursor="grab"
                on:mousedown={() => handleGripMouseDown(task, EditMode.DRAG)}
              >
                <GripVertical class="svg-icon" />
              </BlockControlButton>
              <svelte:fragment slot="hidden">
                <BlockControlButton
                  label="Start copying"
                  cursor="grab"
                  on:mousedown={() =>
                    handleGripMouseDown(copy(task), EditMode.DRAG)}
                >
                  <Copy class="svg-icon" />
                </BlockControlButton>
                <BlockControlButton
                  label="Move block and push neighboring blocks"
                  cursor="grab"
                  on:mousedown={() =>
                    handleGripMouseDown(task, EditMode.DRAG_AND_SHIFT_OTHERS)}
                >
                  <ArrowDownToLine class="svg-icon" />
                </BlockControlButton>
              </svelte:fragment>
            </ExpandingControls>
            <ExpandingControls --bottom="-12px" --right="16px">
              <BlockControlButton
                slot="visible"
                label="Start resizing"
                cursor="grab"
                on:mousedown={() =>
                  handleResizerMouseDown(task, EditMode.RESIZE)}
              >
                <MoveVertical class="svg-icon" />
              </BlockControlButton>
              <svelte:fragment slot="hidden">
                <BlockControlButton
                  label="Move block and push neighboring blocks"
                  cursor="grab"
                  on:mousedown={() =>
                    handleResizerMouseDown(
                      task,
                      EditMode.RESIZE_AND_SHIFT_OTHERS,
                    )}
                >
                  <ArrowDownToLine class="svg-icon" />
                </BlockControlButton>
              </svelte:fragment>
            </ExpandingControls>
          {/if}
        </LocalTimeBlock>
      {/if}
    {/each}
  </ScheduledTaskContainer>
</Column>
