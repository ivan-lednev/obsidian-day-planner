<script lang="ts">
  import { getObsidianContext } from "../../context/obsidian-context";
  import { selectActiveLogEntries } from "../../redux/tracker/tracker-slice";

  import ActiveClocks from "./active-clocks.svelte";
  import ErrorBoundary from "./error-boundary.svelte";
  import Tree from "./obsidian/tree.svelte";
  import RecentClocks from "./RecentClocks.svelte";

  const { useSelectorV2 } = getObsidianContext();

  const activeLogRecords = useSelectorV2(selectActiveLogEntries);
</script>

<ErrorBoundary>
  <Tree title="Active clocks">
    {#snippet flair()}
      {String(activeLogRecords.current.length)}
    {/snippet}
    <ActiveClocks />
  </Tree>

  <Tree title="Recent clocks">
    <RecentClocks />
  </Tree>
</ErrorBoundary>
