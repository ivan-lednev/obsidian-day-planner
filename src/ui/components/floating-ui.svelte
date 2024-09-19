<script lang="ts">
  import { portal } from "svelte-portal";

  import type { ActionArray } from "../actions/use-actions";
  import { useActions } from "../actions/use-actions";

  export let use: ActionArray = [];
  export let onPointerLeave: (event: PointerEvent) => void;
  export let onTapOutside: (event: PointerEvent) => void;
  export let onPointerDown: (event: PointerEvent) => void = () => {};
</script>

<svelte:body on:pointerdown={onTapOutside} />

<div
  class="floating-ui"
  on:pointerleave={onPointerLeave}
  on:pointerdown={onPointerDown}
  use:portal
  use:useActions={use}
>
  <slot />
</div>

<style>
  .floating-ui {
    position: absolute;
    z-index: 9999;
    top: 0;
    left: 0;

    width: max-content;
  }
</style>
