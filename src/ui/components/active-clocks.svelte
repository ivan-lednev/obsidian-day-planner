<script lang="ts">
  import {
    Play,
    Hourglass,
    File,
    Square,
    EllipsisVertical,
  } from "lucide-svelte";
  import { isNotVoid } from "typed-assert";

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
            <BlockControls>
              <ControlButton
                onclick={async () => {
                  isNotVoid(task.location);

                  await runWithNoticeOnError(
                    taskEntryEditor.clockOutAtLocation({
                      path: task.location.path,
                      line: task.location.position.start.line,
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
                    task,
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
          {/snippet}
          {#snippet bottomDecoration()}
            <Properties>
              {#if task.location?.path}
                <Pill
                  key={File}
                  onclick={() => {
                    isNotVoid(task.location);

                    return workspaceFacade.revealLineInFile(
                      task.location.path,
                      task.location.position.start.line,
                    );
                  }}
                  value={removeMarkdownExtension(task.location.path)}
                />
              {/if}
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
