<script lang="ts">
  import { Square } from "lucide-svelte";

  import ControlButton from "../control-button.svelte";

  export let onClick: () => void;
</script>

<ControlButton label="Clock out" on:click={onClick}>
  <Square class="svg-icon" />
</ControlButton>
