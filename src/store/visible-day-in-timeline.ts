import { writable } from "svelte/store";

export const visibleDayInTimeline = writable(window.moment());
