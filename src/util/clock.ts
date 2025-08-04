import type { Moment } from "moment";

import { clockFormat } from "../constants";

export type ClockMoments = [Moment, Moment];

export function createClockTimestamp() {
  return window.moment().format(clockFormat);
}
