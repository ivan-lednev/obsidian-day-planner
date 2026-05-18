<script lang="ts">
  import { File, Play } from "lucide-svelte";
  import { isNotVoid } from "typed-assert";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { selectRecentLogEntries } from "../../redux/index/index-selectors";
  import type { LocalTask } from "../../task-types";
  import { createRecentClockMenu } from "../recent-clock-menu";

  import { runWithNoticeOnError } from "./../../service/list-item-entry-editor";
  import BlockList from "./block-list.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Pill from "./pill.svelte";
  import Properties from "./properties.svelte";
  import Selectable from "./selectable.svelte";

  const { workspaceFacade, useSelector, taskEntryEditor } =
    getObsidianContext();

  const recentLogRecords = useSelector((state) =>
    selectRecentLogEntries(state),
  );
</script>

<BlockList list={recentLogRecords.current}>
  {#snippet match(task: LocalTask)}
    <Selectable
      onSecondarySelect={(event) =>
        createRecentClockMenu({
          event,
          task,
          taskEntryEditor,
          workspaceFacade,
        })}
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
              <Pill
                key={Play}
                onpointerup={async () => {
                  isNotVoid(task.location);

                  await runWithNoticeOnError(
                    taskEntryEditor.clockInAtLocation(task.location),
                  );
                }}
                value="Start"
              />
            </Properties>
          {/snippet}
        </LocalTimeBlock>
      {/snippet}
    </Selectable>
  {/snippet}
</BlockList>
