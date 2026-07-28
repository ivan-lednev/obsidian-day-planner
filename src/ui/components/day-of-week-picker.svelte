<script lang="ts">
  import type { Moment } from "moment";

  import { isToday } from "../../global-store/current-time";
  import { getDayKey } from "../../util/time-block-utils";

  import ControlButton from "./control-button.svelte";

  const {
    week,
    selectedDay,
    onDayClick,
  }: {
    week: Moment[];
    selectedDay: Moment;
    onDayClick: (day: Moment) => void | Promise<void>;
  } = $props();
</script>

<div class="day-of-week-picker">
  {#each week as day (getDayKey(day))}
    {@const isSelected = day.isSame(selectedDay, "day")}
    <div class="column">
      <span class="day-of-week">{day.format("ddd")}</span>
      <ControlButton
        classes="day-of-month-button"
        isActive={isSelected}
        label={day.format("dddd, MMMM D")}
        onclick={() => onDayClick(day)}
      >
        <span
          class={[
            "day-of-month",
            !day.isSame(selectedDay, "month") && "outside-selected-month",
            $isToday(day) && "today",
            isSelected && "selected",
          ]}
        >
          {day.date()}
        </span>
      </ControlButton>
    </div>
  {/each}
</div>

<style>
  .day-of-week-picker {
    display: flex;
    gap: var(--size-2-1);
    justify-content: space-between;
    padding-right: var(--size-4-3);
  }

  .day-of-week {
    font-size: 0.8em;
    font-weight: var(--font-medium);
    color: var(--text-faint);
    text-transform: uppercase;
  }

  .day-of-month {
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-normal);
  }

  .outside-selected-month {
    color: var(--text-faint);
  }

  .today {
    color: var(--color-accent);
  }

  .column {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--size-2-1);
    align-items: center;
  }

  .column :global(.day-of-month-button) {
    justify-content: center;
    width: 100%;
    padding: var(--size-2-1) 0;
  }

  .selected {
    color: var(--text-on-accent);
  }

  .column :global(.day-of-month-button.is-active) {
    background-color: var(--color-accent);
  }
</style>
