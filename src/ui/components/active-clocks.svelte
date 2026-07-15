<script lang="ts">
  import {
    Play,
    Hourglass,
    File,
    Square,
    EllipsisVertical,
  } from "lucide-svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { currentTimeSignal } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";
  import { selectActiveLogEntries } from "../../redux/index/index-slice";
  import { runWithNoticeOnError } from "../../service/list-item-entry-editor";
  import type { LogTimeBlock } from "../../time-block-types";
  import { removeMarkdownExtension } from "../../util/markdown";
  import * as m from "../../util/moment";
  import { getDiffInMinutes } from "../../util/moment";
  import { createActiveClockMenu } from "../active-clock-menu";

  import BlockControls from "./block-controls.svelte";
  import BlockList from "./block-list.svelte";
  import ControlButton from "./control-button.svelte";
  import LocalTimeBlockComponent from "./local-time-block.svelte";
  import Pill from "./pill.svelte";
  import Properties from "./properties.svelte";
  import Selectable from "./selectable.svelte";

  const {
    workspaceFacade,
    taskEntryEditor,
    openEditTimeEntryModal,
    useSelector,
  } = getObsidianContext();

  const activeLogRecords = useSelector(selectActiveLogEntries);
  // todo: duplication?
  const activeLogRecordsCompat = $derived(
    activeLogRecords.current.map((it) => ({
      ...it,
      durationMinutes: getDiffInMinutes(
        it.startTime,
        currentTimeSignal.current,
      ),
    })),
  );
</script>

<BlockList list={activeLogRecordsCompat}>
  {#snippet match(task: LogTimeBlock)}
    <Selectable
      onSecondarySelect={(event) =>
        createActiveClockMenu({
          event,
          task,
          taskEntryEditor,
          workspaceFacade,
          openEditTimeEntryModal,
        })}
    >
      {#snippet children({ use, onpointerup, state })}
        <LocalTimeBlockComponent
          --time-block-border="1px solid var(--color-accent)"
          isActive={state === "secondary"}
          {onpointerup}
          {task}
          {use}
        >
          {#snippet blockEndDecoration()}
            <!-- TODO: implement controls for frontmatterLog -->
            {#if task.source !== "frontmatterLog"}
              {@const listItemTask = task}
              <BlockControls>
                <ControlButton
                  onclick={async () => {
                    await runWithNoticeOnError(
                      taskEntryEditor.clockOutAtLocation({
                        path: listItemTask.path,
                        line: listItemTask.position.start.line,
                      }),
                    );
                  }}
                >
                  {#snippet icon()}
                    <Square class="svg-icon" />
                  {/snippet}
                </ControlButton>

                <ControlButton
                  onclick={(event: MouseEvent) => {
                    createActiveClockMenu({
                      task: listItemTask,
                      event,
                      taskEntryEditor,
                      workspaceFacade,
                      openEditTimeEntryModal,
                    });
                  }}
                >
                  {#snippet icon()}
                    <EllipsisVertical class="svg-icon" />
                  {/snippet}
                </ControlButton>
              </BlockControls>
            {/if}
          {/snippet}
          {#snippet bottomDecoration()}
            <Properties>
              <Pill
                key={File}
                onclick={async () => {
                  await workspaceFacade.revealLocation(task);
                }}
                value={removeMarkdownExtension(task.path)}
              />
              <Pill
                key={Play}
                value={task.startTime.format($settings.timestampFormat)}
              />
              <Pill
                key={Hourglass}
                value={m
                  .fromDiff(task.startTime, currentTimeSignal.current)
                  .format($settings.timestampFormat)}
              />
            </Properties>
          {/snippet}
        </LocalTimeBlockComponent>
      {/snippet}
    </Selectable>
  {/snippet}
</BlockList>
