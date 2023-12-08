<script lang="ts">
  import { Pause, Trash2 } from "lucide-svelte";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../../constants";
  import { ObsidianContext } from "../../../types";
  import ControlButton from "../control-button.svelte";
  import Tree from "../obsidian/tree.svelte";


  const { activeClocks } = getContext<ObsidianContext>(obsidianContext);
</script>

<Tree title="Active clocks">
  {#each $activeClocks as clock}
    <div class="inner-container">
      <ControlButton label="Clock out" on:click={() => {}}>
        <Pause class="svg-icon" />
      </ControlButton>
      <ControlButton label="Cancel clock" on:click={() => {}}>
        <Trash2 class="svg-icon" />
      </ControlButton>
      <div class="task-text">{clock.text}</div>
    </div>
  {/each}
</Tree>

<style>
  /*   TODO: rename classes */
  .inner-container {
    display: flex;
  }

  .task-text {
    display: flex;
    align-items: center;
    margin: var(--size-4-2);
    font-size: var(--font-ui-small);
  }
</style>
