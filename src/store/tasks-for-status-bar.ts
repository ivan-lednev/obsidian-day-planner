import { writable } from "svelte/store";

import type { PlanItem } from "../types";

export const tasksForStatusBar = writable<PlanItem[]>([]);
