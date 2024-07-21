<script lang="ts">
  import { offset } from "@floating-ui/dom";
  import { getContext } from "svelte";
  // TODO: fix eslint error
  // eslint-disable-next-line import/default
  import TinyGesture from "tinygesture";

  import { obsidianContext } from "../../constants";
  import { ObsidianContext, UnscheduledTask } from "../../types";
  import { isTouchEvent } from "../../util/util";
  import { EditHandlers } from "../hooks/use-edit/create-edit-handlers";
  import { useFloatingUi } from "../hooks/use-floating-ui";

  import DragControls from "./drag-controls.svelte";
  import FloatingUi from "./floating-ui.svelte";
  import MarkdownBlockContent from "./markdown-block-content.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  export let task: UnscheduledTask;
  export let onGripMouseDown: EditHandlers["handleUnscheduledTaskGripMouseDown"];
  export let onMouseUp: () => void;

  const {
    editContext: { editOperation },
  } = getContext<ObsidianContext>(obsidianContext);

  const drag = useFloatingUi({
    middleware: [offset({ mainAxis: -32, crossAxis: -4 })],
    placement: "top-end",
  });

  const { isActive } = drag;

  // todo: remove duplication
  function tap(el: HTMLElement) {
    const gesture = new TinyGesture(el);

    let pressed = false;

    gesture.on("tap", () => {
      if (pressed) {
        return;
      }

      onMouseUp();
    });

    gesture.on("longpress", () => {
      pressed = true;

      // todo: handle desktop warning
      navigator.vibrate(100);
      isActive.set(true);
    });

    gesture.on("panend", () => {
      if (pressed) {
        setTimeout(() => {
          pressed = false;
        }, 0);
      }
    });

    return {
      destroy() {
        gesture.destroy();
      },
    };
  }
</script>

<TimeBlockBase
  {task}
  use={[drag.anchorSetup, tap]}
  on:pointerup={(event) => {
    if (!isTouchEvent(event)) {
      onMouseUp();
    }
  }}
  on:pointerenter={drag.handleAnchorPointerEnter}
  on:pointerleave={drag.handleAnchorPointerLeave}
>
  <MarkdownBlockContent {task}>
    <RenderedMarkdown {task} />
  </MarkdownBlockContent>
</TimeBlockBase>

{#if !$editOperation}
  {#if $isActive}
    <FloatingUi
      onPointerLeave={drag.handleFloatingUiPointerLeave}
      onTapOutside={drag.handleFloatingUiTapOutside}
      use={[drag.floatingUiSetup]}
    >
      <DragControls onMove={() => onGripMouseDown(task)} />
    </FloatingUi>
  {/if}
{/if}
