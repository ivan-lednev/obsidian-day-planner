<script lang="ts">
  import { type Snippet } from "svelte";
  import { isNotVoid } from "typed-assert";

  import { getIsomorphicClientY } from "../../util/dom";

  let {
    el = $bindable(),
    ...props
  }: {
    children: Snippet<[() => void]>;
    onpointermove?: (event: PointerEvent) => void;
    onpointerup?: (event: PointerEvent) => void;
    class?: object | string;
    el?: HTMLDivElement;
  } = $props();

  let customHeight = $state(0);
  const height = $derived(customHeight === 0 ? "auto" : `${customHeight}px`);

  let editingHeight = $state(false);

  function startEdit() {
    editingHeight = true;
  }

  function stopEdit(event: MouseEvent) {
    if (!editingHeight) {
      return;
    }

    event.stopPropagation();
    editingHeight = false;
  }

  function handleBlur() {
    editingHeight = false;
  }

  function handleMove(event: MouseEvent | TouchEvent) {
    if (!editingHeight) {
      return;
    }

    isNotVoid(el);

    const viewportToElOffsetY = el.getBoundingClientRect().top;

    customHeight = getIsomorphicClientY(event) - viewportToElOffsetY;
  }
</script>

<svelte:document
  on:mousemove={handleMove}
  on:touchmove={handleMove}
  on:pointerup|capture={stopEdit}
/>
<svelte:window on:blur={handleBlur} />

<div
  bind:this={el}
  style:height
  class={[props.class, "resizeable-box"]}
  onpointermove={props.onpointermove}
  onpointerup={props.onpointerup}
>
  {@render props.children(startEdit)}
</div>

<style>
  .resizeable-box {
    min-height: var(--icon-size);
    max-height: 25vh;
  }
</style>
