<script lang="ts">
  import { fromStore, type Readable } from "svelte/store";

  import { settingsSignal } from "../../global-store/settings";
  import { type Task, type WithTime } from "../../task-types";
  import { useStatusBarWidget } from "../hooks/use-status-bar-widget";

  import { SkipForward, Play } from "./lucide";
  import MiniTimeline from "./mini-timeline.svelte";

  const {
    onClick,
    tasksWithTimeForToday,
    errorStore,
  }: {
    onClick: () => Promise<void>;
    tasksWithTimeForToday: Readable<Array<WithTime<Task>>>;
    errorStore: Readable<Error | undefined>;
  } = $props();

  const { current, next } = $derived(
    fromStore(useStatusBarWidget({ tasksWithTimeForToday })).current,
  );

  const { showNow, showNext, progressIndicator, timestampFormat } = $derived(
    settingsSignal.current,
  );
</script>

<div class="root" onclick={onClick}>
  {#if $errorStore}
    😵 Error in Day Planner (click to see)
  {:else if !current && !next}
    <span class="status-bar-item-segment">All done</span>
  {:else}
    {#if showNow && current}
      <span class="status-bar-item-segment">
        <Play class="status-bar-item-icon" />
        {current.text} (-{current.timeLeft}, till {current.endTime.format(
          timestampFormat,
        )})
      </span>
    {/if}

    {#if showNext && next}
      <span class="status-bar-item-segment">
        <SkipForward class="status-bar-item-icon" />
        {next.text} (in {next.timeToNext})
      </span>
    {/if}

    {#if showNow && current}
      {#if progressIndicator === "pie"}
        <div
          class="status-bar-item-segment progress-pie day-planner"
          data-value={current.percentageComplete}
        ></div>
      {:else if progressIndicator === "bar"}
        <div class="status-bar-item-segment day-planner-progress-bar">
          <div
            style="width: {current.percentageComplete}%;"
            class="day-planner-progress-value"
          ></div>
        </div>
      {/if}
    {/if}
  {/if}

  {#if progressIndicator === "mini-timeline"}
    <MiniTimeline {tasksWithTimeForToday} />
  {/if}
</div>

<style>
  .root {
    display: contents;
  }

  .root :global(.status-bar-item-icon) {
    display: inline-flex;
  }

  .status-bar-item-segment {
    display: flex;
    gap: var(--size-2-1);
    align-items: center;
  }

  .status-bar-item-segment.progress-pie {
    display: block;
  }
</style>
