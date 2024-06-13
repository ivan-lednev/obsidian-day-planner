<script lang="ts" context="module">
  import { writable } from "svelte/store";

  const isSomeInstanceUnderCursor = writable(false);
</script>

<script lang="ts">
  import Hoverable from "./hoverable.svelte";

  const isThisUnderCursor = writable(false);
</script>

{#if $isThisUnderCursor || !$isSomeInstanceUnderCursor}
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
    <div class="expanding-controls">
      {#if hovering}
        <slot name="hidden" />
      {/if}
      <slot name="visible" />
    </div>
  </Hoverable>
{/if}

<style>
  /*  TODO: add variables */
  .expanding-controls {
    position: absolute;
    z-index: 99;
    top: var(--top, initial);
    right: var(--right, initial);
    left: var(--left, initial);
    bottom: var(--bottom, initial);

    display: flex;
    gap: 2px;

    padding: 2px;

    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
  }
</style>
