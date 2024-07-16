<script lang="ts">
  import { UnscheduledTask } from "../../types";
  import { ActionArray } from "../actions/use-actions";

  import MarkdownBlockContent from "./markdown-block-content.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  export let task: UnscheduledTask;
  export let use: ActionArray = [];
</script>

<TimeBlockBase {task} {use} on:pointerup>
  <MarkdownBlockContent {task}>
    <RenderedMarkdown {task} />
  </MarkdownBlockContent>
</TimeBlockBase>
