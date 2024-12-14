<script lang="ts">
  import type { ActionArray } from "../actions/use-actions";
  import { useActions } from "../actions/use-actions";

  export let cursor: string | undefined = "";
  export let label: string;
  export let use: ActionArray = [];
</script>

<div
  style:cursor
  class="clickable-icon"
  aria-label={label}
  use:useActions={use}
>
  <slot />
</div>

<style>
  .clickable-icon {
    padding: var(--size-2-2) var(--size-4-2);
  }
</style>
