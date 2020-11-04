import moment from 'moment';
import { PlanItem } from './plan-data';

export default class Progress {
    getProgress(current: PlanItem, next: PlanItem) {
        const now = new Date();
        const nowMoment = moment(now);
        const currentMoment = moment(current.time);
        const nextMoment = moment(next.time);
        const diff = moment.duration(nextMoment.diff(currentMoment));
        const fromStart = moment.duration(nowMoment.diff(currentMoment));
        const untilNext = moment.duration(nextMoment.diff(nowMoment));
        let percentageComplete = (fromStart.asMinutes() / diff.asMinutes()) * 100;
        const minsUntilNext = untilNext.asMinutes().toFixed(0);
        return { percentageComplete, minsUntilNext };
      }

    progressMarkdown(current: PlanItem, next: PlanItem) {
        const { percentageComplete, minsUntilNext } = this.getProgress(current, next);
        const completeCount = Math.floor(20*(percentageComplete/100));
        return new Array(completeCount).join('->') + new Array(20-completeCount).join('_ ');
    }
}