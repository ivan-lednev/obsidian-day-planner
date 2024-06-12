<script>
  let hovering;
</script>

<div
  on:mouseenter={() => {
    hovering = true;
  }}
  on:mouseleave={() => {
    hovering = false;
  }}
>
  <slot {hovering} />
</div>
