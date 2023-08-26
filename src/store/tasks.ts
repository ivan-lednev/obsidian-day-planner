import { Writable, writable } from "svelte/store";

import type { PlanItem } from "../types";

export const tasks = writable<PlanItem[]>([]);
export const taskLookup = writable<Record<string, Writable<Array<PlanItem>>>>();
