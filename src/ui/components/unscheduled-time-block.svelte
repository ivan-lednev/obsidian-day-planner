<script lang="ts">
  import { UnscheduledTask } from "../../types";

  import Hoverable from "./hoverable.svelte";
  import MarkdownBlockContent from "./markdown-block-content.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  export let task: UnscheduledTask;
</script>

<TimeBlockBase {task} on:mouseup>
  <Hoverable let:hovering>
    <MarkdownBlockContent {task}>
      <RenderedMarkdown {task} />
    </MarkdownBlockContent>
    {#if hovering}
      <slot />
    {/if}
  </Hoverable>
</TimeBlockBase>
