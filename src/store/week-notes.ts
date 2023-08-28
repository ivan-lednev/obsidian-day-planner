import type { Moment } from "moment";
import type { TFile } from "obsidian";
import { writable } from "svelte/store";

export interface DateRange {
  dailyNotes: Array<TFile>;
  dates: Array<Moment>;
}

export const dateRange = writable<DateRange>();
