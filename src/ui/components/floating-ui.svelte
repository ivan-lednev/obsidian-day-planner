<script lang="ts">
  import { type Snippet } from "svelte";
  import { portal } from "svelte-portal";

  interface Props {
    children: Snippet;
    onpointerup?: (event: PointerEvent) => void;
  }

  let { children, onpointerup = () => {}, ...rest }: Props = $props();
</script>

<div class="floating-ui" {onpointerup} use:portal {...rest}>
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
