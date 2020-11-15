import { ItemView, WorkspaceLeaf } from 'obsidian';
import Timeline from './timeline.svelte';
import { planSummary, now, nowPosition } from './timeline-store';
import { MINUTE_MULTIPLIER, VIEW_TYPE_TIMELINE } from './constants';
import type { PlanSummaryData } from './plan-data';
const moment = (window as any).moment;

export default class TimelineView extends ItemView {
    private timeline:Timeline;

    constructor(leaf: WorkspaceLeaf){
        super(leaf);
    }

    getViewType(): string {
        return VIEW_TYPE_TIMELINE;
    }

    getDisplayText(): string {
        return 'Day Planner Timeline';
    }

    getIcon() {
        return "calendar-with-checkmark";
    }

    update(summaryData: PlanSummaryData) {
        console.log('View update');
        planSummary.update(n => n = summaryData);
        const currentTime = new Date();
        now.update(n => n = currentTime);
        const currentPosition = this.positionFromTime(currentTime);
        nowPosition.update(n => n = currentPosition);
    }

    positionFromTime(time: Date) {
        return moment.duration(moment(time).format('HH:mm')).asMinutes()*MINUTE_MULTIPLIER;
    }

    async onOpen() {
        const {
          workspace: { activeLeaf },
        } = this.app;

        this.timeline = new Timeline({
          target: (this as any).contentEl,
          props: {
            planSummary: planSummary,
            rootEl: this.containerEl.children[1]
          },
        });
      }

}
