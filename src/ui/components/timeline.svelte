<script lang="ts">
  import type { Moment } from "moment";
  import { isNotVoid } from "typed-assert";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { isToday } from "../../global-store/current-time";
  import { getVisibleHours, snap } from "../../global-store/derived-settings";
  import { isRemote } from "../../task-types";
  import { minutesToMomentOfDay } from "../../util/moment";
  import { getRenderKey, offsetYToMinutes } from "../../util/task-utils";
  import { isTouchEvent } from "../../util/util";
  import { createTimeBlockMenu } from "../time-block-menu";

  import Column from "./column.svelte";
  import DragControls from "./drag-controls.svelte";
  import FloatingControls from "./floating-controls.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Needle from "./needle.svelte";
  import PositionedTimeBlock from "./positioned-time-block.svelte";
  import RemoteTimeBlockContent from "./remote-time-block-content.svelte";
  import ResizeControls from "./resize-controls.svelte";
  import Selectable from "./selectable.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  const {
    day,
    isUnderCursor = false,
  }: { day: Moment; isUnderCursor?: boolean } = $props();

  const {
    pointerDateTime,
    settings,
    editContext: {
      confirmEdit,
      handlers: { handleContainerMouseDown },
      getDisplayedTasksForTimeline,
      editOperation,
    },
    getDisplayedTasksWithClocksForTimeline,
  } = getObsidianContext();

  const displayedTasksForTimeline = $derived(getDisplayedTasksForTimeline(day));
  const displayedTasksWithClocksForTimeline = $derived(
    getDisplayedTasksWithClocksForTimeline(day),
  );
  let el: HTMLElement | undefined;

  function updatePointerOffsetY(event: PointerEvent) {
    isNotVoid(el);

    // todo: add memo
    const viewportToElOffsetY = el.getBoundingClientRect().top;
    const borderTopToPointerOffsetY = event.clientY - viewportToElOffsetY;
    const newOffsetY = snap(borderTopToPointerOffsetY, $settings);
    const minutes = offsetYToMinutes(
      newOffsetY,
      $settings.zoomLevel,
      $settings.startHour,
    );
    const dateTime = minutesToMomentOfDay(minutes, day);

    // todo: this should be derived
    pointerDateTime.set({
      dateTime,
      type: "dateTime",
    });
  }
</script>

<Column visibleHours={getVisibleHours($settings)}>
  {#if $isToday(day)}
    <Needle autoScrollBlocked={isUnderCursor} />
  {/if}

  <div
    bind:this={el}
    class="tasks absolute-stretch-x"
    onpointerdown={(event) => {
      if (isTouchEvent(event) || event.target !== el) {
        return;
      }

      handleContainerMouseDown();
    }}
    onpointermove={updatePointerOffsetY}
    onpointerup={confirmEdit}
  >
    {#each $displayedTasksForTimeline.withTime as task (getRenderKey(task))}
      {#if isRemote(task)}
        <PositionedTimeBlock {task}>
          <TimeBlockBase {task}>
            <RemoteTimeBlockContent {task} />
          </TimeBlockBase>
        </PositionedTimeBlock>
      {:else}
        <Selectable
          onSecondarySelect={createTimeBlockMenu}
          selectionBlocked={Boolean($editOperation)}
        >
          {#snippet children(selectable)}
            <FloatingControls active={selectable.state === "primary"}>
              {#snippet anchor(floatingControls)}
                <PositionedTimeBlock {task}>
                  <LocalTimeBlock
                    isActive={selectable.state !== "none" ||
                      $editOperation?.task.id === task.id}
                    onpointerup={selectable.onpointerup}
                    {task}
                    use={[...selectable.use, ...floatingControls.actions]}
                  />
                </PositionedTimeBlock>
              {/snippet}
              {#snippet topEnd({ isActive, setIsActive })}
                <DragControls
                  --expanding-controls-position="absolute"
                  {isActive}
                  {setIsActive}
                  {task}
                />
              {/snippet}
              {#snippet bottom({ isActive, setIsActive })}
                <ResizeControls {isActive} reverse {setIsActive} {task} />
              {/snippet}
              {#snippet top({ isActive, setIsActive })}
                <ResizeControls
                  fromTop
                  {isActive}
                  reverse
                  {setIsActive}
                  {task}
                />
              {/snippet}
            </FloatingControls>
          {/snippet}
        </Selectable>
      {/if}
    {/each}
  </div>
</Column>

{#if $settings.showTimeTracker}
  <Column
    --column-background-color="hsl(var(--color-accent-hsl), 0.03)"
    visibleHours={getVisibleHours($settings)}
  >
    {#if $isToday(day)}
      <Needle autoScrollBlocked={isUnderCursor} showBall={false} />
    {/if}

    <div class="tasks absolute-stretch-x">
      {#each $displayedTasksWithClocksForTimeline as task (getRenderKey(task))}
        <PositionedTimeBlock {task}>
          <LocalTimeBlock {task} />
        </PositionedTimeBlock>
      {/each}
    </div>
  </Column>
{/if}

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
