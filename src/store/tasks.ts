import { Writable, writable } from "svelte/store";

import type { PlanItem } from "../types";

export const tasks = writable<PlanItem[]>([]);

export const planItemsByDateUid =
  writable<Record<string, Writable<Array<PlanItem>>>>();

planItemsByDateUid.subscribe((v) => {
  console.log({ planItemsByDateUid: v });
});
