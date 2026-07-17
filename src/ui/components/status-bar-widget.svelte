<script lang="ts">
  import { fromStore, type Readable } from "svelte/store";

  import { statusBarTextLimit } from "../../constants";
  import { currentTimeSignal } from "../../global-store/current-time";
  import { settingsSignal } from "../../global-store/settings";
  import { selectActiveLogEntries } from "../../redux/index/index-slice";
  import type { RootState } from "../../redux/store";
  import type { UseSelector } from "../../redux/use-selector";
  import type { LogEntryEditor } from "../../service/log-entry-editor";
  import type { WorkspaceFacade } from "../../service/workspace-facade";
  import { type TimeBlock, type WithDuration } from "../../time-block-types";
  import { ellipsis } from "../../util/ellipsis";
  import { fromDiff } from "../../util/moment";
  import { getOneLineSummary } from "../../util/time-block-utils";
  import { createActiveClockMenu } from "../active-clock-menu";
  import type { OpenEditTimeEntryModal } from "../create-edit-time-entry-modal";
  import { useStatusBarWidget } from "../hooks/use-status-bar-widget";

  import { SkipForward, Play, Timer } from "./lucide";
  import MiniTimeline from "./mini-timeline.svelte";

  const {
    onClick,
    tasksWithTimeForToday,
    useSelector,
    logEntryEditor,
    workspaceFacade,
    openEditTimeEntryModal,
    openClockInOnAnythingModal,
  }: {
    onClick: () => Promise<void>;
    tasksWithTimeForToday: Readable<Array<WithDuration<TimeBlock>>>;
    useSelector: UseSelector<RootState>;
    logEntryEditor: LogEntryEditor;
    workspaceFacade: WorkspaceFacade;
    openEditTimeEntryModal: OpenEditTimeEntryModal;
    openClockInOnAnythingModal: () => void;
  } = $props();

  const { current, next } = $derived(
    fromStore(useStatusBarWidget({ tasksWithTimeForToday })).current,
  );

  const {
    showNow,
    showNext,
    progressIndicator,
    timestampFormat,
    showActiveClockInStatusBar,
  } = $derived(settingsSignal.current);

  const activeLogRecords = $derived(useSelector(selectActiveLogEntries));

  const newestActiveClock = $derived(
    activeLogRecords.current
      .toSorted((a, b) => b.startTime.diff(a.startTime))
      .at(0),
  );

  function handleClockClick(event: MouseEvent) {
    if (!newestActiveClock) {
      openClockInOnAnythingModal();

      return;
    }

    createActiveClockMenu({
      event,
      task: newestActiveClock,
      logEntryEditor,
      workspaceFacade,
      openEditTimeEntryModal,
    });
  }
</script>

{#if showActiveClockInStatusBar}
  <div
    class="status-bar-item mod-clickable stopwatch"
    aria-label={newestActiveClock
      ? "Open clock menu"
      : "Day Planner: Clock in on anything"}
    data-tooltip-position="top"
    onclick={handleClockClick}
  >
    <div class="status-bar-item-segment">
      <Timer class="status-bar-item-icon" />
      {#if newestActiveClock}
        {ellipsis(getOneLineSummary(newestActiveClock), statusBarTextLimit)}
        ({fromDiff(
          newestActiveClock.startTime,
          currentTimeSignal.current,
        ).format(timestampFormat)})
      {/if}
    </div>
  </div>
{/if}

{#if showNow && current}
  <div
    class="status-bar-item current"
    aria-label="Current time block"
    data-tooltip-position="top"
    onclick={onClick}
  >
    <div class="status-bar-item-segment">
      <span class="status-bar-item-icon">
        <Play />
      </span>
      {current.text} (-{current.timeLeft}, till {current.endTime.format(
        timestampFormat,
      )})
    </div>
    {#if progressIndicator === "pie"}
      <div
        class="status-bar-item-segment progress-pie"
        data-value={current.percentageComplete}
      ></div>
    {:else if progressIndicator === "bar"}
      <div class="status-bar-item-segment">
        <div style="width: {current.percentageComplete}%;"></div>
      </div>
    {/if}
  </div>
{/if}

{#if showNext && next}
  <div
    class="status-bar-item next"
    aria-label="Next time block"
    data-tooltip-position="top"
    onclick={onClick}
  >
    <div class="status-bar-item-segment">
      <span class="status-bar-item-icon">
        <SkipForward class="status-bar-item-icon" />
      </span>
      {next.text} (in {next.timeToNext})
    </div>
  </div>
{/if}

{#if progressIndicator === "mini-timeline"}
  <div class="status-bar-item mini-timeline">
    <MiniTimeline {tasksWithTimeForToday} />
  </div>
{/if}

<style>
  :global(.planner-status-bar-widget-root) {
    display: contents;
  }

  .mini-timeline,
  .current,
  .next,
  .stopwatch {
    padding-block: 0;
  }

  .status-bar-item-segment.progress-pie {
    display: block;
  }
</style>
