<script lang="ts">
  import { ArrowDownToLine, MoveVertical, FoldVertical } from "lucide-svelte";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";

  export let onResize: () => void;
  export let onResizeWithNeighbors: () => void;
  export let onResizeWithShrink: () => void;
  export let reverse: boolean | undefined = false;
</script>

<ExpandingControls {reverse}>
  <BlockControlButton
    slot="visible"
    cursor="grab"
    label="Resize block"
    on:pointerdown={onResize}
  >
    <MoveVertical class="svg-icon" />
  </BlockControlButton>
  <svelte:fragment slot="hidden">
    <BlockControlButton
      cursor="grab"
      label="Resize block and push neighboring blocks"
      on:pointerdown={onResizeWithNeighbors}
    >
      <ArrowDownToLine class="svg-icon" />
    </BlockControlButton>
    <BlockControlButton
      cursor="grab"
      label="Resize block and shrink neighboring blocks"
      on:pointerdown={onResizeWithShrink}
    >
      <FoldVertical class="svg-icon" />
    </BlockControlButton>
  </svelte:fragment>
</ExpandingControls>
