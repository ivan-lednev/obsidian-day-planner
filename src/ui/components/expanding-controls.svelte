<script lang="ts">
  import { fade } from "svelte/transition";

  import { useHoverOrTap } from "../hooks/use-hover-or-tap";

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
  class="expanding-controls"
  class:active={$isActive}
  on:pointermove|preventDefault
  on:pointerdown
  on:pointerdown={handlePointerDown}
  on:pointerenter={handlePointerEnter}
  on:pointerleave={handlePointerLeave}
>
  {#if $isActive}
    <div style="display: flex" in:fade={{ duration: 300 }}>
      <slot />
    </div>
  {/if}
  <div
    style:display={$isActive ? "none" : "block"}
    class="circle"
    in:fade={{ duration: 300 }}
  ></div>
</div>

<style>
  .circle {
    padding: var(--size-4-1);
    opacity: 0.3;
    background-color: var(--color-accent);
    border-radius: 50%;
  }

  .expanding-controls {
    overflow: hidden;
    display: flex;
    flex-direction: var(--expanding-controls-flex-direction, row);
    align-items: center;
    justify-content: center;

    min-width: 32px;
    min-height: 32px;

    border-radius: 4px;
  }

  .active {
    min-width: auto;
    min-height: auto;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
  }
</style>
