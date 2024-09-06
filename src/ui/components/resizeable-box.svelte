<script lang="ts">
  import { isNotVoid } from "typed-assert";
  export let classNames: string | undefined = "";

  let el: HTMLDivElement | undefined;

  let customHeight = 0;

  $: height = customHeight === 0 ? "auto" : `${customHeight}px`;

  let editingHeight = false;

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

<div bind:this={el} style:height style:max-height="25vh" class={classNames}>
  <slot {startEdit} />
</div>
