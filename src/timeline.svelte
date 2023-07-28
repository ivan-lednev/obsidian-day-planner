<script lang="ts">
  import { onMount } from "svelte";
  import { onDestroy } from "svelte";
  import { planSummary, now, nowPosition, zoomLevel } from "./timeline-store";
  import type { PlanItem, PlanSummaryData } from "./plan-data";

  const moment = (window as any).moment;

  export let summary: PlanSummaryData;
  export let rootEl: HTMLElement;
  let timelineZoomLevel: number;
  let position: number;
  let timelineMeterPosition: number;
  let currentTime: Date;
  let autoScroll: boolean = true;

  const unsubSummary = planSummary.subscribe((val) => {
    summary = val;
    updateTimelineMeterPosition();
  });

  const unsubPosition = nowPosition.subscribe((val) => {
    position = val;
  });

  const unsubCurrentTime = now.subscribe((val) => {
    currentTime = val;
    scrollToPosition(position - 150);
    if (!timelineZoomLevel) {
      timelineZoomLevel = 4;
    }
  });

  const unsubSettings = zoomLevel.subscribe((val) => {
    timelineZoomLevel = val;
  });

  onDestroy(unsubSummary);
  onDestroy(unsubPosition);
  onDestroy(unsubCurrentTime);
  onDestroy(unsubSettings);
  onDestroy(removeScrollListener);

  onMount(() => {
    addScrollListener();
  });

  function addScrollListener() {
    rootEl.addEventListener("scroll", disableAutoScroll);
  }

  function removeScrollListener() {
    rootEl.removeEventListener("scroll", disableAutoScroll);
  }

  function disableAutoScroll(ev: any) {
    autoScroll = false;
  }

  function scrollToPosition(position: number) {
    if (autoScroll && !summary.current?.isEnd) {
      removeScrollListener();
      rootEl.scrollTo({ left: 0, top: position, behavior: "smooth" });
      setTimeout(addScrollListener, 1000);
    }
  }

  function updateTimelineMeterPosition() {
    timelineMeterPosition = summary.empty
      ? 0
      : summary.items.first().startTime.getMinutes() * timelineZoomLevel * -1 -
        1;
  }

  function shortClass(item: PlanItem) {
    return item.durationMins < 75 / timelineZoomLevel ? "short" : "";
  }

  function pastClass(item: PlanItem) {
    return item.isPast ? "past" : "";
  }

  function breakClass(item: PlanItem) {
    return item.text === "BREAK" ? "break" : "";
  }

  function endClass(item: PlanItem) {
    return item.text === "END" ? "end" : "";
  }

  function getClassesForEmptySlot(startDate: Date, endDate: Date) {
    let classes: string;
    let durationInMinutes = getTimeDifference(startDate, endDate);
    const now = new Date();

    if (durationInMinutes < 75 / timelineZoomLevel) {
      classes += "short";
    }

    if (now.getMilliseconds() >= endDate.getMilliseconds()) {
      classes += " past";
    }

    return classes;
  }

  function getTimeDifference(startDate: Date, endDate: Date) {
    let timeDiff = endDate.getMilliseconds() - startDate.getMilliseconds();

    return Math.round(((timeDiff % 86400000) % 3600000) / 60000);
  }

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
</script>

<!--{#if summary.items.length > 0}-->
<!--  <div id="day-planner-timeline-container">-->
<!--    <div class="events">-->
<!--      {#each summary.items as item, i}-->
<!--        <div-->
<!--          class="event_item search-result-file-matches {shortClass(item)} {pastClass(item)} {breakClass(-->
<!--            item,-->
<!--          )} {endClass(item)}"-->
<!--          style="height: {item.durationMins * timelineZoomLevel}px;"-->
<!--          data-title={item.rawStartTime}-->
<!--        >-->
<!--          <div class="event_item_contents">-->
<!--            <div class="ei_Title">{item.rawStartTime}</div>-->
<!--            <div class="ei_Copy">{item.text ?? ""}</div>-->
<!--          </div>-->
<!--        </div>-->

