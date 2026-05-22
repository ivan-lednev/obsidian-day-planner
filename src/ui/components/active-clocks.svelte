<script lang="ts">
  import { Play, Trash, Hourglass, File, Square } from "lucide-svelte";
  import { isNotVoid } from "typed-assert";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { currentTimeSignal } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";
  import { selectActiveLogEntries } from "../../redux/index/index-slice";
  import { runWithNoticeOnError } from "../../service/list-item-entry-editor";
  import type { LocalTask } from "../../task-types";
  import * as m from "../../util/moment";
  import { getDiffInMinutes } from "../../util/moment";
  import { createActiveClockMenu } from "../active-clock-menu";

  import BlockList from "./block-list.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Pill from "./pill.svelte";
  import Properties from "./properties.svelte";
  import Selectable from "./selectable.svelte";

  const { workspaceFacade, taskEntryEditor, useSelector } =
    getObsidianContext();

  const activeLogRecords = useSelector(selectActiveLogEntries);
  // todo: duplication?
  const activeLogRecordsCompat = $derived(
    activeLogRecords.current.map((it) => ({
      ...it,
      durationMinutes: getDiffInMinutes(
        it.startTime,
        currentTimeSignal.current,
      ),
    })),
  );
</script>

<BlockList list={activeLogRecordsCompat}>
  {#snippet match(task: LocalTask)}
    <Selectable
      onSecondarySelect={(event) =>
        createActiveClockMenu({
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
                value={task.startTime.format($settings.timestampFormat)}
              />
              <Pill
                key={Hourglass}
                value={m
                  .fromDiff(task.startTime, currentTimeSignal.current)
                  .format($settings.timestampFormat)}
              />

              <Pill
                key={Square}
                onpointerup={async () => {
                  isNotVoid(task.location);

                  await runWithNoticeOnError(
                    taskEntryEditor.clockOutAtLocation({
                      path: task.location.path,
                      line: task.location.position.start.line,
                    }),
                  );
                }}
                value="Stop"
              />

              <Pill
                key={Trash}
                onpointerup={async () => {
                  isNotVoid(task.location);

                  await runWithNoticeOnError(
                    taskEntryEditor.cancelClockAtLocation({
                      path: task.location.path,
                      line: task.location.position.start.line,
                    }),
                  );
                }}
                value="Cancel"
              />
            </Properties>
          {/snippet}
        </LocalTimeBlock>
      {/snippet}
    </Selectable>
  {/snippet}
</BlockList>
