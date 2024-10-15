<script lang="ts">
  import { X } from "lucide-svelte";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";

  import { errorContextKey } from "../../constants";
  import { createErrorUrl } from "../../util/create-error-url";

  import ControlButton from "./control-button.svelte";

  const errorStore = getContext<Writable<Error | undefined>>(errorContextKey);

  function dismiss() {
    $errorStore = undefined;
  }
</script>

{#if $errorStore}
  <div class="container">
    <span>
      😵 Something went wrong.
      <a href={createErrorUrl($errorStore)}>Report an issue</a>
    </span>
    <ControlButton
      classes="dismiss-button"
      label="Dismiss error"
      onclick={dismiss}
    >
      <X class="svg-icon" />
    </ControlButton>
    <pre class="error-message">{$errorStore.stack}</pre>
  </div>
{/if}

<style>
  .container {
    display: grid;
    grid-template-columns: 1fr auto;
  }

  .error-message {
    overflow: auto;
    grid-column: 1 / 3;

    max-height: 400px;
    padding: var(--size-4-1);

    font-size: var(--font-ui-smaller);

    border: 1px solid var(--text-error);
    border-radius: var(--radius-s);
  }
</style>
