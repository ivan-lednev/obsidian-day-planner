import type { PlanItem } from "./plan-item";

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

  calculate(): void {
    const now = new Date();
    if (this.items.length === 0) {
      this.empty = true;
      return;
    }
    this.items.forEach((item, i) => {
      const next = this.items[i + 1];
      if (
        item.startTime < now &&
        (item.isEnd || (next && now < next.startTime))
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

      if (item.endTime !== undefined) {
        item.durationMins = moment
          .duration(moment(item.endTime).diff(moment(item.startTime)))
          .asMinutes();
      } else if (next) {
        const untilNext = moment
          .duration(moment(next.startTime).diff(moment(item.startTime)))
          .asMinutes();
        const defaultDurationMinutes = 30;
        item.durationMins =
          untilNext < defaultDurationMinutes
            ? untilNext
            : defaultDurationMinutes;
      }
    });
  }
}

