<script lang="ts">
  import type { ActionArray } from "../actions/use-actions";
  import { useActions } from "../actions/use-actions";

  export let cursor: string | undefined = "";
  export let isWarning: boolean = false;
  export let label: string;
  export let use: ActionArray = [];
</script>

<div
  style:cursor
  class="clickable-icon"
  class:is-warning={isWarning}
  aria-label={label}
  use:useActions={use}
>
  <slot />
</div>

<style>
  .is-warning {
    color: var(--text-error);
  }

  .clickable-icon {
    padding: var(--size-2-2) var(--size-4-2);
  }
</style>
