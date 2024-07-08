<script lang="ts">
  import { ArrowDownToLine, MoveVertical } from "lucide-svelte";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";

  export let onResize: () => void;
  export let onResizeWithNeighbors: () => void;
  export let reverse: boolean | undefined = false;
</script>

<ExpandingControls {reverse}>
  <BlockControlButton
    slot="visible"
    cursor="grab"
    label="Start resizing"
    on:mousedown={onResize}
  >
    <MoveVertical class="svg-icon" />
  </BlockControlButton>
  <svelte:fragment slot="hidden">
    <BlockControlButton
      cursor="grab"
      label="Resize block and push neighboring blocks"
      on:mousedown={onResizeWithNeighbors}
    >
      <ArrowDownToLine class="svg-icon" />
    </BlockControlButton>
  </svelte:fragment>
</ExpandingControls>
