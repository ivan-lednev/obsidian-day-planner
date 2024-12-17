<script lang="ts">
  import { type Snippet } from "svelte";

  import { createGestures } from "../actions/gestures";
  import { pointerUpOutside } from "../actions/pointer-up-outside";
  import type { HTMLActionArray } from "../actions/use-actions";

  interface ChildrenProps {
    isSelected: boolean;
    use: HTMLActionArray;
  }

  interface Props {
    children: Snippet<[ChildrenProps]>;
  }

  const { children }: Props = $props();
  let isSelected = $state(false);

  const use = [
    createGestures({
      ontap: () => {
        isSelected = true;
      },
    }),
    pointerUpOutside(() => {
      isSelected = false;
    }),
  ];
</script>

{@render children({ isSelected, use })}
