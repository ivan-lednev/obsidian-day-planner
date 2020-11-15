<script lang="ts">
    import { onDestroy } from "svelte";
    import moment from 'moment';
    import { planSummary, now, nowPosition } from './timeline-store';
    import type { PlanItem, PlanSummaryData } from './plan-data';
    import { MINUTE_MULTIPLIER } from './constants';
    
    export let summary: PlanSummaryData;
    export let rootEl: HTMLElement;
    let position: number;
    let currentTime: Date;
    let autoScroll: boolean = true;

    const unsubSummary = planSummary.subscribe(val => {
        summary = val;
    });

    const unsubPosition = nowPosition.subscribe(val => {
        position = val;
    });

    const unsubCurrentTime = now.subscribe(val => {
        currentTime = val;
        scrollToPosition(position - 150);
    });

    onDestroy(unsubSummary);
    onDestroy(unsubPosition);
    onDestroy(unsubCurrentTime);

    function scrollToPosition(position: number) {
      if(autoScroll) {
        rootEl.scrollTo({ left: 0, top: position, behavior: 'smooth' });
      }
    }

    function inMins(time: Date){
        return moment.duration(moment(time).format('HH:mm')).asMinutes();
    }

    function offset(item: PlanItem) {
        const minuteOffset = inMins(item.time)*MINUTE_MULTIPLIER;
        return minuteOffset;
    }

    function shortClass(item: PlanItem) {
      return item.durationMins < 15 ? 'short' : '';
    }

    function pastClass(item: PlanItem) {
      return item.isPast ? 'past' : '';
    }

</script>

<style>

#day-planner-timeline-container {
    position: relative;
    height: 1440px;

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

.aside {
  position: absolute;
  top: -1px;
  left: 0;
  width: 65px;
  height: 100%;

  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAEsCAYAAADHIkNEAAAAAXNSR0IArs4c6QAAAFBlWElmTU0AKgAAAAgAAgESAAMAAAABAAEAAIdpAAQAAAABAAAAJgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAFqADAAQAAAABAAABLAAAAAAuMW7GAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAAAsElEQVR4Ae3ZMQoAIAgFUL3/ocsO0GBLFE9wESJ8jj8jYlQrAgQIECBAgAABAgQIECBAgAABAgQIECBAgACBbwWyNutGQuuNIkCAAAECBAgQIECAAAECBAgQIECAAAECBAgQeEbgJBLaLScq2smYEyBAgAABAgQIECBAgAABAgQIECBAgAABAgSuCpxEQqKfqyfzOQECBAgQIECAAAECBAgQIECAAAECBAgQIECgKzABwWUEBHBCyqYAAAAASUVORK5CYII=);
  background-repeat: repeat-y;
  opacity: 80%;
}

.aside__line {
  position: absolute;
  left: 65px;
  transform: translateX(-50%);
  width: 4px;
  height: 100%;
  background: var(--text-accent);
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

.event_item{
    border-bottom: 2px solid var(--background-primary);
    margin: 0;
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

.event_item:hover{
    background-color: var(--interactive-accent-hover);
    box-shadow: 0px 0px 52px -18px rgba(0, 0, 0, 0.75);
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

.ei_Copy,.ei_Title{
    color:var(--text-on-accent);
}

.ei_Dot,.ei_Title{
  display:inline-block;
}

.ei_Dot{
  position: absolute;
  border-radius:50%;
  width:14px;
  height: 14px;
  margin-top: 5px;
  background-color: var(--text-accent);
  box-shadow: 0px 0px 52px -18px rgba(0, 0, 0, 0.75);
  z-index: 2;
}

.dot_active{
  background-color: var(--text-error-hover);
}

.ei_Title{
  margin-left: 26px;
}

.ei_Copy{
  font-size: 15px;
  display: inline-block;
  margin-left: 28px;
}

.header_title,.ei_Title,.ce_title{
color:#fff;
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
    position: fixed;
    bottom: 0;
    width: 100%;
    z-index: 4;
    padding: 8px 15px;
    left: 0;
    text-align: center;
}

#scroll-controls label {
  display: block;
  float: left;
  margin: 2px 10px;
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
  text-indent: -20px;
  word-spacing: 30px;
  color: #fff;
  text-shadow: -1px -1px rgba(0,0,0,0.15);
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
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

{#if summary.validItems().length > 0}
  <div id="day-planner-timeline-container" style="height:{1440*MINUTE_MULTIPLIER}px;">
      <div class="aside filled">
          <div class="aside__line filled__line">
              <div class="filled__line__completed" style="height: {nowPosition}px;"></div>
          </div>
      </div>
        
      <div class="events" style='top: {offset(summary.validItems().first())}px'>
        {#each summary.validItems() as item, i}
            <div class="event_item event_item_color{i%10+1} {shortClass(item)} {pastClass(item)}" style="height: {item.durationMins*MINUTE_MULTIPLIER}px;">
              <div class="event_item_contents">
                <div class="ei_Dot {item === summary.current ? 'dot_active' : ''}"></div>
                <div class="ei_Title">{item.rawTime}</div>
                <div class="ei_Copy">{item.displayText() ?? ''}</div>
              </div>
            </div>
        {/each}
      </div>

      <div id="now-line" style="top:{position}px">
          <span class="timeline-time">{moment(currentTime).format('HH:mm')}</span>
      </div>
      
      <div id="scroll-controls">
        <label for="auto-scroll">Track current time</label>
        <input id="auto-scroll" type="checkbox" class="toggle" bind:checked={autoScroll}>
      </div>
  </div>
  {:else}
    <div class="empty-timeline">
      No Planner Data
    </div>
{/if}