<script lang="ts">
  export let title: string;

  let isTreeVisible = true;

  function toggleTree() {
    isTreeVisible = !isTreeVisible;
  }
</script>

<div class="container">
  <!--TODO: fade when folded (Obsidian does that)-->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="tree-item-self is-clickable" on:click={toggleTree}>
    <div class="tree-item-inner">{title}</div>
  </div>
  <!--  TODO: add collapse animation-->
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
