<script lang="ts">
  import { Task } from "../../types";

  import Hoverable from "./hoverable.svelte";
  import MarkdownBlockContent from "./markdown-block-content.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";
  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  export let task: Task;
</script>

<Hoverable let:hovering>
  <ScheduledTimeBlock {task} on:mouseup>
    <MarkdownBlockContent {task}>
      <RenderedMarkdown {task} />
    </MarkdownBlockContent>
    {#if true}
      <slot />
    {/if}
  </ScheduledTimeBlock>
</Hoverable>
