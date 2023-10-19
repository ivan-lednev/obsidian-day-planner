<script lang="ts">
  import { currentTime } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";
  import type { PlanItem } from "../../types";
  import { useTaskVisuals } from "../hooks/use-task-visuals";

  import Task from "./task.svelte";

  export let planItem: PlanItem;

  $: ({ height, offset, relationToNow, backgroundColor, properContrastColors } =
    useTaskVisuals(planItem, {
      settings,
      currentTime,
    }));
</script>

<Task
  --offset="{$offset}px"
  --position="absolute"
  --task-background-color={$backgroundColor}
  --task-height="{$height}px"
  --text-faint={$properContrastColors.faint}
  --text-muted={$properContrastColors.muted}
  --text-normal={$properContrastColors.normal}
  {planItem}
  relationToNow={$relationToNow}
  on:mouseup
>
  <slot />
</Task>
