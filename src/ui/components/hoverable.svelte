<script lang="ts">
  export let onMouseEnter: () => void | undefined = () => {};
  export let onMouseLeave: () => void | undefined = () => {};

  let hovering = false;
</script>

<div
  style:display="contents"
  on:mouseenter={() => {
    onMouseEnter();

    hovering = true;
  }}
  on:mouseleave={() => {
    onMouseLeave();

    hovering = false;
  }}
>
  <slot {hovering} />
</div>
