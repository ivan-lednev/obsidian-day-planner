<script lang="ts">
  import { Play } from "lucide-svelte";

  export let text: string;
</script>

<div class="button-text">
  <svelte:component this={Play} class="svg-icon" />
  {text}
</div>
