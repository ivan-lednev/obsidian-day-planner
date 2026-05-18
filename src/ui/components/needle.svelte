<script lang="ts">
  import { currentTimeSignal } from "../../global-store/current-time";
  import { timeToTimelineOffset } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import { getMinutesSinceMidnight } from "../../util/moment";

  interface Props {
    autoScrollBlocked?: boolean;
  }

  const { autoScrollBlocked = false }: Props = $props();

  let el: HTMLDivElement;
  const coords = $derived(
    timeToTimelineOffset(
      getMinutesSinceMidnight(currentTimeSignal.current),
      $settings,
    ),
  );

  function scrollIntoView() {
    if ($settings.centerNeedle && !autoScrollBlocked) {
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    coords;
    scrollIntoView();
  });
</script>

<div
  bind:this={el}
  style:top="{coords}px"
  class="needle absolute-stretch-x"
></div>

<style>
  .needle {
    height: 2px;
    background-color: var(--color-accent);
  }
</style>
