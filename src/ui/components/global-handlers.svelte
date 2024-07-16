<script lang="ts">
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import type { ObsidianContext } from "../../types";
  import { styledCursor } from "../actions/styled-cursor";

  const {
    editContext: { cancelEdit, cursor },
  } = getContext<ObsidianContext>(obsidianContext);

</script>

<!--TODO: this should be attached only once for all views-->
<svelte:window on:blur={cancelEdit} />
<svelte:body use:styledCursor={$cursor.bodyCursor} />
<svelte:document on:pointerup={cancelEdit} />
