<script lang="ts">
  import chroma from "chroma-js";
  import { GripVertical } from "lucide-svelte";
  import { MarkdownView } from "obsidian";
  import type { Readable } from "svelte/store";

  import { appStore } from "../../store/app-store";
  import { currentTime } from "../../store/current-time";
  import { editCancellation, editConfirmation } from "../../store/edit-events";
  import { useTask } from "../../store/new-hooks/use-task";
  import { settings } from "../../store/settings";
  import { settingsWithUtils } from "../../store/settings-with-utils";
  import type { PlacedPlanItem } from "../../types";
  import {
    getTextColorWithEnoughContrast,
    IContrastColors,
  } from "../../util/color";
  import { getFileByPath, openFileInEditor } from "../../util/obsidian";
  import { watch } from "../hooks/watch";

  import RenderedMarkdown from "./rendered-markdown.svelte";

  export let planItem: PlacedPlanItem;
  export let pointerYOffset: Readable<number>;
  export let isGhost = false;

  const {
    height,
    offset,
    relationToNow,
    dragging,
    cursor,
    startMove,
    confirmMove,
    cancelMove,
    cancelResize,
    startResize,
    confirmResize,
  } = useTask(planItem, {
    settings: settingsWithUtils,
    cursorOffsetY: pointerYOffset,
    currentTime,
    onUpdate: async () => {},
  });

  $: colorScale = chroma
    .scale([$settings.timelineStartColor, $settings.timelineEndColor])
    .mode("lab");

  $: backgroundColor =
    $settings.timelineColored && planItem.startTime
      ? colorScale(
          (planItem.startTime.hour() - $settings.startHour) /
            (24 - $settings.startHour),
        ).hex()
      : "var(--background-primary)";

  let properContrastColors: IContrastColors;
  $: properContrastColors =
    $settings.timelineColored && planItem.startTime
      ? getTextColorWithEnoughContrast(backgroundColor)
      : {
          normal: "var(--text-normal)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
        };

  watch(editConfirmation, () => {
    confirmMove();
    confirmResize();
  });

  watch(editCancellation, () => {
    cancelMove();
    cancelResize();
  });
</script>

<!--  overwrite global theme colors with contrasting text colors, when using colored theme-->
<div
  style:height="{$height}px"
  style:transform="translateY({$offset}px)"
  style:width="{planItem.placing.widthPercent || 100}%"
  style:left="{planItem.placing.xOffsetPercent || 0}%"
  class="gap-box absolute-stretch-x"
>
  <div
    style:background-color={backgroundColor}
    class="task {relationToNow}"
    class:is-ghost={isGhost}
    class:past={$relationToNow === "past"}
    class:present={$relationToNow === "present"}
    on:mousedown={(event) => event.stopPropagation()}
    on:mouseup={async () => {
      // todo: move to hook
      if (isGhost || $dragging) {
        return;
      }

      const file = getFileByPath(planItem.location.path);

      const editor = await openFileInEditor(file);
      $appStore.workspace
        .getActiveViewOfType(MarkdownView)
        ?.setEphemeralState({ line: planItem.location.line });

      editor.setCursor({ line: planItem.location.line, ch: 0 });
    }}
  >
    <RenderedMarkdown
      --text-faint={properContrastColors.faint}
      --text-muted={properContrastColors.muted}
      --text-normal={properContrastColors.normal}
      text={planItem.text}
    />
    <div
      style:cursor={$cursor}
      class="grip"
      on:mousedown|stopPropagation={startMove}
    >
      <GripVertical class="svg-icon" />
    </div>
    <div
      class="resize-handle absolute-stretch-x"
      on:mousedown|stopPropagation={startResize}
    ></div>
  </div>
</div>

<style>
  .grip {
    position: relative;
    right: -4px;

    grid-column: 2;
    align-self: flex-start;

    color: var(--text-faint);
  }

  .grip:hover {
    color: var(--text-muted);
  }

  .gap-box {
    display: flex;
    padding: 0 1px 2px;
    transition: 0.05s linear;
  }

  .task {
    position: relative;

    overflow: hidden;
    display: flex;
    flex: 1 0 0;

    padding: 4px 6px 6px;

    font-size: var(--font-ui-small);
    text-align: left;
    overflow-wrap: anywhere;
    white-space: normal;

    border: 1px solid var(--color-base-50);
    border-radius: var(--radius-s);
  }

  .task:hover {
    border-color: var(--color-base-70);
  }

  .past {
    background-color: var(--background-secondary);
  }

  .present {
    border-color: var(--color-accent);
  }

  .is-ghost {
    opacity: 0.6;
  }

  .resize-handle {
    cursor: s-resize;
    bottom: -8px;
    height: 16px;
  }
</style>
