<script lang="ts">
  import {
    ActivityRepository,
    getActivityAttributeFields,
    getActivityDisplayLabel,
    getActivityLabel,
    getActivitySuggestionsWithHistory,
    filterActivitySuggestions,
    type ActivitySelection,
    type ActivityNameSuggestion,
    mergeActivityFieldOptions,
    createActivityRecord,
    resolveActivitySelection,
    getActivityFinishFields,
    type ActivityValues,
    getOpenActivityLog,
    hasOpenActivityClock,
    parseActivityTimestamp,
  } from "../../src/shared/activity";
  import { onMount } from "svelte";
  import ActivityFields from "./ActivityFields.svelte";
  import {
    ActivityNotifications,
    type ActivityState,
    type ActivityEntry,
    type VaultConnection,
    vaultFiles,
  } from "./lib/activity-notifications";
  import {
    parseResourceFile,
    resourceOptions,
    activityYaml,
    type ResourceFile,
  } from "./lib/activity-files";

  let activity = $state<ActivityState>({ active: false });
  let connection = $state<VaultConnection>({ connected: false });
  const repository = new ActivityRepository(vaultFiles, activityYaml);
  let entries = $state<ActivityEntry[]>([]);
  let resources = $state<ResourceFile[]>([]);
  let selection = $state<ActivitySelection | null>(null);
  let finishingId = $state<string | null>(null);
  let finishingLogStart = $state<string | null>(null);
  let query = $state("");
  let highlighted = $state(0);
  let error = $state("");
  let notice = $state("");
  let busy = $state(false);
  let refreshRequested = false;
  let resourcesLoading = $state(false);
  let resourceLoad: Promise<void> | undefined;
  let resourceGeneration = 0;
  let now = $state(Date.now());
  const records = $derived(entries.map(({ record }) => record));
  const suggestions = $derived(
    filterActivitySuggestions(
      getActivitySuggestionsWithHistory(records),
      query,
    ),
  );
  const startFields = $derived(
    selection
      ? getActivityAttributeFields(selection.activityName, "start")
      : [],
  );
  const fieldOptions = $derived(
    selection
      ? mergeActivityFieldOptions(
          selection.activityName,
          records,
          resourceOptions(startFields, resources),
        )
      : {},
  );
  const openEntries = $derived(
    entries.filter(({ record }) => hasOpenActivityClock(record)),
  );
  const elapsed = $derived(
    activity.active ? formatElapsed(now - activity.startedAt) : "00:00:00",
  );

  onMount(() => {
    void run(refresh);
    const listener = ActivityNotifications.addListener(
      "finishRequested",
      requestRefresh,
    );
    const timer = window.setInterval(() => {
      now = Date.now();
    }, 1000);
    const visibilityListener = () => {
      if (document.visibilityState === "visible") void run(refresh);
    };
    document.addEventListener("visibilitychange", visibilityListener);
    return () => {
      resourceGeneration++;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visibilityListener);
      void listener.then((handle) => handle.remove());
    };
  });

  async function refresh() {
    connection = await ActivityNotifications.getConnection();
    if (!connection.connected) {
      resourceGeneration++;
      resourceLoad = undefined;
      resourcesLoading = false;
      activity = { active: false };
      entries = [];
      resources = [];
      return;
    }
    entries = await repository.getActivities();
    const selected = await ActivityNotifications.getActiveActivity();
    const { requestedId, requestedLog, validRequest, current } =
      resolveActivitySelection(entries, selected);
    if (requestedId && !validRequest) {
      await ActivityNotifications.cancelFinish({
        id: requestedId,
        logStart: selected.finishLogStart,
      });
      finishingId = null;
      notice =
        "That clock is no longer open or its activity changed. Refresh and select it again.";
    }
    if (current) {
      const startedAt = parseActivityTimestamp(
        (validRequest ? requestedLog! : getOpenActivityLog(current.record)!)
          .start,
      ).valueOf();
      const label = getActivityDisplayLabel(
        current.record.activity,
        current.record,
      );
      activity = {
        ...current,
        active: true,
        label,
        startedAt,
        finishRequested: validRequest,
      };
      await ActivityNotifications.selectActivity({
        id: current.id,
        label,
        startedAt,
      });
    } else {
      activity = { active: false };
      await ActivityNotifications.clearSelection();
    }
    if (!activity.active || (finishingId && finishingId !== activity.id))
      finishingId = null;
    if (
      activity.active &&
      activity.finishRequested &&
      (finishingId !== activity.id || finishingLogStart !== requestedLog?.start)
    ) {
      selection = null;
      finishingId = activity.id;
      finishingLogStart = requestedLog!.start;
    }
  }

  async function readResources(generation: number) {
    const next: ResourceFile[] = [];
    const { paths } = await ActivityNotifications.listFiles({
      extension: ".md",
    });
    for (const path of paths) {
      if (generation !== resourceGeneration) return;
      const contents = await vaultFiles.readFile(path);
      if (contents !== null)
        next.push(parseResourceFile(path.split("/").at(-1)!, contents));
    }
    if (generation === resourceGeneration) resources = next;
  }

  function loadResources() {
    if (!resourceLoad) {
      const generation = resourceGeneration;
      resourcesLoading = true;
      resourceLoad = readResources(generation).finally(() => {
        if (generation === resourceGeneration) {
          resourceLoad = undefined;
          resourcesLoading = false;
        }
      });
    }
    return resourceLoad;
  }

  async function chooseVault() {
    await run(async () => {
      connection = await ActivityNotifications.chooseVault();
      resourceGeneration++;
      resourceLoad = undefined;
      resourcesLoading = false;
      resources = [];
      selection = null;
      finishingId = null;
      await refresh();
    });
  }

  async function choose(suggestion: ActivityNameSuggestion) {
    await run(async () => {
      if (finishingId) return;
      const next = {
        activityName: (suggestion.activityName ?? suggestion.text).trim(),
        initialValues: suggestion.initialValues,
      };
      if (!next.activityName) {
        error = "Activity name cannot be empty";
        return;
      }
      selection = next;
      const selected = selection;
      const fields = getActivityAttributeFields(next.activityName, "start");
      if (fields.some((field) => field.resourceTag)) {
        // Resource options can arrive after the form opens; keep inputs usable.
        void loadResources().catch((caught) => {
          if (selection === selected)
            error =
              caught instanceof Error
                ? caught.message
                : "Unable to load activity suggestions";
        });
      }
      if (!fields.length) await start({});
    });
  }

  async function start(values: ActivityValues) {
    if (!selection) return;
    const startedAt = Date.now();
    const record = createActivityRecord(
      selection.activityName,
      values,
      startedAt,
    );
    const permission =
      await ActivityNotifications.requestNotificationPermission();
    if (!permission.granted)
      notice =
        "Notifications are disabled. Tracking will still start in the app.";
    const entry = await repository.addActivity(record);
    await ActivityNotifications.selectActivity({
      id: entry.id,
      label: getActivityDisplayLabel(record.activity, record),
      startedAt,
    });
    selection = null;
    query = "";
    highlighted = 0;
    await refresh();
  }

  async function requestFinish() {
    await run(async () => {
      await refresh();
      if (!activity.active) return;
      selection = null;
      finishingId = activity.id;
      finishingLogStart = getOpenActivityLog(activity.record)!.start;
    });
  }

  async function finish(values: ActivityValues) {
    await run(async () => {
      const current = await ActivityNotifications.getActiveActivity();
      if (!current.active || current.id !== finishingId)
        throw new Error("The active activity changed. Reopen the finish form.");
      // Apply to the latest vault record, including external edits and inline notes.
      await repository.finishActivity(
        current.id!,
        values,
        finishingLogStart ?? undefined,
      );
      await ActivityNotifications.cancelFinish({
        id: current.id!,
        logStart: finishingLogStart ?? undefined,
      });
      finishingId = null;
      await refresh();
    });
  }

  function cancelForm() {
    if (finishingId) {
      void run(async () => {
        await ActivityNotifications.cancelFinish({
          id: finishingId!,
          logStart: finishingLogStart ?? undefined,
        });
        finishingId = null;
        await refresh();
      });
    } else selection = null;
  }

  async function selectOpen(entry: ActivityEntry) {
    await run(async () => {
      const log = getOpenActivityLog(entry.record)!;
      await ActivityNotifications.selectActivity({
        id: entry.id,
        label: getActivityDisplayLabel(entry.record.activity, entry.record),
        startedAt: parseActivityTimestamp(log.start).valueOf(),
      });
      await refresh();
    });
  }

  async function run(operation: () => Promise<void>) {
    if (busy) return;
    busy = true;
    error = "";
    try {
      await operation();
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "Something went wrong";
    } finally {
      busy = false;
      if (refreshRequested) {
        refreshRequested = false;
        void run(refresh);
      }
    }
  }

  function requestRefresh() {
    if (busy) refreshRequested = true;
    else void run(refresh);
  }

  function pickerKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      highlighted = Math.max(
        0,
        Math.min(
          suggestions.length - 1,
          highlighted + (event.key === "ArrowDown" ? 1 : -1),
        ),
      );
      document
        .getElementById(`suggestion-${highlighted}`)
        ?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      event.preventDefault();
      const suggestion = suggestions[highlighted];
      if (suggestion) void choose(suggestion);
    }
  }

  function formatElapsed(milliseconds: number) {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    return [
      Math.floor(seconds / 3600),
      Math.floor((seconds % 3600) / 60),
      seconds % 60,
    ]
      .map((part) => String(part).padStart(2, "0"))
      .join(":");
  }
