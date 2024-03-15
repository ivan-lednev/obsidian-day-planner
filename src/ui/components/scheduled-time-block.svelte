<script lang="ts">
  import { currentTime } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";
  import { Task } from "../../types";
  import { useTaskVisuals } from "../hooks/use-task-visuals";

  import TimeBlockBase from "./time-block-base.svelte";

  export let task: Task;

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
  on:mouseup
>
  <slot/>
</TimeBlockBase>
