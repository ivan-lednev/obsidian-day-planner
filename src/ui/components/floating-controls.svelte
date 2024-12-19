<script lang="ts">
  import { offset } from "@floating-ui/dom";
  import { type ComputePositionConfig } from "@floating-ui/dom";
  import { type Snippet } from "svelte";
  import { isNotVoid } from "typed-assert";

  import { floatingUiOffset } from "../../constants";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { type HTMLActionArray } from "../actions/use-actions";
  import { createOffsetFnWithFrozenCrossAxis } from "../floating-ui-util";
  import { useFloatingUi } from "../hooks/use-floating-ui";

  import FloatingUi from "./floating-ui.svelte";
  import ShowActiveOrAll from "./show-active-or-all.svelte";

  interface AnchorProps {
    actions: HTMLActionArray;
  }

  interface FloatingUiProps {
    isActive: boolean;
    setIsActive: (isActive: boolean) => void;
  }

  type ActiveControl = "topEnd" | "bottom" | "top";

  type Props = {
    anchor: Snippet<[AnchorProps]>;
    active: boolean;
  } & Partial<Record<ActiveControl, Snippet<[FloatingUiProps]>>>;

  const { active, anchor, ...snippets }: Props = $props();

  const {
    editContext: { editOperation },
  } = getObsidianContext();

  let actions: HTMLActionArray = [];

  function createAnchoredFloatingUi(options: Partial<ComputePositionConfig>) {
    const ui = useFloatingUi(options);
    actions.push(ui.anchorSetup);

    const { placement } = options;

    isNotVoid(placement);

    return [ui.floatingUiSetup];
  }

  const controls = [
    {
      use: createAnchoredFloatingUi({
        middleware: [offset({ mainAxis: floatingUiOffset })],
        placement: "top-end",
      }),
      name: "topEnd",
    },
    {
      use: createAnchoredFloatingUi({
        middleware: [offset(createOffsetFnWithFrozenCrossAxis())],
        placement: "bottom-start",
      }),
      name: "bottom",
    },
    {
      use: createAnchoredFloatingUi({
        middleware: [offset(createOffsetFnWithFrozenCrossAxis())],
        placement: "top-start",
      }),
      name: "top",
    },
  ];
</script>

{@render anchor({ actions })}

{#if !$editOperation && active}
  <ShowActiveOrAll blocks={controls}>
    {#snippet block({ isActive, setIsActive, name, use })}
      <FloatingUi onpointerup={(event) => event.stopPropagation()} {use}>
        {@render snippets?.[name]?.({ isActive, setIsActive })}
      </FloatingUi>
    {/snippet}
  </ShowActiveOrAll>
{/if}
