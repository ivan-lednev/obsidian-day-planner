package com.nicklawrence.dayplanner.notifications;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.IOException;

/** Notification pointer only. The selected activity is always read from the vault. */
final class ActiveActivityStore {
    private final SharedPreferences preferences;
    private final VaultFiles files;
    private final Context context;

    ActiveActivityStore(Context context) {
        this.context = context;
        preferences = context.getSharedPreferences("activity_selection", Context.MODE_PRIVATE);
        files = new VaultFiles(context);
    }

    void select(String id, String label, long startedAt) throws IOException {
        synchronized (VaultFiles.LOCK) {
        // The shared TypeScript workflow resolves and validates the vault record.
        // Native preferences retain only its notification pointer and presentation.
        if (!files.connected() || id == null || id.isEmpty()) throw new IOException("Choose an open activity first");
        boolean changed = !id.equals(id());
        SharedPreferences.Editor editor = preferences.edit().putString("id", id).putString("label", label)
            .putLong("started_at", startedAt);
        if (changed) editor.putBoolean("finish_requested", false);
        editor.commit();
        }
    }

    void clear() { synchronized (VaultFiles.LOCK) { preferences.edit().clear().commit(); } }
    void clearSelection() {
        synchronized (VaultFiles.LOCK) {
            preferences.edit().remove("id").remove("label").remove("started_at")
                .putBoolean("finish_requested", false).commit();
        }
    }
    void cancelFinish(String expectedId) {
        cancelFinish(expectedId, null);
    }
    void cancelFinish(String expectedId, String expectedStart) {
        synchronized (VaultFiles.LOCK) {
            String requested = preferences.getString("finish_id", "");
            if (requested.isEmpty() && preferences.getBoolean("finish_requested", false)) requested = id();
            if (expectedId != null && !expectedId.equals(requested)) return;
            String requestedStart = preferences.getString("finish_start", "");
            if (expectedId != null && !requestedStart.isEmpty() && !requestedStart.equals(expectedStart)) return;
            requestFinish(false);
        }
    }
    void requestFinish(boolean requested) {
        preferences.edit().putBoolean("finish_requested", requested)
            .remove("finish_id").remove("finish_connection").remove("finish_start").commit();
    }
    void requestFinishFor(String id, String connection) {
        requestFinishFor(id, connection, null);
    }
    void requestFinishFor(String id, String connection, String logStart) {
        synchronized (VaultFiles.LOCK) {
            if (!files.connected() || connection == null || !connection.equals(files.connectionId())) return;
            if (id == null || id.isEmpty()) throw new IllegalArgumentException("Missing activity reference");
            // Only a request pointer. The app re-reads and validates the actual vault
            // record before selecting it or opening the shared finish form.
            preferences.edit().putString("finish_id", id).putString("finish_connection", connection)
                .putString("finish_start", logStart).putBoolean("finish_requested", false).commit();
        }
    }
    boolean isActive() { return files.connected() && !id().isEmpty(); }
    String id() { return preferences.getString("id", ""); }
    String connectionId() { return files.connectionId(); }
    String label() { return preferences.getString("label", "Activity"); }
    long startedAt() { return preferences.getLong("started_at", System.currentTimeMillis()); }

    void appendNote(String note) throws Exception {
        String selectedId = id(), connection = connectionId();
        // Never hold the file lock while awaiting WebView work on the main thread.
        NativeActivityCommands command = NativeActivityCommands.prepareNote(context, selectedId, connection, note);
        synchronized (VaultFiles.LOCK) {
            if (!selectedId.equals(id()) || !connection.equals(connectionId()))
                throw new IOException("The selected activity changed during reply");
            String nextId = command.apply(files);
            SharedPreferences.Editor editor = preferences.edit().putString("id", nextId);
            if (selectedId.equals(preferences.getString("finish_id", ""))) editor.putString("finish_id", nextId);
            editor.commit();
        }
    }

    JSONObject toJson() throws JSONException {
        JSONObject result = new JSONObject().put("active", isActive());
        String requested = preferences.getString("finish_id", "");
        if (!requested.isEmpty() && files.connected()
            && files.connectionId().equals(preferences.getString("finish_connection", "")))
            result.put("finishId", requested).put("finishLogStart", preferences.getString("finish_start", null));
        if (!isActive()) return result;
        return result.put("id", id()).put("finishRequested", preferences.getBoolean("finish_requested", false));
    }
}
