<script lang="ts">
  export let value: string;
  export let values: string[];

  // on:input can't get currentTarget.value right
  export let onInput: (event: {
    currentTarget: EventTarget & HTMLSelectElement;
  }) => void;
</script>

<select class="dropdown" {value} on:input={onInput}>
  {#each values as value}
    <option {value}>{value}</option>
  {/each}
</select>
