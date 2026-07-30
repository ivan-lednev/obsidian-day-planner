<script lang="ts">
  import type { Snippet } from "svelte";

  import type { LocalTimeBlock } from "../../time-block-types";
  import { hoverPreview } from "../actions/hover-preview";
  import type { HTMLActionArray } from "../actions/use-actions";

  import FrontmatterLogContent from "./frontmatter-log-content.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  const {
    timeBlock,
    bottomDecoration,
    blockEndDecoration,
    isActive = false,
    use = [],
    onpointerup,
  }: {
    isActive?: boolean;
    timeBlock: LocalTimeBlock;
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
  {timeBlock}
  use={[...use, hoverPreview(timeBlock)]}
>
  {#if timeBlock.source === "frontmatterLog"}
    <FrontmatterLogContent {bottomDecoration} {timeBlock} />
  {:else}
    <RenderedMarkdown {bottomDecoration} {timeBlock} />
  {/if}
</TimeBlockBase>
