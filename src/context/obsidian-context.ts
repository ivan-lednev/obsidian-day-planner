import { getContext } from "svelte";

import { obsidianContextKey } from "../constants";
import type { ObsidianContext } from "../types";

export function getObsidianContext() {
  return getContext<ObsidianContext>(obsidianContextKey);
}
