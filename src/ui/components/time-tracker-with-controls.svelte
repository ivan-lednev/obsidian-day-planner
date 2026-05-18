<script lang="ts">
  import { getObsidianContext } from "../../context/obsidian-context";
  import { selectActiveLogEntries } from "../../redux/index/index-slice";

  import ActiveClocks from "./active-clocks.svelte";
  import ErrorBoundary from "./error-boundary.svelte";
  import Tree from "./obsidian/tree.svelte";
  import RecentClocks from "./recent-clocks.svelte";

  const { useSelector } = getObsidianContext();

  const activeLogRecords = useSelector(selectActiveLogEntries);
</script>

<ErrorBoundary>
  <Tree title="Active clocks">
    {#snippet flair()}
      {String(activeLogRecords.current.length)}
    {/snippet}
    <ActiveClocks />
  </Tree>

  <Tree title="Recently tracked">
    <RecentClocks />
  </Tree>
</ErrorBoundary>
