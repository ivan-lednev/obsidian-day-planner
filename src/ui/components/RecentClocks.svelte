<script lang="ts">
  import { File } from "lucide-svelte";
  import { isNotVoid } from "typed-assert";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { selectRecentClocks } from "../../redux/tracker/tracker-slice";
  import type { LocalTask } from "../../task-types";

  import BlockList from "./block-list.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Pill from "./pill.svelte";
  import Properties from "./Properties.svelte";
  import Selectable from "./selectable.svelte";
  import { createRecentClockMenu } from "../recent-clock-menu";

  const { workspaceFacade, useSelectorV2, sTaskEditor } = getObsidianContext();

  const recentLogRecords = useSelectorV2((state) => selectRecentClocks(state));
</script>

<BlockList list={recentLogRecords.current}>
  {#snippet match(task: LocalTask)}
    <Selectable
      onSecondarySelect={(event) =>
        createRecentClockMenu({ event, task, sTaskEditor, workspaceFacade })}
    >
      {#snippet children({ use, onpointerup, state })}
        <LocalTimeBlock
          isActive={state === "secondary"}
          {onpointerup}
          {task}
          {use}
        >
          {#snippet bottomDecoration()}
            <Properties>
              {#if task.location?.path}
                <Pill
                  key={File}
                  onpointerup={() => {
                    isNotVoid(task.location);

                    return workspaceFacade.revealLineInFile(
                      task.location.path,
                      task.location.position.start.line,
                    );
                  }}
                  value={task.location.path.replace(/\.md$/, "")}
                />
              {/if}
            </Properties>
          {/snippet}
        </LocalTimeBlock>
      {/snippet}
    </Selectable>
  {/snippet}
</BlockList>
