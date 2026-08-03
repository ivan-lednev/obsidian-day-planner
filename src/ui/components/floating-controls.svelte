<script lang="ts">
  import { offset } from "@floating-ui/dom";
  import { type ComputePositionConfig } from "@floating-ui/dom";
  import { type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import { isNotVoid } from "typed-assert";

  import { floatingUiOffset } from "../../constants";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { createOffsetFnWithFrozenCrossAxis } from "../floating-ui-util";
  import { useFloatingUi } from "../hooks/use-floating-ui";

  import FloatingUi from "./floating-ui.svelte";
  import ShowActiveOrAll from "./show-active-or-all.svelte";

  interface AnchorProps {
    anchor: Attachment<HTMLElement>;
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

  let anchorEl: HTMLElement | undefined;

  const setAnchor: Attachment<HTMLElement> = (el) => {
    anchorEl = el;

    return () => {
      anchorEl = undefined;
    };
  };

  function createAnchoredFloatingUi(options: Partial<ComputePositionConfig>) {
    const { placement } = options;

    isNotVoid(placement);

    return useFloatingUi(() => anchorEl, options);
  }

  const controls: Array<{
    name: ActiveControl;
    floatingUi: Attachment<HTMLElement>;
  }> = [
    {
      floatingUi: createAnchoredFloatingUi({
        middleware: [offset({ mainAxis: floatingUiOffset })],
        placement: "top-end",
      }),
      name: "topEnd",
    },
    {
      floatingUi: createAnchoredFloatingUi({
        middleware: [offset(createOffsetFnWithFrozenCrossAxis())],
        placement: "bottom-start",
      }),
      name: "bottom",
    },
    {
      floatingUi: createAnchoredFloatingUi({
        middleware: [offset(createOffsetFnWithFrozenCrossAxis())],
        placement: "top-start",
      }),
      name: "top",
    },
  ];
</script>

{@render anchor({ anchor: setAnchor })}

{#if !$editOperation && active}
  <ShowActiveOrAll blocks={controls}>
    {#snippet block({ isActive, setIsActive, name, floatingUi })}
      <FloatingUi
        onpointerup={(event) => event.stopPropagation()}
        {@attach floatingUi}
      >
        {@render snippets?.[name]?.({ isActive, setIsActive })}
      </FloatingUi>
    {/snippet}
  </ShowActiveOrAll>
{/if}
