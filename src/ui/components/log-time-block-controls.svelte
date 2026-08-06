<script lang="ts">
  import { GripVertical, MoveVertical } from "lucide-svelte";
  import { type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";

  import { getObsidianContext } from "../../context/obsidian-context";
  import type { LogTimeBlock, WithDuration } from "../../time-block-types";
  import { createGestures } from "../actions/gestures";
  import { EditMode } from "../hooks/use-edit/types";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";
  import FloatingControls from "./floating-controls.svelte";
  import Selectable from "./selectable.svelte";

  interface TimeBlockProps {
    isActive: boolean;
    onPointerUp: (event: PointerEvent) => void;
    gestures: Attachment<HTMLElement>;
    clearOnPointerUpOutside: Attachment<HTMLElement>;
    anchor: Attachment<HTMLElement>;
  }

  const {
    timeBlock,
    onSecondarySelect,
    content,
  }: {
    timeBlock: WithDuration<LogTimeBlock>;
    onSecondarySelect: (event: MouseEvent | PointerEvent | TouchEvent) => void;
    content: Snippet<[TimeBlockProps]>;
  } = $props();

  const {
    isEditing,
    editContext: { startEdit },
  } = getObsidianContext();
</script>

<Selectable {onSecondarySelect} selectionBlocked={$isEditing}>
  {#snippet children({ gestures, clearOnPointerUpOutside, state, onpointerup })}
    <FloatingControls active={state === "primary"}>
      {#snippet anchor({ anchor })}
        {@render content({
          isActive: state !== "none",
          onPointerUp: onpointerup,
          gestures,
          clearOnPointerUpOutside,
          anchor,
        })}
      {/snippet}

      {#snippet topEnd({ isActive, setIsActive })}
        {#if !timeBlock.isRunning}
          <ExpandingControls
            --expanding-controls-position="absolute"
            {isActive}
            {setIsActive}
          >
            {#snippet initial()}
              <BlockControlButton
                cursor="grab"
                label="Move clock"
                {@attach createGestures({
                  onpanmove: () =>
                    startEdit({ timeBlock, mode: EditMode.DRAG }),
                })}
              >
                <GripVertical class="svg-icon" />
              </BlockControlButton>
            {/snippet}
          </ExpandingControls>
        {/if}
      {/snippet}

      {#snippet bottom({ isActive, setIsActive })}
        {#if !timeBlock.isRunning}
          <ExpandingControls {isActive} reverse {setIsActive}>
            {#snippet initial()}
              <BlockControlButton
                cursor="grab"
                label="Move the end of the clock"
                {@attach createGestures({
                  onpanmove: () =>
                    startEdit({ timeBlock, mode: EditMode.RESIZE }),
                })}
              >
                <MoveVertical class="svg-icon" />
              </BlockControlButton>
            {/snippet}
          </ExpandingControls>
        {/if}
      {/snippet}

      {#snippet top({ isActive, setIsActive })}
        <ExpandingControls {isActive} reverse {setIsActive}>
          {#snippet initial()}
            <BlockControlButton
              cursor="grab"
              label="Move the start of the clock"
              {@attach createGestures({
                onpanmove: () =>
                  startEdit({ timeBlock, mode: EditMode.RESIZE_FROM_TOP }),
              })}
            >
              <MoveVertical class="svg-icon" />
            </BlockControlButton>
          {/snippet}
        </ExpandingControls>
      {/snippet}
    </FloatingControls>
  {/snippet}
</Selectable>
