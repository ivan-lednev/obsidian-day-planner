import type { Moment } from "moment";
import { getContext } from "svelte";
import type { Writable } from "svelte/store";

import { dateRangeContextKey } from "../constants";

export function getDateRangeContext() {
  return getContext<Writable<Moment[]>>(dateRangeContextKey);
}
