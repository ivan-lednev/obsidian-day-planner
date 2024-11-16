import { cubicInOut } from "svelte/easing";

const defaultSlideDuration = 150;

export function createSlide(props: { axis: "x" | "y" }) {
  const { axis } = props;

  // Note: these presets are similar to what Obsidian uses
  return {
    duration: defaultSlideDuration,
    easing: cubicInOut,
    axis,
  };
}
