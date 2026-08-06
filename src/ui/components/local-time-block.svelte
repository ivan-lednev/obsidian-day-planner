<script lang="ts">
  import type { Snippet } from "svelte";

  import type { LocalTimeBlock } from "../../time-block-types";
  import { hoverPreview } from "../actions/hover-preview";

  import FrontmatterLogContent from "./frontmatter-log-content.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  interface Props {
    isActive?: boolean;
    timeBlock: LocalTimeBlock;
    bottomDecoration?: Snippet;
    blockEndDecoration?: Snippet;
    onpointerup?: (event: PointerEvent) => void;
  }

  const {
    timeBlock,
    bottomDecoration,
    blockEndDecoration,
    isActive = false,
    onpointerup,
    ...rest
  }: Props = $props();
</script>

<TimeBlockBase
  --time-block-border-color-override={isActive ? "var(--color-accent)" : ""}
  --time-block-box-shadow={isActive
    ? "var(--shadow-stationary), var(--shadow-border-accent)"
    : ""}
  {blockEndDecoration}
  {onpointerup}
  {timeBlock}
  {...rest}
  {@attach hoverPreview(timeBlock)}
>
  {#if timeBlock.source === "frontmatterLog"}
    <FrontmatterLogContent {bottomDecoration} {timeBlock} />
  {:else}
    <RenderedMarkdown {bottomDecoration} {timeBlock} />
  {/if}
</TimeBlockBase>
