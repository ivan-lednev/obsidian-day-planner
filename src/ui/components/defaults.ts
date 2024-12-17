import { cubicInOut } from "svelte/easing";

import { transitionDurationShort } from "../../constants";

export function createSlide(props: { axis: "x" | "y" }) {
  const { axis } = props;

  // Note: these presets are similar to what Obsidian uses
  return {
    duration: transitionDurationShort,
    easing: cubicInOut,
    axis,
  };
}
