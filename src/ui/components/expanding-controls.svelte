<script lang="ts">
  import { fade, slide } from "svelte/transition";

  import { useHoverOrTap } from "../hooks/useHoverOrTap";

  export let reverse: boolean | undefined = false;

  const { isActive, handlePointerDown, handlePointerEnter } = useHoverOrTap();
</script>

<div
  style:flex-direction={reverse ? "row-reverse" : "row"}
  style:touch-action="none"
  class="expanding-controls"
  on:pointermove|preventDefault
  on:pointerdown|capture={handlePointerDown}
  on:pointerenter={handlePointerEnter}
  transition:fade={{ duration: 200 }}
>
  {#if $isActive}
    <!--TODO: clean up styles-->
    <div style="display: flex" transition:slide={{ duration: 200, axis: "x" }}>
      <slot name="hidden" />
    </div>
  {/if}
  <slot name="visible" />
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
