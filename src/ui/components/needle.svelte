<script lang="ts">
  import { onMount } from "svelte";
  import { centerNeedle, getYCoords } from "../../store/timeline-store";
  import { getMinutesSinceMidnight } from "../../util/moment";

  export let scrollBlockedByUser;

  let el;

  $: coords = $getYCoords(getMinutesSinceMidnight());

  function scrollIntoView() {
    if ($centerNeedle && !scrollBlockedByUser) {
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  onMount(() => {
    const interval = setInterval(() => {
      coords = $getYCoords(getMinutesSinceMidnight());
      scrollIntoView();
    }, 2000);

    return () => clearInterval(interval);
  });
</script>

<div
  class="needle absolute-stretch-x"
  style:transform="translateY({coords}px)"
  bind:this={el}
></div>

<style>
  .needle {
    height: 4px;
    background-color: var(--color-accent);
  }
</style>
