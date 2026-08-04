<script lang="ts">
  import type { Snippet } from "svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import type { LogTimeBlock, WithDuration } from "../../time-block-types";
  import { createGestures } from "../actions/gestures";
  import type { EditMode } from "../hooks/use-edit/types";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";

  const {
    timeBlock,
    mode,
    label,
    icon,
    isActive,
    setIsActive,
    reverse = false,
  }: {
    timeBlock: WithDuration<LogTimeBlock>;
    mode: EditMode;
    label: string;
    icon: Snippet;
    isActive: boolean;
    setIsActive: (value: boolean) => void;
    reverse?: boolean;
  } = $props();

  const {
    editContext: { startEdit },
  } = getObsidianContext();
</script>

<ExpandingControls {isActive} {reverse} {setIsActive}>
  {#snippet initial()}
    <BlockControlButton
      cursor="grab"
      {label}
      {@attach createGestures({
        onpanmove: () => startEdit({ timeBlock, mode }),
      })}
    >
      {@render icon()}
    </BlockControlButton>
  {/snippet}
</ExpandingControls>
