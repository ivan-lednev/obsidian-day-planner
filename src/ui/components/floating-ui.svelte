<script lang="ts">
  import { portal } from "svelte-portal";

  import type { ActionArray } from "../actions/use-actions";
  import { useActions } from "../actions/use-actions";
  import { type Snippet } from "svelte";

  interface Props {
    children: Snippet;
    use?: ActionArray;
    onPointerDown?: (event: PointerEvent) => void;
    onpointerup?: (event: PointerEvent) => void;
  }

  let {
    children,
    use = [],
    onPointerDown = () => {},
    onpointerup = () => {},
  }: Props = $props();
</script>

<div
  class="floating-ui"
  onpointerdown={onPointerDown}
  {onpointerup}
  use:portal
  use:useActions={use}
>
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
