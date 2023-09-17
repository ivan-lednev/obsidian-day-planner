<script lang="ts">
  import { currentTime } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";
  import { timeToTimelineOffset } from "../../global-store/settings-utils";
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";
  import { getMinutesSinceMidnight, isToday } from "../../util/moment";

  export let autoScrollBlocked = false;

  let el: HTMLDivElement;
  let coords = $timeToTimelineOffset(getMinutesSinceMidnight($currentTime));

  function scrollIntoView() {
    if (
      $settings.centerNeedle &&
      !autoScrollBlocked &&
      isToday($visibleDayInTimeline)
    ) {
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
