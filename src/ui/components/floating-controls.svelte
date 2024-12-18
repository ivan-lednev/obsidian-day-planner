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
    isAnchorActive: boolean;
  } & Partial<Record<ActiveControl, Snippet<[FloatingUiProps]>>>;

  const { anchor, isAnchorActive, ...snippets }: Props = $props();

  const {
    editContext: { editOperation },
  } = getObsidianContext();

  let activeControl = $state<ActiveControl>();

  function createSetActiveControl(control: ActiveControl) {
    return (isActive: boolean) => {
      activeControl = isActive ? control : undefined;
    };
  }

  function isControlShown(control: ActiveControl) {
    return !activeControl || activeControl === control;
  }

  const placementToRenderProp = {
    "top-end": "topEnd",
    "top-start": "top",
    "bottom-start": "bottom",
  } as const;

  let anchorActions: HTMLActionArray = [];

  function createAnchoredFloatingUi(options: Partial<ComputePositionConfig>) {
    const ui = useFloatingUi(options);
    anchorActions.push(ui.anchorSetup);

    const { placement } = options;

    isNotVoid(placement);

    return {
      use: [ui.floatingUiSetup],
      name: placementToRenderProp[placement],
    };
  }

  const controls = [
    createAnchoredFloatingUi({
      middleware: [offset({ mainAxis: floatingUiOffset })],
      placement: "top-end",
    }),
    createAnchoredFloatingUi({
      middleware: [offset(createOffsetFnWithFrozenCrossAxis())],
      placement: "bottom-start",
    }),
    createAnchoredFloatingUi({
      middleware: [offset(createOffsetFnWithFrozenCrossAxis())],
      placement: "top-start",
    }),
  ];
</script>

{@render anchor({ actions: anchorActions })}

{#if !$editOperation && isAnchorActive}
  {#each controls as { name, use }}
    {#if isControlShown(name)}
      <FloatingUi
        onpointerup={(event) => event.stopPropagation()}
        use={[...use]}
      >
        {@render snippets?.[name]?.({
          isActive: activeControl === name,
          setIsActive: createSetActiveControl(name),
        })}
      </FloatingUi>
    {/if}
  {/each}
{/if}
