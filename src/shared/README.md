# Shared activity API

`activity.ts` is the public, platform-independent activity API for the Obsidian
plugin and the mobile companion. Both compile this same TypeScript source;
there is no copied catalogue or separately maintained implementation.

It exports activity definitions and types, record schemas and normalization,
start/end fields and validation, form defaults/change detection, history
suggestions, resource metadata rules, timestamp handling, immutable record
mutations, weekly storage paths/payloads, activity/resource file parsing, and the vault file
repository.

The implementations remain in `../util/activity-*.ts` so existing plugin imports
stay compatible. New companion callers should import from `activity.ts`.

Weekly files contain ordered activity lists. Task IDs are optional YAML metadata:
several rows may contain the same IDs, and no task needs to exist to display,
change, load, or save an activity. Missing fields stay missing and empty arrays
are preserved. Activity blocks use `ActivityLogLocation` (file path, activity row,
log row); commands choose from open rows in those files. The activity editor
validates the selected row against the current file before applying a change.

## Adapters

An activity may retain any number of completed logs and at most one open log.
Separate activity rows may run simultaneously, including rows sharing task IDs.
The shared schema enforces this on file reads and writes; shared clock mutations
also reject an invalid multi-open record or an edit that creates a second open
log. No adapter should silently close or discard a log to repair invalid input.

`getOpenActivityLog` is the common clock resolver. `resolveActivitySelection`
interprets notification pointers against validated repository records.
`finishActivityRecord` and `ActivityRepository.finishActivity` close the sole open
log, optionally checking its expected start to reject stale widget requests.

- `util/props.ts` preserves the plugin's existing clock API and supplies its
  Obsidian-configured timestamp to the shared mutations. Its task Markdown helpers
  remain plugin-specific.
- `service/planner-data.ts` supplies Obsidian's YAML codec and a vault adapter to
  the shared `ActivityRepository`. Its UI cache is refreshed after repository writes.
  `util/activity-resources.ts` supplies live vault metadata.
- `mobile/src/lib/activity-files.ts` supplies the companion's YAML codec.
  `activity-notifications.ts` supplies vault file access, via Android folder
  permissions or the browser directory picker, to the same repository.
- The modal and Svelte form render inputs and show platform-specific confirmation
  UI, using shared form defaults, validation, and change detection.
- Capacitor/Android handle file access, notifications, inline replies, and the
  system folder picker. Preferences contain only connection and selection metadata.
  Background notification replies run the same bundled TypeScript repository in
  an offline WebView, even when the app UI is stopped. `prepareActivityCommand`
  executes against a file snapshot and returns repository writes plus the resulting
  activity reference. Native code supplies files, checks expected contents, applies
  the writes, and retains only the notification pointer. It does not parse activity
  YAML, select open log entries, or implement activity mutations.

Keep `window`, DOM, Obsidian, Capacitor, and native APIs out of the shared modules.
Storage functions accept an `ActivityYamlCodec` instead of importing a particular
platform's YAML implementation. The shared clock functions accept explicit times
for repeatable operations and tests. Weekly grouping uses the earliest log and
ISO week year consistently in both apps.

The Node-environment tests in `tests/shared-activity.test.ts` exercise this public
API without a browser or Obsidian runtime. Compatibility tests also exercise the
existing plugin adapters and the mobile adapters against the same records.

`ActivityFileStore` takes vault-relative paths and exposes list/read/write. The
write adapter creates parent folders and compares expected contents before
writing. Activity mutations always read the current file rather than a cached
history. `tests/activity-repository.test.ts` exercises the plugin adapter and
companion repository against a single file backend, including external edits,
reloads, suggestions, date moves, and stale/conflicting writes. No adapter should
create a second activity database or implement a manual snapshot transfer flow.
