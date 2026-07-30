<script lang="ts">
  import type { Snippet } from "svelte";

  import { settingsStore } from "../../global-store/settings";
  import type {
    TimeBlock,
    WithPlacing,
    WithDuration,
  } from "../../time-block-types";
  import type { ActionArray } from "../actions/use-actions";
  import {
    useColoredTimeline,
    useColorsForRelationToNow,
  } from "../hooks/use-color.svelte";
  import { useTimeBlockVisuals } from "../hooks/use-time-block-visuals";

  const {
    children,
    timeBlock,
  }: {
    children: Snippet;
    timeBlock: WithPlacing<WithDuration<TimeBlock>>;
    use?: ActionArray;
  } = $props();

  const { height, offset, width, left } = $derived(
    useTimeBlockVisuals(timeBlock, { settingsStore }),
  );

  const relationToNow = $derived(useColorsForRelationToNow(timeBlock));

  const padding = $derived(
    timeBlock.truncated?.includes("bottom") ? "0 1px 0" : undefined,
  );

  const coloredTimeline = $derived(useColoredTimeline(timeBlock));
  const { normal, muted, faint } = $derived(
    coloredTimeline.properContrastColors,
  );
</script>

<svelte-css-wrapper
  style:display="contents"
  style:--text-faint={faint}
  style:--text-muted={muted}
  style:--text-normal={normal}
  style:--time-block-height={$height}
  style:--time-block-left={left}
  style:--time-block-padding={padding}
  style:--time-block-position="absolute"
  style:--time-block-top={$offset}
  style:--time-block-width={width}
  style:--time-block-box-shadow="var(--planner-time-block-shadow-on-timeline)"
  style:--time-block-border-color={relationToNow.borderColor}
  style:--time-block-bg-color={coloredTimeline.backgroundColor ||
    relationToNow.backgroundColor}
>
  {@render children()}
</svelte-css-wrapper>
