import { writable } from "svelte/store";

export const settings = writable({
  zoomLevel: 2,
  startHour: 0,
  centerNeedle: true,
  timelineDateFormat: "LLLL",
  plannerHeading: "Day planner",
  plannerHeadingLevel: 1,
  timelineColored: false,
  timelineStartColor: "#006466",
  timelineEndColor: "#4d194d",
});
