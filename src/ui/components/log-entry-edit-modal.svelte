<script lang="ts">
  import { Delete } from "lucide-svelte";

  import { clockFormat } from "../../constants";

  import ControlButton from "./control-button.svelte";

  let {
    initialStart,
    initialEnd,
    onConfirm,
    onCancel,
  }: {
    initialStart: string;
    initialEnd: string;
    onConfirm: (props: { start: string; end?: string }) => void;
    onCancel: () => void;
  } = $props();

  const toInputFormat = (clockValue: string) =>
    window.moment(clockValue, clockFormat).format("YYYY-MM-DDTHH:mm");

  const toClockFormat = (inputValue: string) =>
    window.moment(inputValue).format(clockFormat);

  let start = $derived(toInputFormat(initialStart));
  let end: string | undefined = $derived(toInputFormat(initialEnd));
</script>

<div class="modal-wrapper">
  <div class="start-end-wrapper">
    <input type="datetime-local" bind:value={start} />
    <span class="arrow">→</span>
    <input type="datetime-local" bind:value={end} />
    <ControlButton
      onclick={() => {
        end = undefined;
      }}
    >
      <Delete class="svg-icon" />
    </ControlButton>
  </div>

  <div class="buttons-wrapper">
    <button
      class="mod-cta"
      onclick={() =>
        onConfirm({
          start: start ? toClockFormat(start) : initialStart,
          end: end ? toClockFormat(end) : undefined,
        })}
    >
      Confirm
    </button>
    <button onclick={onCancel}>Cancel</button>
  </div>
</div>

<style>
  .modal-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-4);
  }

  .start-end-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-4-1);
    row-gap: var(--size-4-2);
    align-self: center;
  }

  .buttons-wrapper {
    display: flex;
    flex-direction: row-reverse;
    gap: var(--size-4-2);
    align-items: flex-end;
  }

  input[type="datetime-local"] {
    border-radius: var(--radius-s);
  }

  .arrow {
    margin-inline: var(--size-4-2);
    font-size: var(--font-ui-large);
  }
</style>
