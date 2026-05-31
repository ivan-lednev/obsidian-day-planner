<script lang="ts">
  import { clockFormat } from "../../constants";

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
  let end = $derived(toInputFormat(initialEnd));
</script>

<div class="modal-wrapper">
  <div class="start-end-wrapper">
    <label>
      Start: <input type="datetime-local" bind:value={start} />
    </label>

    <label>
      End: <input type="datetime-local" bind:value={end} />
    </label>
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
    justify-content: space-between;
    row-gap: var(--size-4-2);
    flex-wrap: wrap;
  }

  .buttons-wrapper {
    display: flex;
    flex-direction: row-reverse;
    gap: var(--size-4-2);
    align-items: flex-end;
  }

  label {
    display: inline-flex;
    gap: var(--size-4-2);
    align-items: center;
    color: var(--text-muted);
  }
</style>
