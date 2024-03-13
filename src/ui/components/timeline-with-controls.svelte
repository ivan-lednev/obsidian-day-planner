<script lang="ts">
  import { Moment } from "moment";

  import { getVisibleHours } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";

  import GlobalHandlers from "./global-handlers.svelte";
  import Ruler from "./ruler.svelte";
  import Scroller from "./scroller.svelte";
  import TimelineControls from "./timeline-controls.svelte";
  import Timeline from "./timeline.svelte";
  import UnscheduledTaskContainer from "./unscheduled-task-container.svelte";

  export let day: Moment | undefined = undefined;

  // todo: refactor to remove this one
  $: actualDay = day || $visibleDayInTimeline;
</script>

<GlobalHandlers />

<div class="controls">
  <TimelineControls />
  <UnscheduledTaskContainer day={actualDay} />
</div>
<Scroller let:hovering={autoScrollBlocked}>
  <Ruler visibleHours={getVisibleHours($settings)} />
  <Timeline day={actualDay} isUnderCursor={autoScrollBlocked} />
</Scroller>

<style>
  .controls {
    border-bottom: 1px solid var(--background-modifier-border);
  }
</style>
