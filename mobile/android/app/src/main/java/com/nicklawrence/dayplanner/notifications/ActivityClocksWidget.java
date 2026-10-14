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
import java.util.HashMap;
import java.util.Map;

/** A horizontal row of live clocks, paged when there are more than fit. */
public class ActivityClocksWidget extends AppWidgetProvider {
    static final String CLOCK_OUT = "com.nicklawrence.dayplanner.CLOCK_OUT_ACTIVITY";
    private static final String REFRESH = "com.nicklawrence.dayplanner.CLOCKS_REFRESH";
    private static final String PREVIOUS = "com.nicklawrence.dayplanner.CLOCKS_PREVIOUS";
    private static final String NEXT = "com.nicklawrence.dayplanner.CLOCKS_NEXT";
    private static final Map<Integer, Integer> pages = new HashMap<>();
    private static final Map<Integer, Long> requests = new HashMap<>();
    private static long sequence;

    static synchronized int page(int id) { return pages.getOrDefault(id, 0); }
    static synchronized long request(int id) { return requests.getOrDefault(id, 0L); }
    static int capacity(int width) { return Math.max(1, width / 140); }

    public static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        for (int id : manager.getAppWidgetIds(new ComponentName(context, ActivityClocksWidget.class)))
            update(context, manager, id, true);
    }

    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) update(context, manager, id, true);
    }

    @Override public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) {
        update(context, manager, id, true);
    }

    @Override public void onDeleted(Context context, int[] ids) {
        synchronized (ActivityClocksWidget.class) {
            for (int id : ids) { pages.remove(id); requests.remove(id); }
        }
    }

    @Override public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (!REFRESH.equals(action) && !PREVIOUS.equals(action) && !NEXT.equals(action)) return;
        int id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        for (int owned : manager.getAppWidgetIds(new ComponentName(context, ActivityClocksWidget.class))) {
            if (owned != id) continue;
            if (!REFRESH.equals(action)) {
                synchronized (ActivityClocksWidget.class) {
                    pages.put(id, Math.max(0, page(id) + (NEXT.equals(action) ? 1 : -1)));
                }
            }
            update(context, manager, id, REFRESH.equals(action));
        }
    }

    private static void update(Context context, AppWidgetManager manager, int id, boolean reload) {
        Bundle options = manager.getAppWidgetOptions(id);
        boolean landscape = context.getResources().getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE;
        int width = Math.max(140, options.getInt(landscape ? AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH
            : AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 360) - 16);
        boolean dark = (context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
            == Configuration.UI_MODE_NIGHT_YES;
        Intent adapter = new Intent(context, ActivityClocksService.class)
            .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id)
            .putExtra(ActivityTimelineWidget.WIDTH, width).putExtra(ActivityTimelineWidget.DARK, dark);
        adapter.setData(Uri.parse("dayplanner://active-clocks/" + id + "/" + width + "/" + dark));
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.activity_clocks_widget);
        views.setRemoteAdapter(R.id.clocks_grid, adapter);
        views.setInt(R.id.clocks_grid, "setNumColumns", capacity(width));
        views.setEmptyView(R.id.clocks_grid, R.id.clocks_empty);
        views.setOnClickPendingIntent(R.id.clocks_refresh, action(context, id, REFRESH));
        views.setOnClickPendingIntent(R.id.clocks_previous, action(context, id, PREVIOUS));
        views.setOnClickPendingIntent(R.id.clocks_next, action(context, id, NEXT));
        Intent open = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        views.setOnClickPendingIntent(R.id.clocks_heading, PendingIntent.getActivity(context, id, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        Intent finish = new Intent(context, MainActivity.class).setAction(CLOCK_OUT)
            .setData(Uri.parse("dayplanner://clock-out/" + id))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        views.setPendingIntentTemplate(R.id.clocks_grid, PendingIntent.getActivity(context, id, finish,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE));
        progress(context, views, reload);
        synchronized (ActivityClocksWidget.class) {
            if (reload) requests.put(id, ++sequence);
            manager.updateAppWidget(id, views);
        }
        manager.notifyAppWidgetViewDataChanged(id, R.id.clocks_grid);
    }

    private static void progress(Context context, RemoteViews views, boolean loading) {
        views.setViewVisibility(R.id.clocks_refresh, loading ? View.INVISIBLE : View.VISIBLE);
        views.setViewVisibility(R.id.clocks_progress, loading ? View.VISIBLE : View.GONE);
        if (loading) views.setTextViewText(R.id.clocks_status, context.getString(R.string.widget_refreshing));
    }

    static synchronized void publish(Context context, int id, long request, int count, int capacity,
            boolean loading, String status) {
        if (request != request(id)) return;
        int pageCount = Math.max(1, (count + capacity - 1) / capacity);
        int page = Math.min(page(id), pageCount - 1);
        pages.put(id, page);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.activity_clocks_widget);
        progress(context, views, loading);
        if (!loading) views.setTextViewText(R.id.clocks_status, status);
        views.setTextViewText(R.id.clocks_empty, status);
        views.setInt(R.id.clocks_grid, "setNumColumns", Math.max(1, Math.min(count - page * capacity, capacity)));
        views.setTextViewText(R.id.clocks_page, (page + 1) + "/" + pageCount);
        for (int view : new int[] { R.id.clocks_page, R.id.clocks_previous, R.id.clocks_next })
            views.setViewVisibility(view, pageCount > 1 ? View.VISIBLE : View.GONE);
        views.setBoolean(R.id.clocks_previous, "setEnabled", !loading && page > 0);
        views.setBoolean(R.id.clocks_next, "setEnabled", !loading && page + 1 < pageCount);
        AppWidgetManager.getInstance(context).partiallyUpdateAppWidget(id, views);
    }

    private static PendingIntent action(Context context, int id, String action) {
        Intent intent = new Intent(context, ActivityClocksWidget.class).setAction(action)
            .setData(Uri.parse("dayplanner://clocks-action/" + id + "/" + action))
            .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        return PendingIntent.getBroadcast(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
