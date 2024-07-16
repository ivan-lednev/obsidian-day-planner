<script lang="ts">
  import { onDestroy } from "svelte";
  import TinyGesture from "tinygesture";

  export let onMouseEnter: () => void | undefined = () => {};
  export let onMouseLeave: () => void | undefined = () => {};

  let hovering = false;

  function longPress(el: HTMLElement) {
    const gesture = new TinyGesture(el);

    gesture.on("longpress", onMouseEnter);

    return {
      destroy() {
        gesture.destroy();
      },
    };
  }

  onDestroy(() => {
    onMouseLeave();
  });
</script>

<div
  style:display="contents"
  on:pointerenter={(event) => {
    onMouseEnter();

    hovering = true;
  }}
  on:pointerleave={(event) => {
    onMouseLeave();

    hovering = false;
  }}
  use:longPress
>
  <slot {hovering} />
</div>
