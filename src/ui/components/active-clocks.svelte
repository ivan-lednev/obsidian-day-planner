<script lang="ts">
  import { PlaneTakeoff, Clock3 } from "lucide-svelte";
  import { Menu } from "obsidian";
  import { isNotVoid } from "typed-assert";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { currentTimeSignal } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";
  import type { LocalTask } from "../../task-types";
  import * as c from "../../util/clock";
  import * as m from "../../util/moment";

  import BlockList from "./block-list.svelte";
  import Pill from "./pill.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const { workspaceFacade, tasksWithActiveClockProps, sTaskEditor } =
    getObsidianContext();

  function handleActiveClockPointerUp(event: PointerEvent, task: LocalTask) {
    const menu = new Menu();
    const { location } = task;

    // todo: remove when types are fixed
    isNotVoid(location);

    const {
      path,
      position: {
        start: { line },
      },
    } = location;

    menu.addItem((item) =>
      item
        .setTitle("Clock out")
        .setIcon("square")
        .onClick(() => {
          sTaskEditor.edit({ path, line, editFn: c.withActiveClockCompleted });
        }),
    );

    menu.addItem((item) => {
      item
        .setTitle("Cancel clock")
        .setIcon("trash-2")
        .onClick(() => {
          sTaskEditor.edit({ path, line, editFn: c.withoutActiveClock });
        });
    });

    menu.addItem((item) => {
      item
        .setTitle("Reveal task in file")
        .setIcon("file-input")
        .onClick(async () => {
          await workspaceFacade.revealLineInFile(path, line);
        });
    });

    menu.showAtMouseEvent(event);
  }
</script>

<BlockList list={$tasksWithActiveClockProps}>
  {#snippet match(task: LocalTask)}
    <UnscheduledTimeBlock
      --time-block-padding="var(--size-4-1)"
      onpointerup={(event) => handleActiveClockPointerUp(event, task)}
      {task}
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
    </UnscheduledTimeBlock>
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
