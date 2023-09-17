import type { Moment } from "moment";
import { writable } from "svelte/store";

export const visibleDateRange = writable<Moment[]>();
