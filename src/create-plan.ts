import { get } from "svelte/store";
import { settings } from "./store/settings";

export function createPlannerHeading() {
  const { plannerHeading, plannerHeadingLevel } = get(settings);

  const headingTokens = "#".repeat(plannerHeadingLevel);

  return `${headingTokens} ${plannerHeading}`;
}
