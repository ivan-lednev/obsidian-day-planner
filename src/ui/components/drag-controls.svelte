<script lang="ts">
  import {
    FoldVertical,
    ArrowDownToLine,
    GripVertical,
    Copy,
  } from "lucide-svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import type { EditableTimeBlock } from "../../time-block-types";
  import { createGestures } from "../actions/gestures";
  import { EditMode } from "../hooks/use-edit/types";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";

  export let isActive: boolean;
  export let setIsActive: (value: boolean) => void;
  export let timeBlock: EditableTimeBlock;

  const {
    editContext: { lanes },
  } = getObsidianContext();
</script>

<ExpandingControls {isActive} {setIsActive}>
  {#snippet initial()}
    <BlockControlButton
      cursor="grab"
      label="Move block"
      {@attach createGestures({
        onpanmove: () =>
          lanes.plan.startEdit({ timeBlock, mode: EditMode.DRAG }),
      })}
    >
      <GripVertical class="svg-icon" />
    </BlockControlButton>
  {/snippet}
  {#snippet expanded()}
    <BlockControlButton
      cursor="grab"
      label="Copy block"
      {@attach createGestures({
        onpanmove: () => lanes.plan.startCopy(timeBlock),
      })}
    >
      <Copy class="svg-icon" />
    </BlockControlButton>

    {#if !timeBlock.isAllDayEvent}
      <BlockControlButton
        cursor="grab"
        label="Move block and push neighboring blocks"
        {@attach createGestures({
          onpanmove: () =>
            lanes.plan.startEdit({
              timeBlock,
              mode: EditMode.DRAG_AND_SHIFT_OTHERS,
            }),
        })}
      >
        <ArrowDownToLine class="svg-icon" />
      </BlockControlButton>
      <BlockControlButton
        cursor="grab"
        label="Move block and shrink neighboring blocks"
        {@attach createGestures({
          onpanmove: () =>
            lanes.plan.startEdit({
              timeBlock,
              mode: EditMode.DRAG_AND_SHRINK_OTHERS,
            }),
        })}
      >
        <FoldVertical class="svg-icon" />
      </BlockControlButton>
    {/if}
  {/snippet}
</ExpandingControls>
