package com.nicklawrence.dayplanner.notifications;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import com.nicklawrence.dayplanner.MainActivity;
import com.nicklawrence.dayplanner.R;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.HashMap;
import java.util.Map;

/** A launcher collection widget: each row is one continuous hour of the timeline. */
public class ActivityTimelineWidget extends AppWidgetProvider {
    static final String REFRESH = "com.nicklawrence.dayplanner.WIDGET_REFRESH";
    static final String NOW = "com.nicklawrence.dayplanner.WIDGET_NOW";
    static final String WIDTH = "timeline_width";
    static final String DARK = "timeline_dark";
    private static final Map<Integer, Long> refreshes = new HashMap<>();
    private static long refreshSequence;

    static void applyRefreshState(Context context, RemoteViews views, boolean refreshing, String error) {
        views.setViewVisibility(R.id.widget_refresh, refreshing ? View.INVISIBLE : View.VISIBLE);
        views.setViewVisibility(R.id.widget_refresh_progress, refreshing ? View.VISIBLE : View.GONE);
        views.setBoolean(R.id.widget_now, "setEnabled", !refreshing);
        views.setContentDescription(R.id.widget_refresh_progress, context.getString(R.string.widget_refreshing));
        views.setTextViewText(R.id.widget_date, refreshing ? context.getString(R.string.widget_refreshing)
            : error != null ? error : new SimpleDateFormat("EEE, d MMM", Locale.getDefault()).format(new Date()));
    }

    static synchronized long beginRefresh(Context context, int id) {
        long token = ++refreshSequence;
        refreshes.put(id, token);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.activity_timeline_widget);
        applyRefreshState(context, views, true, null);
        AppWidgetManager.getInstance(context).partiallyUpdateAppWidget(id, views);
        return token;
    }

    static synchronized void finishRefresh(Context context, int id, long token, String error) {
        // A superseded load must not hide the spinner for a newer request or resize.
        if (!Long.valueOf(token).equals(refreshes.get(id))) return;
        refreshes.remove(id);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.activity_timeline_widget);
        applyRefreshState(context, views, false, error);
        AppWidgetManager.getInstance(context).partiallyUpdateAppWidget(id, views);
    }

    @Override public void onDeleted(Context context, int[] ids) {
        synchronized (ActivityTimelineWidget.class) {
            for (int id : ids) refreshes.remove(id);
        }
    }

    public static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        for (int id : manager.getAppWidgetIds(new ComponentName(context, ActivityTimelineWidget.class)))
            update(context, manager, id, false);
    }

    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) update(context, manager, id, false);
    }

    @Override public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) {
        update(context, manager, id, false);
    }

    @Override public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (!REFRESH.equals(intent.getAction()) && !NOW.equals(intent.getAction())) return;
        int id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        // Only act on widgets belonging to this provider, including stale pending intents.
        for (int owned : manager.getAppWidgetIds(new ComponentName(context, ActivityTimelineWidget.class)))
            if (owned == id) update(context, manager, id, NOW.equals(intent.getAction()));
    }

    private static void update(Context context, AppWidgetManager manager, int id, boolean jumpToNow) {
        Bundle options = manager.getAppWidgetOptions(id);
        boolean dark = (context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
            == Configuration.UI_MODE_NIGHT_YES;
        boolean landscape = context.getResources().getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE;
        int width = Math.max(140, options.getInt(landscape ? AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH
            : AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 300) - 24);
        Intent adapter = new Intent(context, ActivityTimelineService.class)
            .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id).putExtra(WIDTH, width).putExtra(DARK, dark);
        adapter.setData(Uri.parse("dayplanner://timeline/" + id + "/" + width + "/" + dark));
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.activity_timeline_widget);
        applyRefreshState(context, views, true, null);
        views.setRemoteAdapter(R.id.widget_hours, adapter);
        views.setEmptyView(R.id.widget_hours, R.id.widget_empty);
        views.setOnClickPendingIntent(R.id.widget_refresh, action(context, id, REFRESH));
        views.setOnClickPendingIntent(R.id.widget_now, action(context, id, NOW));
        Intent open = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        views.setOnClickPendingIntent(R.id.widget_heading, PendingIntent.getActivity(context, id, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        views.setPendingIntentTemplate(R.id.widget_hours, PendingIntent.getActivity(context, ~id, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE));
        if (jumpToNow) {
            Calendar midnight = Calendar.getInstance();
            midnight.set(Calendar.HOUR_OF_DAY, 0); midnight.set(Calendar.MINUTE, 0);
            midnight.set(Calendar.SECOND, 0); midnight.set(Calendar.MILLISECOND, 0);
            int hour = (int) ((System.currentTimeMillis() - midnight.getTimeInMillis()) / 3_600_000L);
            views.setScrollPosition(R.id.widget_hours, hour + 1); // First row contains update status.
        }
        synchronized (ActivityTimelineWidget.class) {
            refreshes.put(id, ++refreshSequence);
            manager.updateAppWidget(id, views);
        }
        manager.notifyAppWidgetViewDataChanged(id, R.id.widget_hours);
    }

    private static PendingIntent action(Context context, int id, String action) {
        Intent intent = new Intent(context, ActivityTimelineWidget.class).setAction(action)
            .setData(Uri.parse("dayplanner://timeline-action/" + id + "/" + action))
            .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        return PendingIntent.getBroadcast(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
