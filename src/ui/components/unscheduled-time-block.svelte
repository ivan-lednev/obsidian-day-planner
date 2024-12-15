<script lang="ts">
  import type { Snippet } from "svelte";

  import type { LocalTask } from "../../task-types";
  import type { HTMLActionArray } from "../actions/use-actions";

  import RenderedMarkdown from "./rendered-markdown.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  const {
    task,
    children,
    use = [],
  }: {
    task: LocalTask;
    children?: Snippet;
    use?: HTMLActionArray;
  } = $props();
</script>

<TimeBlockBase {task} {use}>
  <RenderedMarkdown {task} />
  {@render children?.()}
</TimeBlockBase>
