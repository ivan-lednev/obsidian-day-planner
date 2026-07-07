<script lang="ts">
  import { File, Play } from "lucide-svelte";
  import { isNotVoid } from "typed-assert";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { selectRecentLogEntries } from "../../redux/index/index-selectors";
  import type { LocalTask } from "../../task-types";
  import { createRecentClockMenu } from "../recent-clock-menu";

  import { runWithNoticeOnError } from "./../../service/list-item-entry-editor";
  import BlockControls from "./block-controls.svelte";
  import BlockList from "./block-list.svelte";
  import ControlButton from "./control-button.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Pill from "./pill.svelte";
  import Properties from "./properties.svelte";
  import Selectable from "./selectable.svelte";

  const { workspaceFacade, useSelector, taskEntryEditor, settingsSignal } =
    getObsidianContext();

  const recentLogRecords = useSelector((state) =>
    selectRecentLogEntries(state),
  );
</script>

<BlockList list={recentLogRecords.current}>
  {#snippet titleMatch(title: string)}
    <div class="section-title">
      {#if window.moment(title).isSame(window.moment(), "day")}
        Today,
      {/if}
      {window.moment(title).format(settingsSignal.current.timelineDateFormat)}
    </div>
  {/snippet}
  {#snippet match(task: LocalTask)}
    <Selectable
      onSecondarySelect={(event) =>
        createRecentClockMenu({
          event,
          task,
          taskEntryEditor,
          workspaceFacade,
        })}
    >
      {#snippet children({ use, onpointerup, state })}
        <LocalTimeBlock
          isActive={state === "secondary"}
          {onpointerup}
          {task}
          {use}
        >
          {#snippet blockEndDecoration()}
            <BlockControls>
              <ControlButton
                label="Start tracking time on this task"
                onclick={async () => {
                  isNotVoid(task.location);

                  await runWithNoticeOnError(
                    taskEntryEditor.clockInAtLocation({
                      path: task.location.path,
                      line: task.location.position.start.line,
                    }),
                  );
                }}
              >
                {#snippet icon()}
                  <Play class="svg-icon" />
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
                  value={task.location.path.replace(/\.md$/, "")}
                />
              {/if}
            </Properties>
          {/snippet}
        </LocalTimeBlock>
      {/snippet}
    </Selectable>
  {/snippet}
</BlockList>

<style>
  .section-title {
    margin-bottom: var(--size-4-3);
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-muted);
    margin-top: var(--size-4-3);
    margin-inline-start: var(--size-4-4);
  }

  .section-title:not(:first-child) {
    margin-top: var(--size-4-4);
  }
</style>
