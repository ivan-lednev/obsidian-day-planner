<script lang="ts">
  import Hoverable from "./hoverable.svelte";
</script>

<Hoverable let:hovering>
  <div class="expanding-controls">
    {#if hovering}
      <slot name="hidden" />
    {/if}
    <slot name="visible" />
  </div>
</Hoverable>

<style>
  /*  TODO: add variables */
  .expanding-controls {
    overflow: hidden;
    display: flex;

    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
  }
</style>
