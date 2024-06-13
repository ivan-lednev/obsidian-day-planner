<script lang="ts" context="module">
  let isSomeInstanceUnderCursor = true;
</script>

<script lang="ts">
  import Hoverable from "./hoverable.svelte";

  let isThisUnderCursor = true;
</script>

<Hoverable
  onMouseEnter={() => {
    isSomeInstanceUnderCursor = true;
    isThisUnderCursor = true;
  }}
  onMouseLeave={() => {
    isSomeInstanceUnderCursor = false;
    isThisUnderCursor = false;
  }}
  let:hovering
>
  {#if isThisUnderCursor || !isSomeInstanceUnderCursor}
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
