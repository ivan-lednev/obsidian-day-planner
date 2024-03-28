<script lang="ts">
  import { Readable } from "svelte/store";

  import { settings } from "../../global-store/settings";
  import { TasksForDay } from "../../types";
  import { useStatusBarWidget } from "../hooks/use-status-bar-widget";

  export let onClick: () => Promise<void>;
  export let tasksForToday: Readable<TasksForDay>;
  export let errorStore: Readable<Error>;

  const statusBar = useStatusBarWidget({ tasksForToday });
  const { showNow, showNext, progressIndicator } = $derived($settings);
</script>

<div class="root" on:click={onClick}>
  {#if $errorStore}
    😵 Error in Day Planner (click to see)
  {:else if !statusBar.current && !statusBar.next}
    <span class="status-bar-item-segment">All done</span>
  {:else}
    {#if showNow && statusBar.current}
      <span class="status-bar-item-segment"
        >Now: {statusBar.current.text} (-{statusBar.current.timeLeft})</span
      >
      {#if progressIndicator === "pie"}
        <div
          class="status-bar-item-segment progress-pie day-planner"
          data-value={statusBar.current.percentageComplete}
        ></div>
      {:else if progressIndicator === "bar"}
        <div class="status-bar-item-segment day-planner-progress-bar">
          <div
            style="width: {statusBar.current.percentageComplete}%;"
            class="day-planner-progress-value"
          ></div>
        </div>
      {/if}
    {/if}
    {#if showNext && statusBar.next}
      <span class="status-bar-item-segment"
        >Next: {statusBar.next.text} (in {statusBar.next.timeToNext})</span
      >
    {/if}
  {/if}
</div>

<style>
  .root {
    display: contents;
  }
</style>
