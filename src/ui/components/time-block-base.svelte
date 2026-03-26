<script lang="ts">
  import { type Snippet } from "svelte";

  import type { Task } from "../../task-types";
  import type { ActionArray } from "../actions/use-actions";
  import { useActions } from "../actions/use-actions";
  import { useColorOverrides } from "../hooks/use-color.svelte";

  interface Props {
    children: Snippet;
    task: Task;
    use?: ActionArray;
    onpointerup?: (event: PointerEvent) => void;
  }

  const { onpointerup, children, task, use = [] }: Props = $props();

  const {
    properContrastColors: { normal, muted, faint },
    backgroundColor,
  } = $derived(useColorOverrides({ task }));
</script>

<div class="padding">
  <div
    style:--text-faint={faint}
    style:--text-muted={muted}
    style:--text-normal={normal}
    style:--time-block-bg-color={backgroundColor}
    class={[
      "content",
      task.truncated?.includes("left") && "truncated-left",
      task.truncated?.includes("right") && "truncated-right",
      task.truncated?.includes("bottom") && "truncated-bottom",
    ]}
    {onpointerup}
    use:useActions={use}
  >
    {@render children()}
  </div>
</div>

<style>
  .padding {
    position: var(--time-block-position, static);
    top: var(--time-block-top, 0);
    left: var(--time-block-left, 0);

    display: flex;
    grid-column: var(--time-block-grid-column, unset);

    width: var(--time-block-width, 100%);
    height: var(--time-block-height, auto);
    padding: var(--time-block-padding, 0 1px 2px);

    transition: 0.05s linear;
  }

  .content {
    position: relative;

    flex: 1 0 0;

    font-size: var(--font-ui-small);
    text-align: left;
    overflow-wrap: anywhere;
    white-space: normal;

    background-color: var(--time-block-bg-color, var(--background-primary));
    border: 1px solid
      var(
        --time-block-border-color-override,
        var(--time-block-border-color, var(--color-base-50))
      );
    border-radius: var(--radius-s);
    box-shadow: var(--time-block-box-shadow);
  }

  .truncated-left {
    border-left-style: dashed;
    border-left-width: 2px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  .truncated-right {
    border-right-style: dashed;
    border-right-width: 2px;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .truncated-bottom {
    border-bottom-style: dashed;
    border-bottom-width: 2px;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
  }
</style>
