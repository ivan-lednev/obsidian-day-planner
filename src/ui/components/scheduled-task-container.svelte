<script lang="ts">
  import { Writable } from "svelte/store";

  import { snap } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";

  export let pointerOffsetY: Writable<number>;

  let el: HTMLDivElement;
</script>

<!--todo: prevent propagation in handler -->
<div
  bind:this={el}
  class="tasks absolute-stretch-x"
  on:mousemove={(event) => {
    const viewportToElOffsetY = el.getBoundingClientRect().top;
    const borderTopToPointerOffsetY = event.clientY - viewportToElOffsetY;

    pointerOffsetY.set(snap(borderTopToPointerOffsetY, $settings.zoomLevel));
  }}
  on:mousedown
  on:mouseup|stopPropagation
  on:mouseenter
>
  <slot />
</div>

<style>
  .tasks {
    top: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;

    margin-right: 10px;
    margin-left: 10px;
  }
</style>
