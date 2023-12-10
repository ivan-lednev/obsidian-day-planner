<script lang="ts">
  import { Trash2 } from "lucide-svelte";
  
import ControlButton from "../control-button.svelte";
  
export let onClick: () => void;
</script>

<ControlButton label="Cancel clock" on:click={onClick}>
  <Trash2 class="svg-icon" />
</ControlButton>
