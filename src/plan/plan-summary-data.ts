import type { PlanItem } from "./plan-item";
import { getDiffInMinutes } from "../util/moment";

const moment = (window as any).moment;

export class PlanSummaryData {
  empty: boolean;
  invalid: boolean;
  items: PlanItem[];
  past: PlanItem[];
  current: PlanItem;
  next: PlanItem;

  constructor(items: PlanItem[]) {
    this.empty = items.length < 1;
    this.invalid = false;
    this.items = items.sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
    this.past = [];
  }

  updatePlanItemProps(): void {
    const now = moment();
    if (this.items.length === 0) {
      this.empty = true;
      return;
    }
    this.items.forEach((item, i) => {
      const next = this.items[i + 1];
      if (
        item.startTime.isBefore(now) &&
        (item.isEnd || (next && now.isBefore(next.startTime)))
      ) {
        this.current = item;
        if (item.isEnd) {
          item.isPast = true;
          this.past.push(item);
        }
        this.next = item.isEnd ? null : next;
      } else if (item.startTime < now) {
        item.isPast = true;
        this.past.push(item);
      }

      item.durationMins = getDuration(item, next);
    });
  }
}

const defaultDurationMinutes = 30;

function getDuration(item: PlanItem, next?: PlanItem) {
  if (item.endTime) {
    return getDiffInMinutes(item.startTime, item.endTime);
  }

  if (next) {
    const minutesUntilNext = getDiffInMinutes(
      moment(next.startTime),
      moment(item.startTime),
    );

    if (minutesUntilNext < defaultDurationMinutes) {
      return minutesUntilNext;
    }
  }

  return defaultDurationMinutes;
}
