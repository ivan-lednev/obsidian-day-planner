<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">
      <slot name="name" />
    </div>
  </div>
  <div class="setting-item-control">
    <slot name="control" />
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
