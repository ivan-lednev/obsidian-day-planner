<script lang="ts">
  import type { Snippet } from "svelte";

  import { settings } from "../../global-store/settings";
  import type { Task, WithPlacing, WithTime } from "../../task-types";
  import type { ActionArray } from "../actions/use-actions";
  import {
    useColoredTimeline,
    useStylesForRelationToNow,
  } from "../hooks/use-color.svelte";
  import { useTaskVisuals } from "../hooks/use-task-visuals";

  const {
    children,
    task,
  }: {
    children: Snippet;
    task: WithPlacing<WithTime<Task>>;
    use?: ActionArray;
  } = $props();

  const { height, offset, width, left } = $derived(
    useTaskVisuals(task, { settings }),
  );

  const relationToNow = $derived(useStylesForRelationToNow(task));

  const coloredTimeline = $derived(useColoredTimeline(task));
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
  style:--time-block-position="absolute"
  style:--time-block-top={$offset}
  style:--time-block-width={width}
  style:--time-block-box-shadow="var(--time-block-shadow-on-timeline)"
  style:--time-block-border-color={relationToNow.borderColor}
  style:--time-block-bg-color={coloredTimeline.backgroundColor ||
    relationToNow.backgroundColor}
>
  {@render children()}
</svelte-css-wrapper>
