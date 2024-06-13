<script lang="ts">
  import {
    ArrowDownToLine,
    Copy,
    GripVertical,
    MoveVertical,
  } from "lucide-svelte";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";

  export let onMove: () => void;
  export let onMoveWithNeighbors: () => void;
  export let onCopy: () => void;
  export let onResize: () => void;
  export let onResizeWithNeighbors: () => void;
</script>

<ExpandingControls --right="4px" --top="4px">
  <BlockControlButton
    slot="visible"
    cursor="grab"
    label="Start moving"
    on:mousedown={onMove}
  >
    <GripVertical class="svg-icon" />
  </BlockControlButton>
  <svelte:fragment slot="hidden">
    <BlockControlButton
      cursor="grab"
      label="Start copying"
      on:mousedown={onCopy}
    >
      <Copy class="svg-icon" />
    </BlockControlButton>
    <BlockControlButton
      cursor="grab"
      label="Move block and push neighboring blocks"
      on:mousedown={onMoveWithNeighbors}
    >
      <ArrowDownToLine class="svg-icon" />
    </BlockControlButton>
  </svelte:fragment>
</ExpandingControls>
<ExpandingControls --bottom="-14px" --right="40px">
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
