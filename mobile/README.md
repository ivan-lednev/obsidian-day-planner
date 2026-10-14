# Day Planner mobile

Android-first companion app for Obsidian Day Planner. The web UI is built with
Svelte and TypeScript and runs inside Capacitor. Platform features that must work
while the web view is stopped are implemented in the native Android project.

## Shared activity workflow

The companion and plugin use the same platform-independent TypeScript API in
[`../src/shared/activity.ts`](../src/shared/activity.ts). Definitions, schemas,
start/end mutations, prompts, form state/validation, history suggestions, resource
rules, timestamp handling, weekly paths/payloads, and the file repository are shared. The platform
adapters supply UI, YAML codecs, vault/file access, and notifications.
See [the shared API notes](../src/shared/README.md) for the boundary and tests.

- The start picker includes the complete catalogue, typed custom activities, and
  the same recent main-field suggestions, ordering, per-activity limits, and
  history exclusions. Reading suggestions prefill the next page.
- Starting asks for the selected activity's required/optional fields and number
  limits. Activities without start fields begin immediately. The generic Details
  field has been removed.
- Ending asks for the activity's end fields, optional **Quality (1-10)**, and
  optional **Notes**. Saving closes the activity's sole open log, preserves start attributes
  and optional YAML metadata, and appends finish notes to existing notes. Cancelling leaves
  tracking active, with confirmation before edited form values are discarded.
- Multiple open activities are retained. Select one under **Open activities** to
  display its timer and notification. Starting another leaves earlier clocks open.
- Activities and history are read from and written to the same vault files as the
  plugin. There is no app-specific activity database. History feeds subsequent
  start suggestions directly from the vault.
- The notification's **End** action opens the finish form, including after the app
  was closed. **Add note** uses inline reply without a running web view.
- The current activity label, elapsed timer, and actions are available on the lock
  screen. The default notification channel uses normal importance with no sound
  or vibration. Existing customized channel settings are retained; Android's
  notification permission and lock-screen settings still apply. **End** opens the
  app and may require unlocking, and Android can require unlocking for inline replies.

## Home-screen daily timeline

After installing the APK, open Day Planner once and connect the vault. On the
Android home screen, long-press an empty area, choose **Widgets**, and add
**Day Planner — Daily timeline**. Resize it horizontally or vertically.

Swipe up and down inside the timeline to see the full local day. Blank hours
remain visible, and activities occupy their actual time ranges. Overlapping logs
share columns; overnight logs are clipped to the displayed day. Repeated logs
and duplicate task IDs remain separate. **Now** refreshes and scrolls to the
current hour; **↻** refreshes without changing the scroll position. Tapping the
heading or an hour opens the app.
While loading, the refresh button becomes a spinner and the heading shows
**Refreshing…**. Both refresh controls are unavailable until the load finishes.
The spinner clears on success or failure; a failed load shows a retry message in
the heading as well as the timeline's status row.

The widget runs the shared TypeScript YAML parser, validation, labels, colors,
duration/quality formatting, and overlap layout in a short-lived offline WebView.
Native Android code draws hour rows for the launcher's scrolling collection.
It works with the app closed and reads the weekly vault files directly; there is
no widget activity database. The widget follows the device's light/dark theme,
using the plugin's default activity colors. Custom Obsidian themes, timeline zoom,
and plugin color overrides are not synchronized in this first version.

Starts, finishes, notification notes, and opening/refreshing the app trigger an
update. The launcher also schedules periodic refreshes, normally every 30 minutes;
Android can delay background delivery. The status row shows the last successful
refresh time, including for ongoing activity lengths and the current-time marker.
Tap **↻** after external vault sync for an immediate refresh.

All weekly activity files are scanned so a later log retained in an earlier week
is included. An incomplete sync write preserves the last good in-memory widget
view and shows a retry message. A new process reloads from the vault.

The widget engine is built automatically by `npm run android:sync`. The shared
rendering entry is [`../src/shared/activity-timeline.ts`](../src/shared/activity-timeline.ts).
The Android instrumentation tests exercise the bundled JavaScript in a real
WebView and apply the bitmap row through `RemoteViews`.

## Home-screen active clocks

Add **Day Planner — Active clocks** from Android's widget picker. The cards use
the plugin's default activity colors and shared labels, notes, quality, and start
times. Open clocks from all weekly files appear side by side. Resize horizontally
to fit more cards; the arrow controls page through any additional clocks in a
single horizontal row. Paging uses the current in-memory snapshot without another
vault scan. Elapsed timers tick in the launcher even while the app is closed.

