<script lang="ts">
  import { currentTime } from "../../global-store/current-time";
  import { timeToTimelineOffset } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import { getMinutesSinceMidnight } from "../../util/moment";

  export let autoScrollBlocked = false;

  let el: HTMLDivElement;
  let coords = timeToTimelineOffset(
    getMinutesSinceMidnight($currentTime),
    $settings,
  );

  function scrollIntoView() {
    if ($settings.centerNeedle && !autoScrollBlocked) {
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  $: {
    coords = timeToTimelineOffset(
      getMinutesSinceMidnight($currentTime),
      $settings,
    );
    scrollIntoView();
  }
</script>

<div
  bind:this={el}
  style:top="{coords}px"
  class="needle absolute-stretch-x"
></div>
<div style:top="{coords}px" class="ball"></div>

<style>
  .needle {
    height: 2px;
    background-color: var(--color-accent);
  }

  .ball {
    position: absolute;
    z-index: 1000;

    width: 12px;
    height: 12px;
    margin-top: -5px;
    margin-left: -6px;

    background: var(--color-accent);
    border-radius: 50%;
  }
</style>
