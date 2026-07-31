<script lang="ts">
  import { getObsidianContext } from "../../context/obsidian-context";
  import { currentTimeSignal } from "../../global-store/current-time";
  import { selectNewestActiveLogTimeBlock } from "../../redux/index/index-selectors";
  import { createActiveClockMenu } from "../active-clock-menu";

  import { EllipsisVertical, Play } from "./lucide";

  const {
    useSelector,
    openClockInOnAnythingModal,
    logEntryEditor,
    workspaceFacade,
    openLogEntryEditModal,
  } = getObsidianContext();

  const newestActiveClock = useSelector((state) =>
    selectNewestActiveLogTimeBlock(state, currentTimeSignal.current),
  );

  function handleClick(event: MouseEvent) {
    const timeBlock = newestActiveClock.current;

    if (!timeBlock) {
      openClockInOnAnythingModal();

      return;
    }

    createActiveClockMenu({
      event,
      timeBlock,
      logEntryEditor,
      workspaceFacade,
      openLogEntryEditModal,
    });
  }
</script>

<div
  class="needle-clock-control"
  aria-label={newestActiveClock.current
    ? "Open clock menu"
    : "Clock in on anything"}
  onclick={handleClick}
>
  {#if newestActiveClock.current}
    <EllipsisVertical />
  {:else}
    <Play />
  {/if}
</div>

<style>
  .needle-clock-control {
    --icon-size: calc(var(--size-4-3));

    pointer-events: auto;
    cursor: var(--cursor);

    position: absolute;
    z-index: 1;
    top: 50%;
    inset-inline-start: 0;
    translate: 0 -50%;

    display: flex;

    padding: var(--size-2-1);

    color: var(--text-on-accent);

    background-color: var(--color-accent);
    border: var(--size-2-1) solid var(--background-primary);
    border-radius: 50%;

    :global(.is-mobile) & {
      --icon-size: var(--size-4-5);
    }
  }

  .needle-clock-control:hover {
    background-color: var(--interactive-accent-hover);
  }
</style>
