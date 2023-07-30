<script lang="ts">
  import { onMount } from "svelte";
  import { getYCoords } from "../../timeline-store";
  import { getMinutesSinceMidnight } from "../../time-utils";

  $: coords = $getYCoords(getMinutesSinceMidnight());

  onMount(() => {
    const interval = setInterval(() => {
      coords = $getYCoords(getMinutesSinceMidnight());
    }, 5 * 1000);

    return () => clearInterval(interval);
  });
</script>

<div class="needle absolute-stretch-x" style:transform="translateY({coords}px)">
  <div class="bullet"></div>
</div>

<style>
  .needle {
    height: 2px;
    background-color: var(--color-accent);
  }

  .bullet {
    position: absolute;
    left: -4px;
    top: -4px;
    border-radius: 50%;
    border: 5px solid var(--color-accent);
  }
</style>