<!--        {#if item.rawEndTime !== "" && i + 1 < summary.items.length}-->
<!--          <div-->
<!--            class="empty_event {getClassesForEmptySlot(-->
<!--              item.endTime,-->
<!--              summary.items[i + 1].startTime,-->
<!--            )}"-->
<!--            style="height: {getTimeDifference(-->
<!--              item.endTime,-->
<!--              summary.items[i + 1].startTime,-->
<!--            ) * timelineZoomLevel}px;"-->
<!--            data-title="empty"-->
<!--          ></div>-->
<!--        {/if}-->
<!--      {/each}-->
<!--    </div>-->

<!--    <div-->
<!--      id="now-line"-->
<!--      style="top:{position}px; display: {summary.current &&-->
<!--      !summary.current.isEnd-->
<!--        ? 'block'-->
<!--        : 'none'}"-->
<!--    >-->
<!--      <span class="timeline-time">{moment(currentTime).format("HH:mm")}</span>-->
<!--    </div>-->

<!--    <div id="scroll-controls">-->
<!--      <label for="auto-scroll">Track time</label>-->
<!--      <input-->
<!--        id="auto-scroll"-->
<!--        type="checkbox"-->
<!--        class="toggle"-->
<!--        bind:checked={autoScroll}-->
<!--      />-->
<!--    </div>-->
<!--  </div>-->
<!--{:else}-->
<!--  <div class="empty-timeline">No Planner Data</div>-->
<!--{/if}-->

