<script lang="ts">
  const props = $props();
</script>

<div class={["setting-item", props.class]}>
  <div class="setting-item-info">
    <div class="setting-item-name">
      {@render props.name()}
    </div>
  </div>
  <div class="setting-item-control">
    {@render props.control()}
  </div>
</div>

<style>
  .setting-item {
    padding: var(--size-2-3) 0;
  }

  .setting-item-name {
    font-size: var(--font-ui-small);
  }
</style>
