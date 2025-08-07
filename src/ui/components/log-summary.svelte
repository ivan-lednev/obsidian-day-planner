<script lang="ts">
  import { getObsidianContext } from "../../context/obsidian-context";

  const { logSummary } = getObsidianContext();
</script>

<table>
  <thead>
    <tr>
      <th></th>
      <th>Start</th>
      <th>End</th>
      <th>Time spent</th>
      <th>Total</th>
    </tr>
  </thead>
  <tbody>
    {#each $logSummary as entry}
      <tr>
        <td>{entry.title}</td>
        <td></td>
        <td></td>
        <td></td>
        <td>{entry.timeSpent}</td>
      </tr>
      {#each entry.log as logEntry}
        <tr>
          <td></td>
          <td>{logEntry.start}</td>
          <td>{logEntry.end}</td>
          <td>HREN</td>
          <td></td>
        </tr>
      {/each}
    {/each}
  </tbody>
</table>

<style>
  table {
    width: 100%;
  }
</style>
