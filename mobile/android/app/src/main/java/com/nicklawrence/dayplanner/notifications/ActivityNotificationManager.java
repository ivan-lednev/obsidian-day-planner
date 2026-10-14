package com.nicklawrence.dayplanner.notifications;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.RemoteInput;

import com.nicklawrence.dayplanner.MainActivity;
import com.nicklawrence.dayplanner.R;

final class ActivityNotificationManager {
    static final String ACTION_END = "com.nicklawrence.dayplanner.action.END_ACTIVITY";
    static final String ACTION_ADD_NOTE = "com.nicklawrence.dayplanner.action.ADD_NOTE";
    static final String KEY_NOTE = "activity_note";

    private static final String LEGACY_CHANNEL_ID = "active_activity";
    private static final String CHANNEL_ID = "active_activity_lock_screen";
    private static final int NOTIFICATION_ID = 1001;

    private ActivityNotificationManager() {}

    static void show(Context context, ActiveActivityStore activity, String confirmation) {
        String channelId = createChannel(context);

        Intent openIntent = new Intent(context, MainActivity.class)
            .setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPendingIntent = PendingIntent.getActivity(
            context,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent endIntent = new Intent(context, MainActivity.class).setAction(ACTION_END)
            .putExtra("activity_id", activity.id())
            .putExtra("vault_uri", activity.connectionId())
            .setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent endPendingIntent = PendingIntent.getActivity(
            context,
            1,
            endIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        RemoteInput noteInput = new RemoteInput.Builder(KEY_NOTE)
            .setLabel("Add a note")
            .build();
        Intent noteIntent = new Intent(context, ActivityActionReceiver.class).setAction(ACTION_ADD_NOTE)
            .putExtra("activity_id", activity.id()).putExtra("vault_uri", activity.connectionId());
        PendingIntent notePendingIntent = PendingIntent.getBroadcast(
            context,
            2,
            noteIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );
        NotificationCompat.Action noteAction = new NotificationCompat.Action.Builder(
            R.drawable.ic_stat_activity,
            "Add note",
            notePendingIntent
        ).addRemoteInput(noteInput).build();

        String content = confirmation != null
            ? confirmation
            : "Activity in progress";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_stat_activity)
            .setContentTitle(activity.label())
            .setContentText(content)
            .setContentIntent(openPendingIntent)
            .setWhen(activity.startedAt())
            .setUsesChronometer(true)
            .setShowWhen(true)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setSound(null)
            .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
            .addAction(R.drawable.ic_stat_activity, "End", endPendingIntent)
            .addAction(noteAction);

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        manager.notify(NOTIFICATION_ID, builder.build());
    }

    static void cancel(Context context) {
        context.getSystemService(NotificationManager.class).cancel(NOTIFICATION_ID);
    }

    private static String createChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return CHANNEL_ID;

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return CHANNEL_ID;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Current activity",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        NotificationChannel legacy = manager.getNotificationChannel(LEGACY_CHANNEL_ID);
        // Channel importance cannot be raised after registration. Migrate the old
        // default, but keep any explicit user choice (including blocking or hiding it).
        if (legacy != null && (legacy.getImportance() != NotificationManager.IMPORTANCE_LOW
            || legacy.getLockscreenVisibility() != channel.getLockscreenVisibility()
            || legacy.shouldVibrate() || legacy.shouldShowLights()
            || (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && legacy.hasUserSetImportance())
            || (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && legacy.hasUserSetSound())))
            return LEGACY_CHANNEL_ID;

        channel.setDescription("Shows the activity currently being tracked");
        // Normal importance keeps the timer eligible for the lock screen even
        // when Android hides low-priority notifications. Tracking stays quiet.
        channel.setSound(null, null);
        channel.enableVibration(false);
        manager.createNotificationChannel(channel);
        return CHANNEL_ID;
    }
}
