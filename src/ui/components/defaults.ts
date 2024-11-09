import { cubicInOut } from "svelte/easing";

const defaultSlideDuration = 150;

export function createSlide(props: { axis: "x" | "y" }) {
  const { axis } = props;

  return {
    duration: defaultSlideDuration,
    easing: cubicInOut,
    axis,
  };
}
