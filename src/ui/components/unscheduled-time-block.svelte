<script lang="ts">
  import { UnscheduledTask } from "../../types";

  import Grip from "./grip.svelte";
  import MarkdownBlockContent from "./markdown-block-content.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  export let task: UnscheduledTask;
  export let gripCursor: string;
  export let onGripMouseDown: () => void;
</script>

<TimeBlockBase {task} on:mouseup>
  <MarkdownBlockContent {task}>
    <RenderedMarkdown {task} />
    <Grip cursor={gripCursor} on:mousedown={onGripMouseDown} />
  </MarkdownBlockContent>
</TimeBlockBase>
