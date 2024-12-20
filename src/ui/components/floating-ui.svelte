<script lang="ts">
  import { type Snippet } from "svelte";
  import { portal } from "svelte-portal";

  import type { ActionArray } from "../actions/use-actions";
  import { useActions } from "../actions/use-actions";

  interface Props {
    children: Snippet;
    use?: ActionArray;
    onpointerup?: (event: PointerEvent) => void;
  }

  let { children, use = [], onpointerup = () => {} }: Props = $props();
</script>

<div class="floating-ui" {onpointerup} use:portal use:useActions={use}>
  {@render children()}
</div>

<style>
  .floating-ui {
    position: absolute;
    z-index: 9999;
    top: 0;
    left: 0;

    width: max-content;
  }
</style>
