<script lang="ts">
  import { GripVertical, MoveVertical } from "lucide-svelte";
  import { type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";

  import { getObsidianContext } from "../../context/obsidian-context";
  import type { LogTimeBlock, WithDuration } from "../../time-block-types";
  import { EditMode } from "../hooks/use-edit/types";

  import FloatingControls from "./floating-controls.svelte";
  import LogEditControl from "./log-edit-control.svelte";
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

  const { isEditing } = getObsidianContext();
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
          <LogEditControl
            --expanding-controls-position="absolute"
            {isActive}
            label="Move clock"
            mode={EditMode.DRAG}
            {setIsActive}
            {timeBlock}
          >
            {#snippet icon()}
              <GripVertical class="svg-icon" />
            {/snippet}
          </LogEditControl>
        {/if}
      {/snippet}

      {#snippet bottom({ isActive, setIsActive })}
        {#if !timeBlock.isRunning}
          <LogEditControl
            {isActive}
            label="Move the end of the clock"
            mode={EditMode.RESIZE}
            reverse
            {setIsActive}
            {timeBlock}
          >
            {#snippet icon()}
              <MoveVertical class="svg-icon" />
            {/snippet}
          </LogEditControl>
        {/if}
      {/snippet}

      {#snippet top({ isActive, setIsActive })}
        <LogEditControl
          {isActive}
          label="Move the start of the clock"
          mode={EditMode.RESIZE_FROM_TOP}
          reverse
          {setIsActive}
          {timeBlock}
        >
          {#snippet icon()}
            <MoveVertical class="svg-icon" />
          {/snippet}
        </LogEditControl>
      {/snippet}
    </FloatingControls>
  {/snippet}
</Selectable>
