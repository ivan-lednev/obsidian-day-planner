<script lang="ts">
  import type { Snippet } from "svelte";

  import { settings } from "../../global-store/settings";
  import type { Task, WithPlacing, WithTime } from "../../task-types";
  import type { ActionArray } from "../actions/use-actions";
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
</script>

<svelte-css-wrapper
  style:display="contents"
  style:--time-block-height={$height}
  style:--time-block-left={left}
  style:--time-block-position="absolute"
  style:--time-block-top={$offset}
  style:--time-block-width={width}
>
  {@render children()}
</svelte-css-wrapper>
