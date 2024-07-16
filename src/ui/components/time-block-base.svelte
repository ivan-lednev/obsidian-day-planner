<script lang="ts">
  import { UnscheduledTask } from "../../types";
  import { ActionArray, useActions } from "../actions/use-actions";
  import { useColorOverride } from "../hooks/use-color-override";

  export let task: UnscheduledTask;
  export let use: ActionArray = [];

  $: override = useColorOverride(task);
  // todo: hide in hook
  $: backgroundColor =
    $override || "var(--time-block-bg-color, var(--background-primary))";
</script>

<div class="padding">
  <div
    style:background-color={backgroundColor}
    class="content"
    on:pointerdown={(event) => event.stopPropagation()}
    on:pointerup
    use:useActions={use}
  >
    <slot />
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
