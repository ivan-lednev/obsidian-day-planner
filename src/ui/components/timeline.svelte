<script lang="ts">
  import { offset } from "@floating-ui/dom";
  import { Moment } from "moment";
  import { getContext, ComponentProps } from "svelte";
  import { Writable } from "svelte/store";

  import { dateRangeContextKey, obsidianContext } from "../../constants";
  import { getVisibleHours, snap } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import { ObsidianContext, Task } from "../../types";
  import { isToday } from "../../util/moment";
  import { copy, getRenderKey } from "../../util/task-utils";
  import { isTouchEvent } from "../../util/util";
  import { floatingUi, FloatingUiOptions } from "../actions/floating-ui";
  import { styledCursor } from "../actions/styled-cursor";
  import { EditMode } from "../hooks/use-edit/types";

  import Column from "./column.svelte";
  import DragControls from "./drag-controls.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Needle from "./needle.svelte";
  import RemoteTimeBlock from "./remote-time-block.svelte";
  import ResizeControls from "./resize-controls.svelte";

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

  let el: HTMLElement | undefined;

  function updatePointerOffsetY(event: PointerEvent) {
    const viewportToElOffsetY = el.getBoundingClientRect().top;
    const borderTopToPointerOffsetY = event.clientY - viewportToElOffsetY;

    pointerOffsetY.set(snap(borderTopToPointerOffsetY, $settings));
  }

  function createFloatingUiActions(
    task: Task,
  ): Array<
    [
      typeof floatingUi,
      FloatingUiOptions<ComponentProps<ResizeControls | DragControls>>,
    ]
  > {
    return [
      [
        floatingUi,
        {
          when: !$editOperation,
          Component: ResizeControls,
          props: {
            reverse: true,
            onPointerDown: updatePointerOffsetY,
            onResize: () => {
              handleResizerMouseDown(task, EditMode.RESIZE_FROM_TOP);
            },
            onResizeWithNeighbors: () => {
              handleResizerMouseDown(
                task,
                EditMode.RESIZE_FROM_TOP_AND_SHIFT_OTHERS,
              );
            },
            onResizeWithShrink: () => {
              handleResizerMouseDown(
                task,
                EditMode.RESIZE_FROM_TOP_AND_SHRINK_OTHERS,
              );
            },
          },
          options: {
            middleware: [offset({ mainAxis: -12, crossAxis: 40 })],
            placement: "top-start",
          },
        },
      ],
      [
        floatingUi,
        {
          when: !$editOperation,
          Component: ResizeControls,
          props: {
            onPointerDown: updatePointerOffsetY,
            onResize: () => {
              handleResizerMouseDown(task, EditMode.RESIZE);
            },
            onResizeWithNeighbors: () => {
              handleResizerMouseDown(task, EditMode.RESIZE_AND_SHIFT_OTHERS);
            },
            onResizeWithShrink: () => {
              handleResizerMouseDown(task, EditMode.RESIZE_AND_SHRINK_OTHERS);
            },
          },
          options: {
            middleware: [offset({ mainAxis: -14, crossAxis: -40 })],
            placement: "bottom-end",
          },
        },
      ],
      [
        floatingUi,
        {
          when: !$editOperation,
          Component: DragControls,
          props: {
            isExpandable: true,
            onPointerDown: updatePointerOffsetY,
            onCopy: () => {
              handleGripMouseDown(copy(task), EditMode.DRAG);
            },
            onMove: () => {
              handleGripMouseDown(task, EditMode.DRAG);
            },
            onMoveWithNeighbors: () => {
              handleGripMouseDown(task, EditMode.DRAG_AND_SHIFT_OTHERS);
            },
            onMoveWithShrink: () => {
              handleGripMouseDown(task, EditMode.DRAG_AND_SHRINK_OTHERS);
            },
          },
          options: {
            middleware: [offset({ mainAxis: -32, crossAxis: -4 })],
            placement: "top-end",
          },
        },
      ],
    ];
  }
</script>

<!--TODO: duplicate of <GlobalHandlers />-->
<svelte:window on:blur={cancelEdit} />
<svelte:body use:styledCursor={$cursor.bodyCursor} />
<svelte:document on:pointerup={cancelEdit} />

<Column visibleHours={getVisibleHours($settings)}>
  {#if isToday(actualDay)}
    <Needle autoScrollBlocked={isUnderCursor} />
  {/if}

  <div
    bind:this={el}
    class="tasks absolute-stretch-x"
    on:mouseenter={handleMouseEnter}
    on:pointerdown={(event) => {
      if (isTouchEvent(event) || event.target !== el) {
        return;
      }

      handleContainerMouseDown();
    }}
    on:pointermove={updatePointerOffsetY}
    on:pointerup={confirmEdit}
    on:pointerup|stopPropagation
  >
    {#each $displayedTasks.withTime as task (getRenderKey(task))}
      {#if task.calendar}
        <RemoteTimeBlock {task} />
      {:else}
        <LocalTimeBlock
          {task}
          use={createFloatingUiActions(task)}
          on:pointerup={(event) => {
            // todo: remove duplication
            if (!isTouchEvent(event)) {
              handleTaskMouseUp(task);
            }
          }}
        />
      {/if}
    {/each}
  </div>
</Column>

<style>
  .tasks {
    top: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;

    margin-right: 10px;
    margin-left: 10px;
  }
</style>
