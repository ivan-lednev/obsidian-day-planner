<script lang="ts">
  import type { LocalTask, WithPlacing, WithTime } from "../../task-types";
  import { hoverPreview } from "../actions/hover-preview";
  import type { HTMLActionArray } from "../actions/use-actions";

  import RenderedMarkdown from "./rendered-markdown.svelte";
  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  interface Props {
    task: WithPlacing<WithTime<LocalTask>>;
    isActive?: boolean;
    use?: HTMLActionArray;
  }

  const { use = [], isActive = false, task }: Props = $props();
</script>

<ScheduledTimeBlock
  --time-block-border-color-override={isActive ? "var(--color-accent)" : ""}
  --time-block-box-shadow={isActive
    ? "var(--shadow-stationary), var(--shadow-border-accent)"
    : ""}
  {task}
  use={[...use, hoverPreview(task)]}
>
  <RenderedMarkdown {task} />
</ScheduledTimeBlock>
