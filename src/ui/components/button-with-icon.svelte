<div class="clickable-icon button-with-icon" on:click>
  <slot />
</div>

<style>
  .button-with-icon {
    display: flex;
    justify-content: flex-start;
    gap: var(--size-4-1);
  }
</style>
