<script lang="ts">
  export let title: string;
  import RightTriangle from "./right-triangle.svelte";

  let isTreeVisible = true;

  $: titleColor = isTreeVisible ? "var(--text-muted)" : "var(--text-faint)";

  function toggleTree() {
    isTreeVisible = !isTreeVisible;
  }
</script>

<div class="tree-container">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="tree-item-self is-clickable" on:click={toggleTree}>
    <div
      class="tree-item-icon collapse-icon"
      class:is-collapsed={!isTreeVisible}
    >
      <RightTriangle />
    </div>
    <div style:color={titleColor} class="tree-item-inner">{title}</div>
  </div>
  <!--  TODO: add collapse animation-->
  {#if isTreeVisible}
    <slot />
  {/if}
</div>

<style>
  .tree-container {
    display: flex;
    flex: var(--flex);
    flex-direction: column;
  }

  .tree-item-self {
    border-radius: 0;
  }

  .tree-item-inner {
    font-weight: var(--font-medium);
  }
</style>
