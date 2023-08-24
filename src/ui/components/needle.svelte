<script lang="ts">
  import { todayIsShownInTimeline } from "../../store/active-day";
  import { settings } from "../../store/settings";
  import { currentTime } from "../../store/time";
  import {
    timeToTimelineOffset,
  } from "../../store/timeline-store";
  import { getMinutesSinceMidnight } from "../../util/moment";

  export let scrollBlockedByUser = false;

  let el: HTMLDivElement;
  let coords = $timeToTimelineOffset(getMinutesSinceMidnight($currentTime));

  function scrollIntoView() {
    if ($settings.centerNeedle && !scrollBlockedByUser && todayIsShownInTimeline) {
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  $: {
    coords = $timeToTimelineOffset(getMinutesSinceMidnight($currentTime));
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
