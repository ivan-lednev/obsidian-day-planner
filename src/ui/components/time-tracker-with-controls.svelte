<script lang="ts">
  import { Plus } from "lucide-svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { selectActiveLogEntries } from "../../redux/index/index-slice";

  import ActiveClocks from "./active-clocks.svelte";
  import ControlButton from "./control-button.svelte";
  import ErrorBoundary from "./error-boundary.svelte";
  import Tree from "./obsidian/tree.svelte";
  import RecentClocks from "./recent-clocks.svelte";

  const { useSelector, openClockInOnAnythingModal } = getObsidianContext();

  const activeLogRecords = useSelector(selectActiveLogEntries);
</script>

<ErrorBoundary>
  <Tree alwaysShowControls title="Active clocks">
    {#snippet flair()}
      {String(activeLogRecords.current.length)}
    {/snippet}
    {#snippet controls()}
      <ControlButton
        --border-radius="0"
        label="Clock in on anything"
        onclick={() => openClockInOnAnythingModal()}
      >
        {#snippet icon()}
          <Plus class="svg-icon" />
        {/snippet}
      </ControlButton>
    {/snippet}
    <ActiveClocks />
  </Tree>

  <Tree title="Recently tracked">
    <RecentClocks />
  </Tree>
</ErrorBoundary>
