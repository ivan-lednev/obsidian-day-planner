<script lang="ts">
  import type { Snippet } from "svelte";

  import type { LocalTask } from "../../task-types";
  import type { HTMLActionArray } from "../actions/use-actions";

  import RenderedMarkdown from "./rendered-markdown.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  const {
    task,
    children,
    isActive = false,
    use = [],
    onpointerup,
  }: {
    isActive?: boolean;
    task: LocalTask;
    children?: Snippet;
    use?: HTMLActionArray;
    onpointerup?: (event: PointerEvent) => void;
  } = $props();
</script>

<TimeBlockBase
  --time-block-border-color-override={isActive ? "var(--color-accent)" : ""}
  --time-block-box-shadow={isActive
    ? "var(--shadow-stationary), var(--shadow-border-accent)"
    : ""}
  {onpointerup}
  {task}
  {use}
>
  <RenderedMarkdown {task} />
  {@render children?.()}
</TimeBlockBase>
