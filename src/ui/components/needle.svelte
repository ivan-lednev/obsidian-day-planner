<script lang="ts">
  import { onMount } from "svelte";
  import { settings } from "src/store/settings";
  import { getMinutesSinceMidnight } from "../../util/moment";
  import { timeToTimelineOffset } from "src/store/timeline-store";

  export let scrollBlockedByUser = false;

  let el: HTMLDivElement;

  $: coords = $timeToTimelineOffset(getMinutesSinceMidnight());

  function scrollIntoView() {
    if ($settings.centerNeedle && !scrollBlockedByUser) {
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  onMount(() => {
    const interval = setInterval(() => {
      coords = $timeToTimelineOffset(getMinutesSinceMidnight());
      scrollIntoView();
    }, 2000);

    return () => clearInterval(interval);
  });
</script>

<div
  bind:this={el}
  class="needle absolute-stretch-x"
  style:transform="translateY({coords}px)"
></div>

<style>
  .needle {
    height: 4px;
    background-color: var(--color-accent);
  }
</style>
