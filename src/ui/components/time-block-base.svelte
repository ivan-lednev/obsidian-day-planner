<script lang="ts">
  import { type Snippet } from "svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import type { Task } from "../../task-types";
  import type { ActionArray } from "../actions/use-actions";
  import { useActions } from "../actions/use-actions";
  import { getColorOverride } from "../hooks/get-color-override";
  import { useColor } from "../hooks/use-color.svelte";

  interface Props {
    children: Snippet;
    task: Task;
    use?: ActionArray;
    onpointerup?: (event: PointerEvent) => void;
  }

  const { onpointerup, children, task, use = [] }: Props = $props();

  const { isDarkMode, settingsSignal } = getObsidianContext();

  const {
    properContrastColors: { normal, muted, faint },
    backgroundColor,
    borderColor,
  } = $derived(useColor({ task }));
</script>

<div class="padding">
  <div
    style:--text-faint={faint}
    style:--text-muted={muted}
    style:--text-normal={normal}
    style:--time-block-bg-color={backgroundColor}
    style:--time-block-border-color="var(--time-block-border-color-override, {borderColor})"
    style:background-color={getColorOverride(
      task,
      isDarkMode.current,
      settingsSignal.current,
    )}
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
    --default-box-shadow: 1px 1px 2px 0 #0000001f;

    position: relative;

    flex: 1 0 0;

    font-size: var(--font-ui-small);
    text-align: left;
    overflow-wrap: anywhere;
    white-space: normal;

    border: 1px solid var(--time-block-border-color, var(--color-base-50));
    border-radius: var(--radius-s);
    box-shadow: var(--time-block-box-shadow, var(--default-box-shadow));
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
