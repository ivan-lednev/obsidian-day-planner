<script lang="ts">
  import { fade, slide } from "svelte/transition";

  import { useHoverOrTap } from "../hooks/useHoverOrTap";

  export let reverse: boolean | undefined = false;

  const {
    isActive,
    handlePointerDown,
    handlePointerEnter,
    handlePointerLeave,
  } = useHoverOrTap();
</script>

<div
  style:flex-direction={reverse ? "row-reverse" : "row"}
  style:touch-action="none"
  style:opacity={$isActive ? 1 : 0.5}
  class="expanding-controls"
  on:pointermove|preventDefault
  on:pointerdown
  on:pointerdown={handlePointerDown}
  on:pointerenter={handlePointerEnter}
  on:pointerleave={handlePointerLeave}
  transition:fade={{ duration: 200 }}
>
  {#if $isActive}
    <div style="display: flex" transition:slide={{ duration: 200, axis: "x" }}>
      <slot name="hidden" />
    </div>
  {/if}
  <slot name="visible" isActive={$isActive} />
</div>

<style>
  .expanding-controls {
    overflow: hidden;
    display: flex;
    flex-direction: var(--expanding-controls-flex-direction, row);

    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
  }
</style>
