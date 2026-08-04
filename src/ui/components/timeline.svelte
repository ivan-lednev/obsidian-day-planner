<script lang="ts">
  import type { Moment } from "moment";
  import { get } from "svelte/store";
  import { isNotVoid } from "typed-assert";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { isToday } from "../../global-store/current-time";
  import { getVisibleHours } from "../../global-store/derived-settings";
  import { selectLogEntriesById } from "../../redux/index/index-slice";
  import { isLog, type LogTimeBlock } from "../../time-block-types";
  import { isTouchEvent } from "../../util/dom";
  import { getBlockProps } from "../../util/time-block-utils";
  import { createGestures } from "../actions/gestures";
  import { trackPointerDateTime } from "../actions/track-pointer-date-time";
  import { createActiveClockMenu } from "../active-clock-menu";
  import { createCompletedClockMenu } from "../completed-clock-menu";

  import Column from "./column.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import LogTimeBlockControls from "./log-time-block-controls.svelte";
  import NeedleClockControl from "./needle-clock-control.svelte";
  import Needle from "./needle.svelte";
  import PositionedTimeBlock from "./positioned-time-block.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const {
    day,
    isUnderCursor = false,
  }: { day: Moment; isUnderCursor?: boolean } = $props();

  const {
    settingsStore,
    editContext: {
      confirmEdit,
      startCreate,
      getDisplayedTimeBlocksForTimeline,
      getDisplayedLogTimeBlocksForTimeline,
      editOperation,
    },
    pointerDateTime,
    settingsSignal,
    useSelector,
    logEntryEditor,
    workspaceFacade,
    openLogEntryEditModal,
  } = getObsidianContext();

  const displayedTimeBlocksForTimeline = $derived(
    getDisplayedTimeBlocksForTimeline(day),
  );
  const displayedLogTimeBlocksForTimeline = $derived(
    getDisplayedLogTimeBlocksForTimeline(day),
  );

  const logEntriesById = useSelector(selectLogEntriesById);

  // todo: separate LogTimeBlockView (clamped) & LogTimeBlock
  function showLogBlockMenu(
    event: MouseEvent | PointerEvent | TouchEvent,
    timeBlockView: LogTimeBlock,
  ) {
    const logEntry = logEntriesById.current[timeBlockView.id];

    isNotVoid(logEntry, `No log entry found for block id ${timeBlockView.id}`);

    const isCompleted = logEntry.end;

    if (isCompleted) {
      createCompletedClockMenu({
        event,
        timeBlock: timeBlockView,
        logEntry: logEntry,
        logEntryEditor,
        workspaceFacade,
        openLogEntryEditModal,
      });
    } else {
      createActiveClockMenu({
        event,
        timeBlock: timeBlockView,
        logEntryEditor,
        workspaceFacade,
        // pass the raw entry so "Edit..." targets the real (unclamped) entry
        openLogEntryEditModal: (timeBlock) =>
          openLogEntryEditModal(timeBlock, logEntry),
      });
    }
  }

  const plannerPointer = trackPointerDateTime({
    getDay: () => day,
    pointerDateTime,
    settingsSignal,
  });

  const trackerPointer = trackPointerDateTime({
    getDay: () => day,
    pointerDateTime,
    settingsSignal,
  });

  function handleContainerPointerDown(event: MouseEvent | TouchEvent) {
    plannerPointer.sync(event);
    startCreate();
  }

  // Deliberately the block being edited and not `isEditing`: both columns share
  // one pointer, so only the column that owns the edit may move it.
  function handleContainerPointerMove(event: MouseEvent | TouchEvent) {
    const operation = get(editOperation);

    if (operation && !isLog(operation.timeBlock)) {
      plannerPointer.sync(event);
    }
  }

  function handleTrackerPointerMove(event: MouseEvent | TouchEvent) {
    const operation = get(editOperation);

    if (operation && isLog(operation.timeBlock)) {
      trackerPointer.sync(event);
    }
  }

  const timelineGestures = createGestures({
    onlongpress: (event) => {
      if (!plannerPointer.isOnBackground(event)) {
        return;
      }

      handleContainerPointerDown(event);
    },
    onpanmove: handleContainerPointerMove,
    onpanend: confirmEdit,
    options: { mouseSupport: false },
  });

  const trackerGestures = createGestures({
    onpanmove: handleTrackerPointerMove,
    onpanend: confirmEdit,
    options: { mouseSupport: false },
  });
</script>

<div class="timeline">
  {#if $settingsStore.timelineColumns.planner}
    <Column visibleHours={getVisibleHours($settingsStore)}>
      {#if $isToday(day)}
        <Needle autoScrollBlocked={isUnderCursor} />
      {/if}

      <div
        class="tasks absolute-stretch-x"
        onpointerdown={(event) => {
          if (isTouchEvent(event) || !plannerPointer.isOnBackground(event)) {
            return;
          }

          handleContainerPointerDown(event);
        }}
        onpointermove={handleContainerPointerMove}
        onpointerup={confirmEdit}
        {@attach plannerPointer.attachment}
        {@attach timelineGestures}
      >
        {#each $displayedTimeBlocksForTimeline as timeBlock (timeBlock.id)}
          <PositionedTimeBlock {timeBlock}>
            <UnscheduledTimeBlock {timeBlock}>
              {#snippet bottomDecoration()}
                {getBlockProps(timeBlock, settingsSignal.current)}
              {/snippet}
            </UnscheduledTimeBlock>
          </PositionedTimeBlock>
        {/each}
      </div>
    </Column>
  {/if}

  {#if $settingsStore.timelineColumns.timeTracker}
    <Column visibleHours={getVisibleHours($settingsStore)}>
      {#if $isToday(day)}
        <Needle autoScrollBlocked={isUnderCursor}>
          {#snippet controls()}
            <NeedleClockControl />
          {/snippet}
        </Needle>
      {/if}

      <div
        class="tasks absolute-stretch-x"
        onpointermove={handleTrackerPointerMove}
        onpointerup={confirmEdit}
        {@attach trackerPointer.attachment}
        {@attach trackerGestures}
      >
        {#each $displayedLogTimeBlocksForTimeline as timeBlock (timeBlock.id)}
          <PositionedTimeBlock {timeBlock}>
            <LogTimeBlockControls
              onSecondarySelect={(event) => showLogBlockMenu(event, timeBlock)}
              {timeBlock}
            >
              {#snippet content({
                isActive,
                onPointerUp,
                gestures,
                clearOnPointerUpOutside,
                anchor,
              })}
                <LocalTimeBlock
                  {isActive}
                  onpointerup={onPointerUp}
                  {timeBlock}
                  {@attach gestures}
                  {@attach clearOnPointerUpOutside}
                  {@attach anchor}
                >
                  {#snippet bottomDecoration()}
                    {getBlockProps(timeBlock, settingsSignal.current)}
                  {/snippet}
                </LocalTimeBlock>
              {/snippet}
            </LogTimeBlockControls>
          </PositionedTimeBlock>
        {/each}
      </div>
    </Column>
  {/if}
</div>

<style>
  .timeline {
    display: flex;
    flex: 1 1 0;
    height: fit-content;
    border-inline-end: var(--timeline-border-inline-end);
  }

  .tasks {
    top: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;

    margin-inline: var(--size-4-2);
  }

  .tasks :global(.planner-sticky-block-content) {
    position: sticky;
    top: 0;
    max-height: 100%;
  }
</style>
