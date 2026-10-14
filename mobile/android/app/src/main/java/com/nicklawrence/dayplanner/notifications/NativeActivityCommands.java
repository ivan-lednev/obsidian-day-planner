package com.nicklawrence.dayplanner.notifications;

import android.content.Context;
import java.io.IOException;
import java.util.Objects;
import org.json.JSONArray;
import org.json.JSONObject;

/** File transport only. Parsing, identity, mutations and write plans come from TS. */
final class NativeActivityCommands {
    private final Context context;
    private final WidgetActivitySnapshot snapshot;
    private final JSONArray writes;
    private final String activityId;

    private NativeActivityCommands(Context context, WidgetActivitySnapshot snapshot, JSONArray writes, String activityId) {
        this.context = context; this.snapshot = snapshot; this.writes = writes;
        this.activityId = activityId;
    }

    static NativeActivityCommands prepareNote(Context context, String id, String connection, String note) throws Exception {
        WidgetActivitySnapshot snapshot = WidgetActivitySnapshot.read(context);
        if (!snapshot.connection.equals(connection)) throw new IOException("Vault changed during reply");
        JSONObject command = new JSONObject().put("type", "appendNote").put("id", id).put("note", note);
        JSONObject plan = WidgetTimelineEngine.activityCommand(context, snapshot.files, command);
        snapshot.assertCurrent(context);
        return new NativeActivityCommands(context, snapshot, plan.getJSONArray("writes"), plan.getString("activityId"));
    }

    String apply(VaultFiles files) throws Exception {
        snapshot.assertCurrent(context);
        // Check every expected file before applying a plan that may move weekly rows.
        for (int i = 0; i < writes.length(); i++) {
            JSONObject write = writes.getJSONObject(i);
            String expected = write.isNull("expected") ? null : write.getString("expected");
            if (!Objects.equals(files.readFile(write.getString("path")), expected))
                throw new IOException("The activity file changed. Refresh and try again.");
        }
        for (int i = 0; i < writes.length(); i++) {
            JSONObject write = writes.getJSONObject(i);
            files.writeFile(write.getString("path"), write.getString("contents"),
                write.isNull("expected") ? null : write.getString("expected"));
        }
        return activityId;
    }
}