<div class="time-grid">
  <div class="hours-container">
    {#each hours as hour}
      <div class="hour">
        <div class="hour-number-container">
          {hour}
        </div>
        <div class="hour-guide"></div>
      </div>
    {/each}
  </div>
  <div class="task-grid">
    <div class="moving-items-container">
      <div class="needle" style:transform="translateY(calc(60px * 2.70))"></div>
      <div class="bullet" style:transform="translateY(calc(60px * 2.70))"></div>
      <div class="task-container">
        <button
          class="task"
          style:height="75px"
          style:transform="translateY(calc(60px * 2.78))"
          >Some task
        </button>
      </div>
    </div>
    {#each hours as hour}
      <div class="task-grid-block"></div>
    {/each}
  </div>
</div>

<style>
  .moving-items-container {
    position: absolute;
    left: 0;
    right: 0;
  }

  .needle {
    position: absolute;
    left: 0;
    right: 0;
    border-top: 1px solid var(--color-accent);
    border-bottom: 1px solid var(--color-accent);
  }

  .bullet {
    position: absolute;
    left: -4px;
    top: -4px;
    border-radius: 50%;
    border: 5px solid var(--color-accent);
  }

  .task-container {
    display: flex;
    margin-left: 10px;
    margin-right: 10px;
    flex-direction: column;
  }

  .hour {
    display: flex;
    height: 60px;
  }

  .time-grid {
    display: flex;
  }

  .hours-container {
    flex: 0 0 40px;
    display: flex;
    flex-direction: column;
  }

  .task-grid {
    position: relative;
    flex: 1 0 0;
  }

  .task-grid-block {
    height: 60px;
  }

  .task {
    transform: translate(40px, calc(60px * 3.7));
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
  }

  .task-grid-block,
  .hour-guide {
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .task-grid-block {
    border-left: 1px solid var(--background-modifier-border);
    flex-grow: 1;
  }

  .hour-guide {
    flex: 0 0 10px;
  }

  .hour-number-container {
    color: var(--text-faint);
    align-self: center;
    transform: translateY(calc(-60px / 2));
    display: flex;
    justify-content: center;
    flex: 0 0 30px;
  }

  #day-planner-timeline-container {
    position: relative;

    --skobeloff: #006466ff;
    --midnight-green-eagle-green: #065a60ff;
    --midnight-green-eagle-green-2: #0b525bff;
    --midnight-green-eagle-green-3: #144552ff;
    --charcoal: #1b3a4bff;
    --prussian-blue: #212f45ff;
    --space-cadet: #272640ff;
    --dark-purple: #312244ff;
    --russian-violet: #3e1f47ff;
    --russian-violet-2: #4d194dff;
  }

  .filled {
    transform-origin: top center;
    z-index: 1;
    animation: scaleDown 1s ease-in-out;
    animation-fill-mode: forwards;
  }

  .filled__line__completed {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }

  .events {
    position: relative;
  }

  .event_item,
  .empty_event {
    margin: 10px;
    border: 2px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    cursor: pointer;
    padding: 5px 10px 10px 0;
    width: 100%;
    overflow: hidden;
  }

  .event_item.short {
    padding: 0;
  }

  .event_item.past {
  }

  .event_item:hover {
    background-color: var(--nav-item-background-hover);
  }

  .event_item_color1 {
    background-color: var(--skobeloff);
  }

  .event_item_color2 {
    background-color: var(--midnight-green-eagle-green);
  }

  .event_item_color3 {
    background-color: var(--midnight-green-eagle-green-2);
  }

  .event_item_color4 {
    background-color: var(--midnight-green-eagle-green-3);
  }

  .event_item_color5 {
    background-color: var(--charcoal);
  }

  .event_item_color6 {
    background-color: var(--prussian-blue);
  }

  .event_item_color7 {
    background-color: var(--space-cadet);
  }

  .event_item_color8 {
    background-color: var(--dark-purple);
  }

  .event_item_color9 {
    background-color: var(--russian-violet);
  }

  .event_item_color10 {
    background-color: var(--russian-violet-2);
  }

  .event_item_contents {
    padding-left: 58px;
  }

  .ei_Copy,
  .ei_Title {
    color: var(--text-on-accent);
  }

  .ei_Dot,
  .ei_Title {
    display: inline-block;
  }

  .ei_Dot {
    position: absolute;
    border-radius: 50%;
    width: 14px;
    height: 14px;
    margin-top: 5px;
    background-color: var(--text-accent);
    z-index: 2;
  }

  .dot_active {
    background-color: var(--text-error-hover);
  }

  .ei_Title {
    margin-left: 26px;
  }

  .ei_Copy {
    font-size: 15px;
    display: inline-block;
    margin-left: 28px;
  }

  .header_title,
  .ei_Title,
  .ce_title {
    color: #fff;
  }

  #now-line {
    height: 4px;
    background-color: darkred;
    opacity: 80%;
    position: absolute;
    z-index: 3;
    width: 100%;
  }

  #now-line .timeline-time {
    position: relative;
    left: 5px;
    top: 0;
    background-color: darkred;
    color: #fff;
    padding: 0 4px 2px 4px;
    border-radius: 0 0 4px 4px;
    text-align: center;
  }

  #scroll-controls {
    background-color: var(--background-secondary);
    position: sticky;
    bottom: 0;
    width: 100%;
    z-index: 4;
    padding: 8px 15px;
    text-align: center;
    height: 45px;
  }

  #scroll-controls label {
    display: block;
    float: left;
    margin: 2px;
  }

  #scroll-controls .toggle {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    width: 50px;
    height: 20px;
    display: block;
    float: left;
    position: relative;
    margin-top: 5px;
    border-radius: 50px;
    overflow: hidden;
    outline: none;
    border: none;
    cursor: pointer;
    background-color: var(--background-secondary-alt);
    transition: background-color ease 0.3s;
  }

  #scroll-controls .toggle:before {
    content: "on off";
    display: block;
    position: absolute;
    z-index: 2;
    width: 17px;
    height: 17px;
    background: #fff;
    left: 2px;
    top: 1px;
    border-radius: 50%;
    font: 9px/18px Helvetica;
    text-transform: uppercase;
    font-weight: bold;
    text-indent: -24px;
    word-spacing: 30px;
    color: #fff;
    text-shadow: -1px -1px rgba(0, 0, 0, 0.15);
    white-space: nowrap;
    transition: all cubic-bezier(0.3, 1.5, 0.7, 1) 0.3s;
  }

  #scroll-controls .toggle:checked {
    background-color: var(--interactive-accent);
  }

  #scroll-controls .toggle:checked:before {
    left: 31px;
  }

  .empty-timeline {
    text-align: center;
    vertical-align: middle;
    margin-top: 50%;
  }
</style>
