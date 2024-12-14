<script lang="ts">
  import { offset } from "@floating-ui/dom";
  import { writable } from "svelte/store";

  import { getObsidianContext } from "../../context/obsidian-context";
  import type { LocalTask, WithPlacing, WithTime } from "../../task-types";
  import * as t from "../../util/task-utils";
  import { createGestures } from "../actions/gestures";
  import { hoverPreview } from "../actions/hover-preview";
  import { pointerUpOutside } from "../actions/pointer-up-outside";
  import type { EditHandlers } from "../hooks/use-edit/create-edit-handlers";
  import { EditMode } from "../hooks/use-edit/types";
  import { useFloatingUi } from "../hooks/use-floating-ui";

  import DragControls from "./drag-controls.svelte";
  import FloatingUi from "./floating-ui.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";
  import ResizeControls from "./resize-controls.svelte";
  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  export let task: WithPlacing<WithTime<LocalTask>>;
  export let onGripMouseDown: EditHandlers["handleGripMouseDown"] | undefined =
    undefined;
  export let onResizerMouseDown:
    | EditHandlers["handleResizerMouseDown"]
    | undefined = undefined;
  export let onFloatingUiPointerDown:
    | ((event: PointerEvent) => void)
    | undefined = undefined;
  export let onpointerup: () => void;

  const floatingUiOffset = 4;

  const {
    editContext: { editOperation },
  } = getObsidianContext();

  const isDragActive = writable(false);
  let isResizeActive = false;

  const drag = useFloatingUi({
    middleware: [offset({ mainAxis: floatingUiOffset })],
    placement: "top-end",
  });

  function createOffsetFnWithFrozenCrossAxis() {
    let initialCrossAxisOffset: number | undefined;

    return ({ rects: { reference, floating } }) => {
      if (initialCrossAxisOffset === undefined) {
        initialCrossAxisOffset = reference.width / 2 - floating.width / 2;
      }

      return {
        mainAxis: floatingUiOffset,
        crossAxis: initialCrossAxisOffset,
      };
    };
  }

  const resize = useFloatingUi({
    middleware: [offset(createOffsetFnWithFrozenCrossAxis())],
    placement: "bottom-start",
  });

  $: timeBlockBoxShadow = $isDragActive
    ? "var(--shadow-stationary), var(--shadow-border-accent)"
    : "";
</script>

<ScheduledTimeBlock
  --time-block-border-color-override={$isDragActive
    ? "var(--color-accent)"
    : ""}
  --time-block-box-shadow={timeBlockBoxShadow}
  {task}
  use={[
    drag.anchorSetup,
    resize.anchorSetup,
    pointerUpOutside(() => {
      $isDragActive = false;
      isResizeActive = false;
    }),
    hoverPreview(task),
    createGestures({
      ontap: () => {
        $isDragActive = true;
        isResizeActive = true;
      },
    }),
  ]}
>
  <RenderedMarkdown {task} />
</ScheduledTimeBlock>

{#if !$editOperation && onFloatingUiPointerDown}
  {#if $isDragActive && onGripMouseDown}
    <FloatingUi
      onPointerDown={onFloatingUiPointerDown}
      onpointerup={(event) => {
        event.stopPropagation();
      }}
      use={[drag.floatingUiSetup]}
    >
      <DragControls
        onCopy={() => {
          onGripMouseDown(t.copy(task), EditMode.DRAG);
        }}
        onMove={() => onGripMouseDown(task, EditMode.DRAG)}
        onMoveWithNeighbors={() => {
          onGripMouseDown(task, EditMode.DRAG_AND_SHIFT_OTHERS);
        }}
        onMoveWithShrink={() => {
          onGripMouseDown(task, EditMode.DRAG_AND_SHRINK_OTHERS);
        }}
      />
    </FloatingUi>
  {/if}

  {#if onResizerMouseDown}
    {#if isResizeActive}
      <FloatingUi
        onPointerDown={onFloatingUiPointerDown}
        use={[resize.floatingUiSetup]}
      >
        <ResizeControls
          onResize={() => {
            onResizerMouseDown(task, EditMode.RESIZE);
          }}
          onResizeWithNeighbors={() => {
            onResizerMouseDown(task, EditMode.RESIZE_AND_SHIFT_OTHERS);
          }}
          onResizeWithShrink={() => {
            onResizerMouseDown(task, EditMode.RESIZE_AND_SHRINK_OTHERS);
          }}
          reverse
        />
      </FloatingUi>
    {/if}
  {/if}
{/if}
