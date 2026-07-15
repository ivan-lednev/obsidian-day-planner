<script lang="ts">
  import { debounce } from "lodash";
  import { groupBy } from "lodash/fp";
  import { File, Play } from "lucide-svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { selectRecentLogEntries } from "../../redux/index/index-selectors";
  import type { LogTimeBlock } from "../../time-block-types";
  import { removeMarkdownExtension } from "../../util/markdown";
  import { getDayKey } from "../../util/time-block-utils";
  import { createRecentClockMenu } from "../recent-clock-menu";

  import { runWithNoticeOnError } from "./../../service/list-item-entry-editor";
  import BlockControls from "./block-controls.svelte";
  import BlockList from "./block-list.svelte";
  import ControlButton from "./control-button.svelte";
  import LocalTimeBlockComponent from "./local-time-block.svelte";
  import Pill from "./pill.svelte";
  import Properties from "./properties.svelte";
  import Selectable from "./selectable.svelte";

  const { workspaceFacade, useSelector, taskEntryEditor, settingsSignal } =
    getObsidianContext();

  const recentLogRecords = useSelector((state) =>
    selectRecentLogEntries(state),
  );

  let fieldState = $state("");
  let debouncedFieldState = $state("");

  const updateDebouncedFieldState = debounce((value: string) => {
    debouncedFieldState = value;
  }, 200);

  $effect(() => {
    updateDebouncedFieldState(fieldState);

    return () => {
      updateDebouncedFieldState.cancel();
    };
  });

  const keywords = $derived(
    debouncedFieldState
      .split(/\s+/)
      ?.map((keyword) => keyword.trim().toLowerCase()),
  );

  const filtered = $derived(
    keywords.every((keyword) => keyword.length === 0)
      ? recentLogRecords.current
      : recentLogRecords.current.filter((it) => {
          // todo: remove once we unify types
          const path =
            it.source === "frontmatterLog" ? it.path : it.location.path;

          return keywords.every(
            (keyword) =>
              it.text.toLowerCase().includes(keyword) ||
              path.toLowerCase().includes(keyword),
          );
        }),
  );

  const grouped = $derived(
    groupBy((task) => getDayKey(task.startTime), filtered),
  );
</script>

<div class="filter-input-wrapper">
  <input
    class="filter-input"
    placeholder="Filter..."
    type="text"
    bind:value={fieldState}
  />
</div>

<BlockList list={grouped}>
  {#snippet titleMatch(title: string)}
    <div class="section-title">
      {#if window.moment(title).isSame(window.moment(), "day")}
        Today,
      {/if}
      {window.moment(title).format(settingsSignal.current.timelineDateFormat)}
    </div>
  {/snippet}
  {#snippet match(task: LogTimeBlock)}
    <Selectable
      onSecondarySelect={(event) => {
        if (task.source === "frontmatterLog") {
          throw new Error("Not implemented");
        }

        createRecentClockMenu({
          event,
          task,
          taskEntryEditor,
          workspaceFacade,
        });
      }}
    >
      {#snippet children({ use, onpointerup, state })}
        <LocalTimeBlockComponent
          isActive={state === "secondary"}
          {onpointerup}
          {task}
          {use}
        >
          {#snippet blockEndDecoration()}
            <!-- todo: implement for frontmatterLog -->
            {#if task.source !== "frontmatterLog"}
              {@const listItemTask = task}
              <BlockControls>
                <ControlButton
                  label="Start tracking time on this task"
                  onclick={async () => {
                    await runWithNoticeOnError(
                      taskEntryEditor.clockInAtLocation({
                        path: listItemTask.location.path,
                        line: listItemTask.location.position.start.line,
                      }),
                    );
                  }}
                >
                  {#snippet icon()}
                    <Play class="svg-icon" />
                  {/snippet}
                </ControlButton>
              </BlockControls>
            {/if}
          {/snippet}
          {#snippet bottomDecoration()}
            <Properties>
              <!-- todo: remove once we unify types -->
              {@const logPath =
                task.source === "frontmatterLog"
                  ? task.path
                  : task.location.path}
              <Pill
                key={File}
                onclick={async () => {
                  await workspaceFacade.revealLocation(
                    task.source === "frontmatterLog"
                      ? { path: task.path }
                      : task.location,
                  );
                }}
                value={removeMarkdownExtension(logPath)}
              />
            </Properties>
          {/snippet}
        </LocalTimeBlockComponent>
      {/snippet}
    </Selectable>
  {/snippet}
</BlockList>

<style>
  .section-title {
    margin-top: var(--size-4-4);
    margin-bottom: var(--size-4-3);
    margin-inline-start: var(--size-4-4);

    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-muted);
  }

  .section-title:not(:first-child) {
    margin-top: var(--size-4-4);
  }

  .filter-input-wrapper {
    display: flex;
    flex-direction: column;
    padding: var(--size-4-2);
    border-bottom: 1px solid var(--background-modifier-border);
  }
</style>
