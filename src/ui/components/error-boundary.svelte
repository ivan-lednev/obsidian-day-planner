<script lang="ts">
  import type { Snippet } from "svelte";

  import ErrorMessage from "./error-message.svelte";
  import Callout from "./callout.svelte";
  import { getErrorDescription } from "../../util/error";

  const { children }: { children: Snippet } = $props();
</script>

<svelte:boundary>
  {@render children()}

  {#snippet failed(error)}
    <div class="error-wrapper">
      <Callout type="error">
        <ErrorMessage>
          {getErrorDescription(error)}
        </ErrorMessage>
      </Callout>
    </div>
  {/snippet}
</svelte:boundary>

<style>
  .error-wrapper {
    padding: var(--size-4-2);
  }
</style>
