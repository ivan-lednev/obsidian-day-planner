<script lang="ts">
  import { Task } from "../../types";

  import MarkdownBlockContent from "./markdown-block-content.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";
  import ScheduledTimeBlock from "./scheduled-time-block.svelte";
  import Hoverable from "./hoverable.svelte";

  export let task: Task;
</script>

<Hoverable let:hovering>
  <ScheduledTimeBlock on:mouseup {task}>
    <MarkdownBlockContent {task}>
      <RenderedMarkdown {task} />
    </MarkdownBlockContent>
    {#if hovering}
      <slot />
    {/if}
  </ScheduledTimeBlock>
</Hoverable>
