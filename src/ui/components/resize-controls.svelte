<script lang="ts">
  import { ArrowDownToLine, MoveVertical, FoldVertical } from "lucide-svelte";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";

  export let onResize: (event: PointerEvent) => void;
  export let onResizeWithNeighbors: (event: PointerEvent) => void;
  export let onResizeWithShrink: (event: PointerEvent) => void;
  export let onPointerDown: (event: PointerEvent) => void | undefined =
    undefined;
  export let reverse: boolean | undefined = false;
</script>

<ExpandingControls {reverse} on:pointerdown={onPointerDown}>
  <BlockControlButton
    slot="visible"
    cursor="grab"
    label="Resize block"
    on:pointerdown={(event) => {
      if (isActive) {
        onResize(event);
      }
    }}
    let:isActive
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
