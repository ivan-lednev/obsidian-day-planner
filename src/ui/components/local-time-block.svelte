<script lang="ts">
  import { Task } from "../../types";

  import Grip from "./grip.svelte";
  import MarkdownBlockContent from "./markdown-block-content.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";
  import ResizeHandle from "./resize-handle.svelte";
  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  export let task: Task;
  export let gripCursor: string;
  export let onGripMouseDown: (event: MouseEvent) => void;
  export let isResizeHandleVisible: boolean;
  export let onResizerMouseDown: (event: MouseEvent) => void;
</script>

<ScheduledTimeBlock {task} on:mouseup>
  <MarkdownBlockContent>
    <RenderedMarkdown {task} />
    <Grip cursor={gripCursor} on:mousedown={onGripMouseDown} />
    <ResizeHandle
      visible={isResizeHandleVisible}
      on:mousedown={onResizerMouseDown}
    />
  </MarkdownBlockContent>
</ScheduledTimeBlock>
