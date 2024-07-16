<script lang="ts">
  import { Task } from "../../types";
  import { ActionArray } from "../actions/use-actions";

  import MarkdownBlockContent from "./markdown-block-content.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";
  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  export let task: Task;
  export let use: ActionArray = [];
</script>

<ScheduledTimeBlock {task} {use} on:pointerup>
  <MarkdownBlockContent {task}>
    <RenderedMarkdown {task} />
  </MarkdownBlockContent>
</ScheduledTimeBlock>
