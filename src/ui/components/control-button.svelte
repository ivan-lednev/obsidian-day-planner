<script lang="ts">
  import { type Snippet } from "svelte";

  const {
    label = "",
    isActive = false,
    disabled = false,
    classes,
    onclick,
    children,
  }: {
    label?: string;
    isActive?: boolean;
    disabled?: boolean;
    classes?: string;
    onclick: (event: MouseEvent) => void;
    children: Snippet;
  } = $props();
</script>

<div
  class="clickable-icon {classes}"
  class:is-active={isActive}
  aria-disabled={disabled}
  aria-label={label}
  {onclick}
>
  {@render children()}
</div>

<style>
  .clickable-icon {
    color: var(--color, var(--icon-color));
    white-space: nowrap;
    border: var(--control-button-border, none);
  }
</style>