Each card has an image-only clock-out button on its right. Tapping it opens the
app's shared finish form for that exact activity, including its end fields,
quality, and notes. Each activity has at most one open clock and can retain many
completed sessions. Several independent activities can run simultaneously.
Saving reads the latest YAML and closes the sole open log that
was tapped; cancelling leaves it open. A changed, ambiguous, already finished, or
different-vault reference cannot close another activity. Requests also survive a
cold app launch and arriving during an existing refresh.

Starts, finishes, inline notes, and app refreshes update both widgets. The active
clocks widget also has manual refresh with a spinner and the launcher's periodic
refresh. A failed read keeps the last good view with a retry message. Its data
comes from the same vault snapshot reader and offline TypeScript bundle as the
timeline widget; only the pending finish reference and launcher UI state are
remembered, never a separate activity database.

## Connect the vault

Choose **Choose vault folder** and select the Obsidian vault root containing your
notes and `_Planner` folder. Android uses the system folder picker and retains its
read/write permission across app restarts. The browser uses a writable directory
picker when supported; reconnect the folder after reloading the browser.

Both apps use `_Planner/activities/<ISO year>/<ISO year>-W<week>.yaml`, for example
`_Planner/activities/2026/2026-W41.yaml`. Start, finish, and inline notification
notes update those files directly. Manual import/export has been removed. The app
only remembers the folder connection and selected notification reference, label,
time, and pending finish request. Records and resource metadata are never cached
in preferences or local storage. Prototype preferences are left untouched as an
inactive backup; they are not automatically merged into the vault.

All activity weeks are read to populate history. Resource notes are read from the
vault when choosing a start activity, using the shared resource filters. This
includes frontmatter tags/status and plain inline tags, but the companion does not
have Obsidian's live Markdown metadata parser.

Writes read the latest file and reject a changed file instead of replacing it with
a stale snapshot. On an error, form values remain available for retry. Android
serializes its own foreground writes and background replies; document providers
cannot guarantee an atomic compare-and-write against another process. Moving an
activity to a different week also requires multiple file writes.

This connects an existing vault folder. It does not implement Obsidian Sync or any
other cloud backend. On different devices, use your existing vault synchronization
so both apps see the same files; provider synchronization and conflict resolution
remain the provider's responsibility. **Refresh**, selecting an activity, or
returning to the app reloads activity data from the vault.

## Prerequisites

- Node.js 22 or newer.
- Android Studio 2025.2.1 or newer.
- An Android SDK with Android SDK Platform 36 and the Android SDK Platform
  Tools installed. Android Studio's SDK Manager can install both.
- Either an Android Virtual Device (AVD) or an Android phone with developer
  options enabled.

Use JDK 21 or 22 for this project's Gradle build. The Android build was verified
with the installed Corretto 22 JDK. If Android Studio bundles a newer JDK, set its
Gradle JDK to a compatible installation and set `JAVA_HOME` for command-line builds.

## Install and verify

Run these commands from the repository root:

```bash
cd mobile
npm ci
npm run check
npm run android:sync
```

`android:sync` builds the Svelte application, copies it into the native Android
project, and synchronizes the Capacitor dependencies. Run it after changing web
code and before building through Android Studio.

## Test on an emulator

1. Open Android Studio's **Device Manager** from the welcome screen, or use
   **View > Tool Windows > Device Manager** after opening a project.
2. Select **Create Virtual Device**, choose a recent Pixel profile, and install
   an Android 16 / API 36 system image. Android 13 or newer is recommended so
   the notification permission flow is exercised.
3. Start the virtual device.
4. From `mobile/`, run:

   ```bash
   npm run android:run
   ```

   Capacitor displays a target selector when more than one emulator or device
   is available. `npm run android:list` prints the available targets.

Alternatively, run `npm run android:open`, select the emulator in Android
Studio's target menu, and press **Run**. Android Studio is the easiest option
when stepping through the native notification receiver or inspecting Logcat.

## Test on a phone

### USB

1. On the phone, open **Settings > About phone** and tap **Build number** seven
   times to enable developer options.
2. Enable **USB debugging** under **Developer options**.
3. Connect the phone with a data-capable USB cable and accept its RSA debugging
   prompt.
4. Confirm that the device is visible:

   ```bash
   adb devices
   npm run android:list
   ```

5. Run `npm run android:run` and choose the phone, or select it in Android
   Studio and press **Run**.

### Wireless debugging

