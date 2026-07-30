<script lang="ts">
  import type { Snippet } from "svelte";

  import type { RemoteTimeBlock } from "../../time-block-types";

  const {
    timeBlock,
    bottomDecoration,
  }: { timeBlock: RemoteTimeBlock; bottomDecoration?: Snippet } = $props();

  const tentative = $derived(timeBlock.rsvpStatus === "TENTATIVE");
  const declined = $derived(timeBlock.rsvpStatus === "DECLINED");
</script>

<div class="remote-time-block-content">
  <div
    style:--ribbon-color={timeBlock.calendar.color}
    class={["ribbon", { declined, tentative }]}
  ></div>
  <div class="planner-sticky-block-content">
    <span class={["summary", { declined }]}>
      {timeBlock.summary}
    </span>
    <div>
      {@render bottomDecoration?.()}
    </div>
  </div>
</div>

<style>
  .remote-time-block-content {
    display: flex;
    flex: 1 0 0;
    flex-direction: column;

    height: 100%;
    padding: var(--size-2-1) var(--size-4-1);
    padding-bottom: 0;
    padding-left: calc(4px + var(--size-4-2));
  }

  .ribbon {
    /* TODO: might remove this. We need more thickness to show tentative/declined */
    position: absolute;
    top: var(--size-2-1);
    bottom: var(--size-2-1);
    left: var(--size-2-1);

    width: var(--size-4-1);

    background-color: var(--ribbon-color);
    border-radius: var(--radius-s);
  }

  .declined {
    background-color: inherit;
    border-right: 2px solid var(--ribbon-color);
  }

  .ribbon.tentative {
    background: repeating-linear-gradient(
      45deg,
      var(--ribbon-color),
      var(--ribbon-color) 5px,
      transparent 5px,
      transparent 10px
    );
    border-right: 1px solid var(--ribbon-color);
  }

  .summary {
    font-weight: var(--font-semibold);
  }

  .summary.declined {
    color: var(--text-muted);
    text-decoration: line-through;
  }
</style>
