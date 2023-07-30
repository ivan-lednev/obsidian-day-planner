<script lang="ts">
  import { onMount } from "svelte";
  import { getCoords, startHour, zoomLevel } from "../../timeline-store";
  import { getMinutesSinceMidnight } from "../../time-utils";

  const needleUpdateIntervalMillis = 60 * 1000;

  let nowInMinutes = getMinutesSinceMidnight();

  $: scaledNowInMinutes = getCoords(nowInMinutes);

  onMount(() => {
    const interval = setInterval(() => {
      nowInMinutes = getMinutesSinceMidnight();
    }, needleUpdateIntervalMillis);

    return () => clearInterval(interval);
  });
</script>

<div class="needle" style:transform="translateY({scaledNowInMinutes}px)">
  <div class="bullet"></div>
</div>

<style>
  .needle {
    position: absolute;
    left: 0;
    right: 0;
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
