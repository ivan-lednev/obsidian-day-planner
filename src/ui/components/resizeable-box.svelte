<script lang="ts">
  import { type Snippet } from "svelte";
  import { isNotVoid } from "typed-assert";

  const {
    children,
    className,
  }: { children: Snippet<[() => void]>; className?: string } = $props();

  let el: HTMLDivElement | undefined;

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

  function handleMouseMove(event: MouseEvent) {
    if (!editingHeight) {
      return;
    }

    isNotVoid(el);

    const viewportToElOffsetY = el.getBoundingClientRect().top;

    customHeight = event.clientY - viewportToElOffsetY;
  }
</script>

<svelte:document
  on:mousemove={handleMouseMove}
  on:pointerup|capture={stopEdit}
/>
<svelte:window on:blur={handleBlur} />

<div bind:this={el} style:height style:max-height="25vh" class={className}>
  {@render children(startEdit)}
</div>
