import { getContext } from "svelte";
import type { Readable } from "svelte/store";

import { isInSidebarContextKey } from "../constants";

export function getIsInSidebarContext() {
  return getContext<Readable<boolean>>(isInSidebarContextKey);
}
