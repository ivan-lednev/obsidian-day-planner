<script lang="ts">
  let {
    el = $bindable(),
    columnCount,
  }: { el?: HTMLDivElement; columnCount: number } = $props();
</script>

<div
  bind:this={el}
  style:--column-count={columnCount}
  class="column-tracks-wrapper"
>
  {#each Array.from({ length: columnCount }) as _, index}
    <div style:grid-column={index + 1} class="border"></div>
  {/each}
</div>

<style>
  .column-tracks-wrapper {
    position: absolute;
    z-index: -1;
    inset: 0 var(--scrollbar-width) 0 0;

    overflow-x: hidden;
    display: grid;
    grid-template-columns: repeat(
      var(--column-count),
      minmax(var(--cell-flex-basis), 1fr)
    );
  }

  .border {
    border-right: 1px solid var(--background-modifier-border);
  }
</style>
