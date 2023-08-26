<script lang="ts">
  import { ArrowLeftToLine, ArrowRightToLine } from "lucide-svelte";

  import ControlButton from "./control-button.svelte";
</script>

<div class="view-header-nav-buttons">
  <ControlButton label="Show previous week" on:click={() => {}}>
    <ArrowLeftToLine class="svg-icon" />
  </ControlButton>

  <ControlButton label="Show next week" on:click={() => {}}>
    <ArrowRightToLine class="svg-icon" />
  </ControlButton>
</div>
