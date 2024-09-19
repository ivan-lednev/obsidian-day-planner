<script lang="ts">
  import { getContext, type Snippet } from "svelte";
  import { fromStore } from "svelte/store";

  import { settings } from "../../global-store/settings";
  import type { Task } from "../../task-types";
  import type { ObsidianContext } from "../../types";
  import { tappable } from "../actions/tappable";
  import type { ActionArray } from "../actions/use-actions";
  import { useActions } from "../actions/use-actions";
  import { getColorOverride } from "../hooks/get-color-override.svelte";

  import { obsidianContext } from "./../../constants";

  const {
    children,
    task,
    use = [],
  }: { children: Snippet; task: Task; use: ActionArray } = $props();

  const { isDarkMode } = getContext<ObsidianContext>(obsidianContext);

  const override = $derived(
    getColorOverride(
      task,
      fromStore(isDarkMode).current,
      fromStore(settings).current,
    ),
  );
</script>

<div class="padding">
  <div
    style:background-color={override}
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
    padding: 0 1px 2px;

    transition: 0.05s linear;
  }

  .content {
    position: relative;

    overflow: hidden;
    display: flex;
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
