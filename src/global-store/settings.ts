import { fromStore, writable } from "svelte/store";

import type { DayPlannerSettings } from "../settings";
import { defaultSettings } from "../settings";

export const settingsStore = writable<DayPlannerSettings>(defaultSettings);
export const settingsSignal = fromStore(settingsStore);
