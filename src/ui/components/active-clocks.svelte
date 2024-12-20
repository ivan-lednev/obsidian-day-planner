<script lang="ts">
  import { PlaneTakeoff, Clock3 } from "lucide-svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { currentTimeSignal } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";
  import type { LocalTask } from "../../task-types";
  import * as m from "../../util/moment";
  import { createActiveClockMenu } from "../active-clock-menu";

  import BlockList from "./block-list.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Pill from "./pill.svelte";
  import Selectable from "./selectable.svelte";

  const { workspaceFacade, tasksWithActiveClockProps, sTaskEditor } =
    getObsidianContext();
</script>

<BlockList list={$tasksWithActiveClockProps}>
  {#snippet match(task: LocalTask)}
    <Selectable
      onSecondarySelect={(event) =>
        createActiveClockMenu({
          event,
          task,
          sTaskEditor,
          workspaceFacade,
        })}
    >
      {#snippet children({ use, onpointerup, state })}
        <LocalTimeBlock
          --time-block-padding="var(--size-4-1)"
          isActive={state === "secondary"}
          {onpointerup}
          {task}
          {use}
        >
          <div class="properties-wrapper">
            <Pill
              key={PlaneTakeoff}
              value={task.startTime.format($settings.timestampFormat)}
            />
            <Pill
              key={Clock3}
              value={m
                .fromDiff(task.startTime, currentTimeSignal.current)
                .format($settings.timestampFormat)}
            />
          </div>
        </LocalTimeBlock>
      {/snippet}
    </Selectable>
  {/snippet}
</BlockList>

<style>
  .properties-wrapper {
    display: flex;
    gap: var(--size-4-1);
    align-items: center;
    padding: var(--size-4-1);
  }
</style>
