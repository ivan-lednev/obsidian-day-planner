<script lang="ts">
  import { currentTime } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";
  import type { Task } from "../../types";
  import { useTaskVisuals } from "../hooks/use-task-visuals";

  import TaskComponent from "./task.svelte";

  export let task: Task;

  $: ({ height, offset, relationToNow, backgroundColor, properContrastColors } =
    useTaskVisuals(task, {
      settings,
      currentTime,
    }));
</script>

<TaskComponent
  --task-background-color={$backgroundColor}
  --task-height="{$height}px"
  --task-offset="{$offset}px"
  --task-position="absolute"
  --text-faint={$properContrastColors.faint}
  --text-muted={$properContrastColors.muted}
  --text-normal={$properContrastColors.normal}
  relationToNow={$relationToNow}
  {task}
  on:mouseup
>
  <slot />
</TaskComponent>
