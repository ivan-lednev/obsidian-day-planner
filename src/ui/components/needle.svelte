<script lang="ts">
  import { settings } from "src/store/settings";
  import { getMinutesSinceMidnight } from "../../util/moment";
  import {
    activeDayShown,
    timeToTimelineOffset,
  } from "src/store/timeline-store";
  import { time } from "../../store/time";

  export let scrollBlockedByUser = false;

  let el: HTMLDivElement;
  let coords = $timeToTimelineOffset(getMinutesSinceMidnight($time));

  function scrollIntoView() {
    if ($settings.centerNeedle && !scrollBlockedByUser && activeDayShown) {
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  $: {
    coords = $timeToTimelineOffset(getMinutesSinceMidnight($time));
    scrollIntoView();
  }
</script>

<div
  bind:this={el}
  style:transform="translateY({coords}px)"
  class="needle absolute-stretch-x"
></div>

<style>
  .needle {
    height: 2px;
    background-color: var(--color-accent);
  }
</style>
