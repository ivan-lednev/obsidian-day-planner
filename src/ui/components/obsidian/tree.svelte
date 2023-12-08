<script lang="ts">
  export let title: string;

  let isTreeVisible = true;

  function toggleTree() {
    isTreeVisible = !isTreeVisible;
  }
</script>

<!--  TODO: add collapse animation-->
<!--TODO: fade when folded (Obsidian does that)-->
<div class="container">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="tree-item-self is-clickable" on:click={toggleTree}>
    <div class="tree-item-inner">{title}</div>
  </div>
  {#if isTreeVisible}
    <slot />
  {/if}
</div>

<style>
  .tree-item-self {
    padding-left: var(--size-4-2);
  }

  .tree-item-inner {
    font-weight: var(--font-medium);
  }
</style>
