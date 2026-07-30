import { getContext } from "svelte";

import { dateRangeContextKey } from "../constants";
import type { DateRange } from "../redux/date-ranges";

export function getDateRangeContext() {
  return getContext<DateRange>(dateRangeContextKey);
}
