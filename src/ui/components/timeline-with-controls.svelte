<script lang="ts">
  import { Moment } from "moment";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";
  import type { ObsidianContext } from "../../types";
  import { styledCursor } from "../actions/styled-cursor";

  import Scroller from "./scroller.svelte";
  import TimelineControls from "./timeline-controls.svelte";
  import Timeline from "./timeline.svelte";
  import UnscheduledTaskContainer from "./unscheduled-task-container.svelte";

  // todo: refactor to remove this one
  export let hideControls = false;
  export let day: Moment | undefined = undefined;

  const {
    editContext: { getEditHandlers },
  } = getContext<ObsidianContext>(obsidianContext);

  // todo: refactor to remove this one
  $: actualDay = day || $visibleDayInTimeline;
  $: ({ cancelEdit, cursor } = getEditHandlers(actualDay));
</script>

<svelte:window on:blur={cancelEdit} />
<svelte:body use:styledCursor={$cursor.bodyCursor} />
<svelte:document on:mouseup={cancelEdit} />

{#if !hideControls}
  <div class="controls">
    <TimelineControls />
    <UnscheduledTaskContainer day={actualDay} />
  </div>
  <Scroller let:hovering={autoScrollBlocked}>
    <Timeline day={actualDay} {hideControls} />
  </Scroller>
  <!--  todo; clean up-->
{:else}
  <Timeline day={actualDay} {hideControls} />
{/if}

<style>
  .controls {
    border-bottom: 1px solid var(--background-modifier-border);
  }
</style>
