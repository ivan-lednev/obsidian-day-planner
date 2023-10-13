import type { Moment } from "moment";
import { writable } from "svelte/store";

import { getDaysOfCurrentWeek } from "../util/moment";

export const visibleDateRange = writable<Moment[]>(getDaysOfCurrentWeek());
