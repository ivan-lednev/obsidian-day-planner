<script lang="ts">
  import type { Moment } from "moment";
  import { getContext } from "svelte";
  import { isNotVoid } from "typed-assert";

  import { obsidianContext } from "../../constants";
  import { isToday } from "../../global-store/current-time";
  import { getVisibleHours, snap } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import { isRemote } from "../../task-types";
  import { type ObsidianContext } from "../../types";
  import { getRenderKey } from "../../util/task-utils";
  import { isTouchEvent } from "../../util/util";

  import Column from "./column.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Needle from "./needle.svelte";
  import RemoteTimeBlock from "./remote-time-block.svelte";

  export let day: Moment;
  export let isUnderCursor = false;

  const {
    editContext: { confirmEdit, getEditHandlers, pointerOffsetY },
  } = getContext<ObsidianContext>(obsidianContext);

  $: ({
    displayedTasks,
    handleContainerMouseDown,
    handleResizerMouseDown,
    handleTaskMouseUp,
    handleGripMouseDown,
    handleMouseEnter,
  } = getEditHandlers(day));

  let el: HTMLElement | undefined;

  function updatePointerOffsetY(event: PointerEvent) {
    isNotVoid(el);

    const viewportToElOffsetY = el.getBoundingClientRect().top;
    const borderTopToPointerOffsetY = event.clientY - viewportToElOffsetY;

    pointerOffsetY.set(snap(borderTopToPointerOffsetY, $settings));
  }
</script>

<Column visibleHours={getVisibleHours($settings)}>
  {#if $isToday(day)}
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
      {#if isRemote(task)}
        <RemoteTimeBlock {task} />
      {:else}
        <LocalTimeBlock
          onFloatingUiPointerDown={updatePointerOffsetY}
          onGripMouseDown={handleGripMouseDown}
          onMouseUp={() => {
            handleTaskMouseUp(task);
          }}
          onResizerMouseDown={handleResizerMouseDown}
          {task}
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
