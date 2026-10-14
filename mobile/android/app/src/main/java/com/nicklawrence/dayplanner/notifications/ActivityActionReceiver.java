package com.nicklawrence.dayplanner.notifications;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import androidx.core.app.RemoteInput;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;

/** Writes inline replies to the vault even when no Capacitor WebView is running. */
public class ActivityActionReceiver extends BroadcastReceiver {
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!ActivityNotificationManager.ACTION_ADD_NOTE.equals(intent.getAction())) return;
        Bundle results = RemoteInput.getResultsFromIntent(intent);
        CharSequence note = results == null ? null : results.getCharSequence(ActivityNotificationManager.KEY_NOTE);
        if (note == null || note.toString().trim().isEmpty()) return;
        PendingResult pending = goAsync();
        executor.execute(() -> {
            try {
                ActiveActivityStore store = new ActiveActivityStore(context);
                if (!store.isActive() || !store.id().equals(intent.getStringExtra("activity_id")) ||
                    !store.connectionId().equals(intent.getStringExtra("vault_uri"))) return;
                store.appendNote(note.toString());
                ActivityTimelineWidget.refreshAll(context);
                ActivityClocksWidget.refreshAll(context);
                ActivityNotificationManager.show(context, store, "Note added");
            } catch (Exception error) {
                android.util.Log.e("DayPlanner", "Unable to save activity note", error);
                // Show failure without silently retaining an unsaved note in private storage.
                ActivityNotificationManager.show(context, new ActiveActivityStore(context), "Note could not be saved. Open the app to check vault access.");
            } finally { pending.finish(); }
        });
    }
}
