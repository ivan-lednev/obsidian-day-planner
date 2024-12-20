<script lang="ts">
  import { type Snippet } from "svelte";

  import { MouseButton, vibrationDurationMillis } from "../../constants";
  import { isTouchEvent } from "../../util/util";
  import { createGestures } from "../actions/gestures";
  import { pointerUpOutside } from "../actions/pointer-up-outside";
  import type { HTMLActionArray } from "../actions/use-actions";

  type SelectionState = "primary" | "secondary" | "none";

  interface ChildrenProps {
    use: HTMLActionArray;
    state: SelectionState;
    onpointerup: (event: PointerEvent) => void;
  }

  interface Props {
    children: Snippet<[ChildrenProps]>;
    selectionBlocked?: boolean;
    onSecondarySelect?: (event: MouseEvent | PointerEvent | TouchEvent) => void;
  }

  const {
    children,
    onSecondarySelect,
    selectionBlocked = false,
  }: Props = $props();

  let state = $state<SelectionState>("none");

  function setSelection(newState: SelectionState) {
    if (newState !== "none") {
      if (selectionBlocked) {
        return;
      }

      navigator.vibrate?.(vibrationDurationMillis);
    }

    state = newState;
  }

  function clear() {
    setSelection("none");
  }

  function setPrimary() {
    setSelection("primary");
  }

  function setSecondary(event: PointerEvent | MouseEvent | TouchEvent) {
    setSelection("secondary");
    onSecondarySelect?.(event);
  }

  const use = [
    createGestures({
      ontap: () => {
        setPrimary();
      },
      onlongpress: (event) => {
        setSecondary(event);
      },
      options: { mouseSupport: false },
    }),
    pointerUpOutside(clear),
  ];

  function handlePointerUp(event: PointerEvent) {
    if (isTouchEvent(event)) {
      return;
    }

    if (event.button === MouseButton.LEFT) {
      setPrimary();
    } else if (event.button === MouseButton.RIGHT) {
      setSecondary(event);
    }
  }
</script>

<svelte:body
  onkeydown={(event: KeyboardEvent) => {
    if (event.key === "Escape") {
      clear();
    }
  }}
/>

{@render children({ use, state, onpointerup: handlePointerUp })}