</script>

<svelte:head>
  <title>Day Planner</title>
  <meta
    name="description"
    content="Track activities using your Obsidian Day Planner activity definitions."
  />
</svelte:head>

<main>
  <header>
    <div class="mark" aria-hidden="true">DP</div>
    <div>
      <p class="eyebrow">DAY PLANNER</p>
      <h1>Activity tracker</h1>
    </div>
  </header>

  <section class="notes-card">
    <p class="eyebrow">OBSIDIAN VAULT</p>
    <p>
      {connection.connected
        ? connection.name
        : "Choose the same vault folder used by Obsidian."}
    </p>
    <button
      class="secondary"
      onclick={chooseVault}
      disabled={busy || !!selection || !!finishingId}
    >
      {connection.connected ? "Change vault" : "Choose vault folder"}
    </button>
    {#if connection.connected}
      <button class="secondary" onclick={() => run(refresh)} disabled={busy}
        >Refresh</button
      >
    {/if}
  </section>

  {#if !connection.connected}
    <section class="empty-card">
      <p>
        Select the vault root containing your notes and _Planner folder to start
        tracking.
      </p>
    </section>
  {:else if finishingId && activity.active}
    {#key `${finishingId}:${finishingLogStart}`}
      <ActivityFields
        title={`Finish ${getActivityDisplayLabel(activity.record.activity, activity.record)}`}
        fields={getActivityFinishFields(activity.record.activity)}
        {busy}
        onSave={finish}
        onCancel={cancelForm}
      />
    {/key}
  {:else if selection}
    {#key selection}
      <ActivityFields
        title={`Start ${getActivityLabel(selection.activityName)}`}
        fields={startFields}
        initialValues={selection.initialValues}
        options={fieldOptions}
        optionsLoading={resourcesLoading &&
          startFields.some((field) => field.resourceTag)}
        {busy}
        onSave={(values) => run(() => start(values))}
        onCancel={cancelForm}
      />
    {/key}
  {:else}
    {#if activity.active}
      <section class="active-card" aria-live="polite">
        <div class="status"><span></span> Tracking now</div>
        <h2>
          {getActivityDisplayLabel(activity.record.activity, activity.record)}
        </h2>
        <div class="timer">{elapsed}</div>
        <p class="started">
          Started at {new Date(activity.startedAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
        <button class="danger" onclick={requestFinish} disabled={busy}
          >End activity</button
        >
      </section>
      <section class="notification-hint">
        <p>
          Use <strong>End</strong> in the notification to open the finish form,
          or <strong>Add note</strong> to record a note.
        </p>
      </section>
      {#if activity.record.notes}
        <section class="notes-card">
          <p class="eyebrow">NOTES</p>
          <p class="note-text">{activity.record.notes}</p>
        </section>
      {/if}
    {/if}

    {#if openEntries.some((entry) => !activity.active || entry.id !== activity.id)}
      <section class="notes-card">
        <p class="eyebrow">OPEN ACTIVITIES</p>
        {#each openEntries.filter((entry) => !activity.active || entry.id !== activity.id) as entry, index (`${entry.id}:${index}`)}
          <button
            class="suggestion"
            onclick={() => selectOpen(entry)}
            disabled={busy}
            >{getActivityDisplayLabel(
              entry.record.activity,
              entry.record,
            )}</button
          >
        {/each}
      </section>
    {/if}

    <section class="empty-card picker">
      <h2>Start activity</h2>
      <label for="activity-search">Activity</label>
      <input
        id="activity-search"
        bind:value={query}
        oninput={() => (highlighted = 0)}
        onkeydown={pickerKey}
        autocomplete="off"
        placeholder="Search or create an activity"
        disabled={busy}
      />
      <div class="suggestions" aria-label="Activity suggestions">
        {#each suggestions as suggestion, index}
          <button
            id={`suggestion-${index}`}
            class="suggestion"
            class:highlighted={index === highlighted}
            onclick={() => choose(suggestion)}
            disabled={busy}
          >
            {suggestion.displayText ?? `Start activity "${suggestion.text}"`}
          </button>
        {/each}
      </div>
    </section>

    <section class="notes-card">
      <p class="eyebrow">ACTIVITY HISTORY</p>
      <p>{entries.length} activities in this vault.</p>
    </section>
  {/if}

  {#if error}<p class="error" role="alert">{error}</p>{/if}
  {#if notice}<p class="notice" role="status">{notice}</p>{/if}
  <footer>
    <span class="dot"></span>Activities are saved directly to your Obsidian
    vault
  </footer>
</main>
