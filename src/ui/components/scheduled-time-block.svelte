<script lang="ts">
  import type { Snippet } from "svelte";

  import { settings } from "../../global-store/settings";
  import type { Task, WithPlacing, WithTime } from "../../task-types";
  import type { ActionArray } from "../actions/use-actions";
  import { useTaskVisuals } from "../hooks/use-task-visuals";

  import TimeBlockBase from "./time-block-base.svelte";

  const {
    children,
    task,
    use = [],
  }: {
    children: Snippet;
    task: WithPlacing<WithTime<Task>>;
    use?: ActionArray;
  } = $props();

  const { height, offset, width, left } = $derived(
    useTaskVisuals(task, { settings }),
  );
</script>

<TimeBlockBase
  --time-block-height={$height}
  --time-block-left={left}
  --time-block-position="absolute"
  --time-block-top={$offset}
  --time-block-width={width}
  {task}
  {use}
  on:tap
  on:longpress
  on:pointerup
  on:pointerenter
  on:pointerleave
>
  {@render children()}
</TimeBlockBase>
