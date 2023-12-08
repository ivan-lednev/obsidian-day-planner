<script lang="ts">
  import { Play, Square, Trash2 } from "lucide-svelte";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../../constants";
  import { ObsidianContext } from "../../../types";
  import AccordionButton from "../accordion-button.svelte";

  const { clockInUnderCursor, clockOutUnderCursor, cancelClockUnderCursor } =
    getContext<ObsidianContext>(obsidianContext);
</script>

<div class="control-buttons">
  <AccordionButton icon={Play} on:click={clockInUnderCursor}>
    Clock in
  </AccordionButton>

  <AccordionButton icon={Square} on:click={clockOutUnderCursor}>
    Clock out
  </AccordionButton>

  <AccordionButton icon={Trash2} on:click={cancelClockUnderCursor}>
    Cancel clock
  </AccordionButton>
</div>

<style>
  .control-buttons :global(svg.svg-icon) {
    width: calc(var(--icon-xs) - 2px);
    height: calc(var(--icon-xs) - 2px);
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
