<script lang="ts">
  import { emDash } from "../../constants";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { isRemote, type Task } from "../../task-types";
  import { getMinutesSinceMidnight } from "../../util/moment";
  import { createTimestamp, isWithTime } from "../../util/task-utils";

  import LocalTimeBlock from "./local-time-block.svelte";
  import RemoteTimeBlockContent from "./remote-time-block-content.svelte";
  import TimeBlockBase from "./time-block-base.svelte";
  import TimeBlockControls from "./time-block-controls.svelte";

  const { task }: { task: Task; class?: string } = $props();

  const { settingsSignal } = getObsidianContext();

  const shouldShowTime = $derived(
    settingsSignal.current.showTimestampInTaskBlock && !task.isAllDayEvent,
  );

  const timestamp = $derived(
    isWithTime(task)
      ? createTimestamp(
          getMinutesSinceMidnight(task.startTime),
          task.durationMinutes,
          settingsSignal.current.timestampFormat,
          emDash,
        )
      : undefined,
  );

  function renderBlockProps(...props: string[]) {
    return [shouldShowTime ? timestamp : undefined, ...props]
      .filter(Boolean)
      .join(" • ");
  }
</script>

{#if isRemote(task)}
  <TimeBlockBase {task}>
    <RemoteTimeBlockContent {task}>
      {#snippet bottomDecoration()}
        {renderBlockProps(task.calendar.name)}
      {/snippet}
    </RemoteTimeBlockContent>
  </TimeBlockBase>
{:else}
  <TimeBlockControls {task}>
    {#snippet timeBlock({ isActive, onPointerUp, use })}
      <LocalTimeBlock {isActive} onpointerup={onPointerUp} {task} {use}>
        {#snippet bottomDecoration()}
          {renderBlockProps()}
        {/snippet}
      </LocalTimeBlock>
    {/snippet}
  </TimeBlockControls>
{/if}
