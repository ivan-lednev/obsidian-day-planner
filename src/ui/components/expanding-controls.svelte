<script context="module" lang="ts">
  import { writable } from "svelte/store";

  const isSomeInstanceUnderCursor = writable(false);
</script>

<script lang="ts">
  import Hoverable from "./hoverable.svelte";

  const isThisUnderCursor = writable(false);
</script>

<Hoverable
  onMouseEnter={() => {
    isSomeInstanceUnderCursor.set(true);
    isThisUnderCursor.set(true);
  }}
  onMouseLeave={() => {
    isSomeInstanceUnderCursor.set(false);
    isThisUnderCursor.set(false);
  }}
  let:hovering
>
  {#if $isThisUnderCursor || !$isSomeInstanceUnderCursor}
    <div class="expanding-controls">
      {#if hovering}
        <slot name="hidden" />
      {/if}
      <slot name="visible" />
    </div>
  {/if}
</Hoverable>

<style>
  /*  TODO: add variables */
  .expanding-controls {
    position: absolute;
    z-index: 99;
    inset: var(--top, initial) var(--right, initial) var(--bottom, initial) var(--left, initial);

    display: flex;
    gap: 2px;

    padding: 2px;

    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
  }
</style>
