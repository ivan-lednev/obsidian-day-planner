import { Array, pipe } from "effect";
import type { Moment } from "moment";

import { addHorizontalPlacing } from "../../overlap/overlap";
import type { TimeBlock, WithDuration } from "../../time-block-types";
import type { Signal } from "../../types";
import { doesOverlapWithRange } from "../../util/moment";
import * as t from "../../util/time-block-utils";

export class MiniTimeline {
  private readonly hours = 3;

  readonly blocksPerHour = 6;
  readonly totalBlocks = this.blocksPerHour * this.hours;
  readonly timeMarkerWidthPx = 8;
  readonly timeMarkerHalfWidthPx = this.timeMarkerWidthPx / 2;

  constructor(
    private readonly currentTimeSignal: Signal<Moment>,
    private readonly tasksWithTimeForToday: Signal<
      Array<WithDuration<TimeBlock>>
    >,
  ) {}

  timeMarkerOffsetPx = $derived(
    this.currentTimeSignal.current.minutes() - this.timeMarkerHalfWidthPx,
  );

  private rangeStart = $derived(
    this.currentTimeSignal.current.clone().startOf("hour"),
  );

  private rangeEnd = $derived(
    this.currentTimeSignal.current
      .clone()
      .add(this.hours, "hours")
      .endOf("hour"),
  );

  displayedBlocks = $derived(
    pipe(
      this.tasksWithTimeForToday.current,
      Array.filter((it) =>
        doesOverlapWithRange(
          { start: it.startTime, end: t.getEndTime(it) },
          {
            start: this.rangeStart,
            end: this.rangeEnd,
          },
        ),
      ),
      Array.map((it) => ({
        ...t.clamp(it, this.rangeStart, this.rangeEnd),
        leftPx: it.startTime.clone().diff(this.rangeStart, `minutes`),
      })),
      addHorizontalPlacing,
    ),
  );
}
