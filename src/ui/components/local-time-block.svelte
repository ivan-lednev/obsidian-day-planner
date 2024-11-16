<script lang="ts">
  import { offset } from "@floating-ui/dom";

  import { vibrationDurationMillis } from "../../constants";
  import { getObsidianContext } from "../../context/obsidian-context";
  import type { LocalTask, WithPlacing, WithTime } from "../../task-types";
  import * as t from "../../util/task-utils";
  import { hoverPreview } from "../actions/hover-preview";
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

  const {
    editContext: { editOperation },
  } = getObsidianContext();

  const drag = useFloatingUi({
    middleware: [offset({ mainAxis: -32 })],
    placement: "top-end",
  });

  const { isActive: isDragActive } = drag;

  const resize = useFloatingUi({
    middleware: [offset({ mainAxis: -4 })],
    placement: "bottom",
  });

  const { isActive: isResizeActive } = resize;

  const resizeFromTop = useFloatingUi({
    middleware: [offset({ mainAxis: -4 })],
    placement: "top",
  });

  const { isActive: isResizeFromTopActive } = resizeFromTop;
</script>

<ScheduledTimeBlock
  on:longpress={() => {
    navigator?.vibrate(vibrationDurationMillis);
    isDragActive.set(true);
    isResizeActive.set(true);
    isResizeFromTopActive.set(true);
  }}
  on:pointerenter={(event) => {
    drag.handleAnchorPointerEnter(event);
    resize.handleAnchorPointerEnter(event);
    resizeFromTop.handleAnchorPointerEnter(event);
  }}
  on:pointerleave={(event) => {
    drag.handleAnchorPointerLeave(event);
    resize.handleAnchorPointerLeave(event);
    resizeFromTop.handleAnchorPointerLeave(event);
  }}
  on:pointerup={onpointerup}
  {task}
  use={[
    drag.anchorSetup,
    resize.anchorSetup,
    resizeFromTop.anchorSetup,
    (el: HTMLElement) => hoverPreview(el, task),
  ]}
>
  <RenderedMarkdown {task} />
</ScheduledTimeBlock>

{#if !$editOperation && onFloatingUiPointerDown}
  {#if $isDragActive && onGripMouseDown}
    <FloatingUi
      onPointerDown={onFloatingUiPointerDown}
      onPointerLeave={drag.handleFloatingUiPointerLeave}
      onTapOutside={drag.handleFloatingUiTapOutside}
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
    {#if $isResizeActive}
      <FloatingUi
        onPointerDown={onFloatingUiPointerDown}
        onPointerLeave={resize.handleFloatingUiPointerLeave}
        onTapOutside={resize.handleFloatingUiTapOutside}
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
        />
      </FloatingUi>
    {/if}

    {#if $isResizeFromTopActive}
      <FloatingUi
        onPointerDown={onFloatingUiPointerDown}
        onPointerLeave={resizeFromTop.handleFloatingUiPointerLeave}
        onTapOutside={resizeFromTop.handleFloatingUiTapOutside}
        use={[resizeFromTop.floatingUiSetup]}
      >
        <ResizeControls
          onResize={() => {
            onResizerMouseDown(task, EditMode.RESIZE_FROM_TOP);
          }}
          onResizeWithNeighbors={() => {
            onResizerMouseDown(task, EditMode.RESIZE_FROM_TOP_AND_SHIFT_OTHERS);
          }}
          onResizeWithShrink={() => {
            onResizerMouseDown(
              task,
              EditMode.RESIZE_FROM_TOP_AND_SHRINK_OTHERS,
            );
          }}
          reverse
        />
      </FloatingUi>
    {/if}
  {/if}
{/if}
