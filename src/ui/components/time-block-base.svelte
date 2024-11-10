<script lang="ts">
  import { type Snippet } from "svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import type { Task } from "../../task-types";
  import { tappable } from "../actions/tappable";
  import type { ActionArray } from "../actions/use-actions";
  import { useActions } from "../actions/use-actions";
  import { getColorOverride } from "../hooks/get-color-override";
  import { useColor } from "../hooks/use-color.svelte";

  const {
    children,
    task,
    use = [],
  }: { children: Snippet; task: Task; use?: ActionArray } = $props();

  const { isDarkMode, settingsSignal } = getObsidianContext();

  const {
    properContrastColors: { normal, muted, faint },
    backgroundColor,
    borderColor,
  } = useColor({ task });
</script>

<div class="padding">
  <div
    style:--text-faint={faint}
    style:--text-muted={muted}
    style:--text-normal={normal}
    style:--time-block-bg-color={backgroundColor}
    style:--time-block-border-color={borderColor}
    style:background-color={getColorOverride(
      task,
      isDarkMode.current,
      settingsSignal.current,
    )}
    class="content"
    on:longpress
    on:pointerenter
    on:pointerleave
    on:pointerup
    on:tap
    use:tappable
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

    border: 1px solid var(--time-block-border-color, var(--color-base-50));
    border-radius: var(--radius-s);
    box-shadow: 1px 1px 2px 0 #0000001f;
  }
</style>
