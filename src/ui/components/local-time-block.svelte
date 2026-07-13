<script lang="ts">
  import type { Snippet } from "svelte";

  import type { LocalTimeBlock } from "../../time-block-types";
  import { hoverPreview } from "../actions/hover-preview";
  import type { HTMLActionArray } from "../actions/use-actions";

  import RenderedMarkdown from "./rendered-markdown.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  const {
    task,
    bottomDecoration,
    blockEndDecoration,
    isActive = false,
    use = [],
    onpointerup,
  }: {
    isActive?: boolean;
    task: LocalTimeBlock;
    bottomDecoration?: Snippet;
    blockEndDecoration?: Snippet;
    use?: HTMLActionArray;
    onpointerup?: (event: PointerEvent) => void;
  } = $props();
</script>

<TimeBlockBase
  --time-block-border-color-override={isActive ? "var(--color-accent)" : ""}
  --time-block-box-shadow={isActive
    ? "var(--shadow-stationary), var(--shadow-border-accent)"
    : ""}
  {blockEndDecoration}
  {onpointerup}
  {task}
  use={[...use, hoverPreview(task)]}
>
  <RenderedMarkdown {task}>
    {@render bottomDecoration?.()}
  </RenderedMarkdown>
</TimeBlockBase>
