<script lang="ts">
  import { Play, Square, Trash2 } from "lucide-svelte";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../../constants";
  import { ObsidianContext } from "../../../types";
  import ControlButton from "../control-button.svelte";

  const { clockInUnderCursor, clockOutUnderCursor, cancelClockUnderCursor } =
    getContext<ObsidianContext>(obsidianContext);
</script>

<div class="control-buttons">
  <ControlButton
    --align-self="stretch"
    label="Clock in"
    on:click={clockInUnderCursor}
  >
    <div class="button-text">
      <Play class="svg-icon" />
      Clock in
    </div>
  </ControlButton>

  <!--    todo: fix duplicated props-->
  <!--    todo: fix duplicated divs-->
  <ControlButton
    --align-self="stretch"
    label="Clock in"
    on:click={clockInUnderCursor}
  >
    <div class="button-text">
      <Play class="svg-icon" />
      Clock in
    </div>
  </ControlButton>
  <ControlButton
    --align-self="stretch"
    label="Clock out"
    on:click={clockOutUnderCursor}
  >
    <div class="button-text">
      <Square class="svg-icon" />
      Clock out
    </div>
  </ControlButton>
  <ControlButton
    --align-self="stretch"
    label="Cancel clock"
    on:click={cancelClockUnderCursor}
  >
    <div class="button-text">
      <Trash2 class="svg-icon" />
      Cancel clock
    </div>
  </ControlButton>
</div>

<style>
  /* TODO: fix selector hacks */
  .control-buttons :global(.clickable-icon) {
    padding-left: var(--size-4-6);
  }

  .control-buttons :global(svg.svg-icon) {
    width: calc(var(--icon-xs) - 2px);
    height: calc(var(--icon-xs) - 2px);
  }

  .button-text {
    display: inline-flex;
    gap: var(--size-4-1);
    align-items: center;
  }

  .control-buttons {
    display: flex;
    flex-direction: column;
    font-size: var(--font-ui-smaller);
  }

  .control-buttons > :global(*) {
    flex: 1 0 0;
  }
</style>
