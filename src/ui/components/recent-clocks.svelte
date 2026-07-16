<script lang="ts">
  import { Array } from "effect";
  import { File, Play } from "lucide-svelte";
  import { debounce } from "obsidian";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { selectRecentLogEntries } from "../../redux/index/index-selectors";
  import type { LogTimeBlock } from "../../time-block-types";
  import { runWithNoticeOnError } from "../../util/effect";
  import { filterByKeywords } from "../../util/keyword-filter";
  import { removeMarkdownExtension } from "../../util/markdown";
  import { getDayKey } from "../../util/time-block-utils";
  import { createRecentClockMenu } from "../recent-clock-menu";

  import BlockControls from "./block-controls.svelte";
  import BlockList from "./block-list.svelte";
  import ControlButton from "./control-button.svelte";
  import LocalTimeBlockComponent from "./local-time-block.svelte";
  import Pill from "./pill.svelte";
  import Properties from "./properties.svelte";
  import Selectable from "./selectable.svelte";

  const { workspaceFacade, useSelector, logEntryEditor, settingsSignal } =
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

  const filtered = $derived(
    filterByKeywords(recentLogRecords.current, debouncedFieldState, (it) => [
      it.text,
      it.path,
    ]),
  );

  const grouped = $derived(
    Array.groupBy(filtered, (task) => getDayKey(task.startTime)),
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
        createRecentClockMenu({
          event,
          task,
          logEntryEditor,
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
            <BlockControls>
              <ControlButton
                label="Start tracking time on this task"
                onclick={async () => {
                  await runWithNoticeOnError(logEntryEditor.clockIn(task));
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
              <Pill
                key={File}
                onclick={async () => {
                  await workspaceFacade.revealLocation(task);
                }}
                value={removeMarkdownExtension(task.path)}
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
