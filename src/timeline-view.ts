import { ItemView, WorkspaceLeaf } from 'obsidian';
import Timeline from './timeline.svelte';
import { planSummary, now, nowPosition, zoomLevel } from './timeline-store';
import { VIEW_TYPE_TIMELINE } from './constants';
import type { PlanSummaryData } from './plan-data';
import type { DayPlannerSettings } from './settings';
const moment = (window as any).moment;

export default class TimelineView extends ItemView {
    private timeline:Timeline;
    private settings: DayPlannerSettings;

    constructor(leaf: WorkspaceLeaf, settings: DayPlannerSettings){
        super(leaf);
        this.settings = settings;
    }

    getViewType(): string {
        return VIEW_TYPE_TIMELINE;
    }

    getDisplayText(): string {
        return 'Day Planner Timeline';
    }

    getIcon() {
        return this.settings.timelineIcon;
    }

    update(summaryData: PlanSummaryData) {
        planSummary.update(n => n = summaryData);
        const currentTime = new Date();
        now.update(n => n = currentTime);
        const currentPosition = summaryData.empty ? 0 : this.positionFromTime(currentTime) - this.positionFromTime(summaryData.items.first().startTime);
        nowPosition.update(n => n = currentPosition);
        zoomLevel.update(n => n = this.settings.timelineZoomLevel);
    }

    positionFromTime(time: Date) {
        return moment.duration(moment(time).format('HH:mm')).asMinutes()*this.settings.timelineZoomLevel;
    }

    async onOpen() {
        this.timeline = new Timeline({
          target: (this as any).contentEl,
          props: {
            planSummary: planSummary,
            rootEl: this.containerEl.children[1]
          },
        });
    }
}
