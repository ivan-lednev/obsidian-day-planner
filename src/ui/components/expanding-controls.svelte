<script lang="ts">
  import type { Snippet } from "svelte";
  import { slide, fade } from "svelte/transition";

  import {
    transitionDurationShort,
    vibrationDurationMillis,
  } from "../../constants";
  import { isTouchEvent } from "../../util/util";

  import { createSlide } from "./defaults";

  interface Props {
    isActive: boolean;
    setIsActive: (value: boolean) => void;
    reverse?: boolean;
    initial: Snippet;
    expanded: Snippet;
  }

  export const {
    isActive,
    setIsActive: baseSetIsActive,
    reverse = false,
    initial,
    expanded,
  }: Props = $props();

  function setIsActive(isActive: boolean) {
    navigator.vibrate?.(vibrationDurationMillis);
    baseSetIsActive(isActive);
  }
</script>

<div
  style:touch-action="none"
  style:flex-direction={reverse ? "row-reverse" : "row"}
  class="expanding-controls"
  class:active={isActive}
  onpointerenter={(event) => {
    if (isTouchEvent(event)) {
      return;
    }

    setIsActive(true);
  }}
  onpointerleave={(event) => {
    if (isTouchEvent(event)) {
      return;
    }

    setIsActive(false);
  }}
  onpointerup={(event) => {
    if (isTouchEvent(event)) {
      setIsActive(!isActive);
    }
  }}
  transition:fade={{ duration: transitionDurationShort }}
>
  {#if isActive}
    <div class="expanded-wrapper" transition:slide={createSlide({ axis: "x" })}>
      {@render expanded()}
    </div>
  {/if}
  {@render initial()}
</div>

<style>
  .expanded-wrapper,
  .expanding-controls {
    display: flex;
    gap: var(--size-2-1);
  }

  .expanding-controls {
    /* Note: this prevents jitter and losing hover state when a floating UI
    container has a slide animation that stretches it from right to left. */
    position: var(--expanding-controls-position, static);
    right: 0;
    bottom: 0;

    padding: var(--size-2-1);

    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--size-4-1);
    box-shadow: var(--floating-controls-shadow);
  }
</style>
