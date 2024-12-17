<script lang="ts">
  import { offset } from "@floating-ui/dom";
  import { type Snippet } from "svelte";

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

  type ActiveControl = "top-end" | "bottom" | "top";

  interface Props {
    anchor: Snippet<[AnchorProps]>;
    topEnd: Snippet<[FloatingUiProps]>;
    bottom?: Snippet<[FloatingUiProps]>;
    top?: Snippet<[FloatingUiProps]>;
    isAnchorActive: boolean;
  }

  const { anchor, topEnd, bottom, top, isAnchorActive }: Props = $props();

  const {
    editContext: { editOperation },
  } = getObsidianContext();

  let activeControl = $state<ActiveControl>();

  function createSetActiveControl(control: ActiveControl) {
    return (isActive: boolean) => {
      activeControl = isActive ? control : undefined;
    };
  }

  const topEndFloatingUi = useFloatingUi({
    middleware: [offset({ mainAxis: floatingUiOffset })],
    placement: "top-end",
  });

  const bottomFloatingUi = useFloatingUi({
    middleware: [offset(createOffsetFnWithFrozenCrossAxis())],
    placement: "bottom-start",
  });

  const topFloatingUi = useFloatingUi({
    middleware: [offset(createOffsetFnWithFrozenCrossAxis())],
    placement: "top-start",
  });

  function stopPropagation(event: PointerEvent) {
    event.stopPropagation();
  }
</script>

{@render anchor({
  actions: [
    topEndFloatingUi.anchorSetup,
    bottomFloatingUi.anchorSetup,
    topFloatingUi.anchorSetup,
  ],
})}

{#if !$editOperation && isAnchorActive}
  {#if !activeControl || activeControl === "top-end"}
    <FloatingUi
      onpointerup={stopPropagation}
      use={[topEndFloatingUi.floatingUiSetup]}
    >
      {@render topEnd({
        isActive: activeControl === "top-end",
        setIsActive: createSetActiveControl("top-end"),
      })}
    </FloatingUi>
  {/if}

  {#if !activeControl || activeControl === "bottom"}
    <FloatingUi
      onpointerup={stopPropagation}
      use={[bottomFloatingUi.floatingUiSetup]}
    >
      {@render bottom?.({
        isActive: activeControl === "bottom",
        setIsActive: createSetActiveControl("bottom"),
      })}
    </FloatingUi>
  {/if}

  {#if !activeControl || activeControl === "top"}
    <FloatingUi
      onpointerup={stopPropagation}
      use={[topFloatingUi.floatingUiSetup]}
    >
      {@render top?.({
        isActive: activeControl === "top",
        setIsActive: createSetActiveControl("top"),
      })}
    </FloatingUi>
  {/if}
{/if}