On Android 11 or newer, enable **Wireless debugging** in developer options and
use **Pair Devices Using Wi-Fi** from Android Studio's device menu. After the
phone appears in `npm run android:list`, deploy with `npm run android:run` in the
same way as a USB-connected device.

### Install a debug APK manually

After `npm run android:sync`, build **Build > Build APK(s)** in Android Studio,
or run the Gradle wrapper from `mobile/android`:

```bash
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

On Windows, use `gradlew.bat assembleDebug`. The APK is development-signed and
is intended only for local testing.

## Activity and notification test checklist

1. Choose the same vault root used by Obsidian. Compare the catalogue, recent
   suggestions, reading page defaults, and resource field options with the plugin.
2. Start Read: Book and Start page must be required. Start Deep Work: Project is
   requested. Start Walk: tracking begins immediately.
3. Grant notification permission. Verify the label and chronometer, then tap the
   notification to return to the app.
4. Add two notes through inline reply. Verify that both appear, including when the
   app was removed from recent apps before adding the second note.
5. Tap End in the notification. Verify End page for Read, and Quality (1-10) and
   Notes for every activity. Missing required fields and ratings outside 1-10 must
   block saving.
6. Edit a finish value and cancel. Verify the discard confirmation and that
   tracking continues. Reopen the form and save valid values.
7. Verify that the notification disappears and history remains. The next reading
   suggestion should start after the completed end page. Verify the change in
   the existing weekly file and the plugin without importing or exporting.
8. Start two activities, finish the earlier one through Open activities, and verify
   that the other remains open.
9. Rotate or close/reopen the app while tracking. Verify that the record, timer,
   attributes, and notes survive.
10. Edit a weekly file in Obsidian, then refresh the companion and finish an
    activity. Verify that Obsidian notes and other activities remain.
11. Deny notification permission on a clean install. Tracking and history should
    still work, with an explanation that notifications are disabled.

## Troubleshooting

- If Gradle reports `Unsupported class file major version 69`, it is running with
  Java 25. Use JDK 21 or 22 instead. The bundled Android Studio runtime is not
  compatible with this project's Gradle wrapper in that configuration.
- If no targets appear, run `adb devices`. A phone shown as `unauthorized` must
  accept the debugging prompt. In Android Studio, **Tools > Troubleshoot Device
  Connections** can restart ADB and diagnose USB connections.
- If Gradle reports `SDK location not found`, install the SDK through Android
  Studio and open `mobile/android` once, or set `ANDROID_HOME` to the SDK path.
- If the app contains an older Svelte bundle, rerun `npm run android:sync` before
  pressing **Run** in Android Studio.
- If the notification is missing, check **Settings > Apps > Day Planner >
  Notifications** and ensure **Current activity** is enabled.
- For native diagnostics, filter Android Studio Logcat by the package
  `com.nicklawrence.dayplanner`, or run:

  ```bash
  adb logcat | grep com.nicklawrence.dayplanner
  ```

The generated project targets Android only, while the TypeScript bridge keeps
the platform boundary small enough to add an iOS implementation later.

## Native bridge

`ActivityNotifications` supplies vault access and notification state:

- `getConnection()` and `chooseVault()`
- `listFiles({ folder?, extension? })`, `readFile({ path })`, `writeFile({ path, contents, expected })`
- `requestNotificationPermission()`
- `getActiveActivity()` returns the selected reference and pending finish flag
- `selectActivity({ id, label, startedAt })`, `clearSelection()`, `cancelFinish()`
- The `finishRequested` event and a durable flag for cold launches.

The shared TypeScript `ActivityRepository` performs activity reads, validation,
start/end updates, and weekly placement for both apps. `VaultFiles` is the Android
file adapter. Notification replies run the bundled shared TypeScript in a
short-lived offline WebView, using `prepareActivityCommand` and the same repository
to produce expected-content file writes. Android applies those writes through
the vault adapter. There is no native YAML parser, native activity mutation
implementation, or separate native history store.

The shared schema rejects more than one open log in an activity, on both read and
write. The same clock helpers handle selection, completion, cancellation, and
stale start references in both clients. Invalid records are reported without
silently closing a clock or changing the vault file.

Start forms open from the loaded activity history. Resource choices load in the
background without disabling the form. History scans visit only
`_Planner/activities`; saving still reads and checks the latest weekly YAML.

Run the mobile UI and storage regression tests from the repository root with
`npm run test -- --config mobile/vitest.config.ts` after installing both projects'
dependencies.
