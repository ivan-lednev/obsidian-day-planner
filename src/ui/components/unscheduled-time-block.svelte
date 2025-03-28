<script lang="ts">
  import { getObsidianContext } from "../../context/obsidian-context";
  import { isLocal, type Task } from "../../task-types";
  import { createTimeBlockMenu } from "../time-block-menu";

  import DragControls from "./drag-controls.svelte";
  import FloatingControls from "./floating-controls.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import RemoteTimeBlockContent from "./remote-time-block-content.svelte";
  import Selectable from "./selectable.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  const { task }: { task: Task; class?: string } = $props();

  const {
    editContext: { editOperation },
    workspaceFacade,
  } = getObsidianContext();
</script>

{#if isLocal(task)}
  <Selectable
    onSecondarySelect={(event) =>
      createTimeBlockMenu({ event, task, workspaceFacade })}
    selectionBlocked={Boolean($editOperation)}
  >
    {#snippet children(selectable)}
      <FloatingControls active={selectable.state === "primary"}>
        {#snippet anchor(floatingControls)}
          <LocalTimeBlock
            isActive={selectable.state !== "none"}
            onpointerup={selectable.onpointerup}
            {task}
            use={[...selectable.use, ...floatingControls.actions]}
          />
        {/snippet}
        {#snippet topEnd({ isActive, setIsActive })}
          <DragControls
            --expanding-controls-position="absolute"
            {isActive}
            {setIsActive}
            {task}
          />
        {/snippet}
      </FloatingControls>
    {/snippet}
  </Selectable>
{:else}
  <TimeBlockBase {task}>
    <RemoteTimeBlockContent {task} />
  </TimeBlockBase>
{/if}
