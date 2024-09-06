<script lang="ts">
  import { currentTime } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";
  import type { Task } from "../../types";
  import type { ActionArray } from "../actions/use-actions";
  import { useTaskVisuals } from "../hooks/use-task-visuals";

  import TimeBlockBase from "./time-block-base.svelte";

  export let task: Task;
  export let use: ActionArray = [];

  $: ({
    height,
    offset,
    width,
    left,
    backgroundColor,
    borderColor,
    properContrastColors,
  } = useTaskVisuals(task, {
    settings,
    currentTime,
  }));
</script>

<TimeBlockBase
  --text-faint={$properContrastColors.faint}
  --text-muted={$properContrastColors.muted}
  --text-normal={$properContrastColors.normal}
  --time-block-bg-color={$backgroundColor}
  --time-block-border-color={$borderColor}
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
  <slot />
</TimeBlockBase>
