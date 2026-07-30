import { getContext } from "svelte";

import { dateRangeContextKey } from "../constants";
import type { DateRange } from "../types";

export function getDateRangeContext() {
  return getContext<DateRange>(dateRangeContextKey);
}
