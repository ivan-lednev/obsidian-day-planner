<script lang="ts">
  let hovering = false;

  function handleMouseEnter() {
    hovering = true;
  }

  function handleMouseLeave() {
    hovering = false;
  }
</script>

<div
  class="scroller"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:scroll
>
  <div class="stretcher">
    <slot {hovering} />
  </div>
</div>

<style>
  .scroller {
    overflow: auto;
    flex: 1 0 0;
  }

  .stretcher {
    display: flex;
  }
</style>
