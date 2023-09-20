<script lang="ts">
  export let value: string;
  export let values: string[];
</script>

<select class="dropdown" {value} on:input>
  {#each values as value}
    <option {value}>{value}</option>
  {/each}
</select>
