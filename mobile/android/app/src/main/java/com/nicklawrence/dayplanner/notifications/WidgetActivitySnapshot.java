package com.nicklawrence.dayplanner.notifications;

import android.content.Context;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import org.json.JSONArray;

/** Shared vault input for both widgets; snapshots only live in memory. */
final class WidgetActivitySnapshot {
    final String connection;
    final JSONArray files;

    private WidgetActivitySnapshot(String connection, JSONArray files) {
        this.connection = connection;
        this.files = files;
    }

    static WidgetActivitySnapshot read(Context context) throws Exception {
        VaultFiles vault = new VaultFiles(context);
        if (!vault.connected()) throw new IOException("Open Day Planner and choose your vault folder.");
        String connection = vault.connectionId();
        JSONArray files = new JSONArray();
        List<String> paths = vault.listFiles("_Planner/activities", ".yaml");
        Collections.sort(paths);
        for (String path : paths) {
            String contents = vault.readFile(path);
            if (contents != null) files.put(new JSONArray().put(path).put(contents));
        }
        WidgetActivitySnapshot snapshot = new WidgetActivitySnapshot(connection, files);
        snapshot.assertCurrent(context);
        return snapshot;
    }

    void assertCurrent(Context context) throws IOException {
        if (!connection.equals(new VaultFiles(context).connectionId()))
            throw new IOException("Vault changed during refresh");
    }
}
