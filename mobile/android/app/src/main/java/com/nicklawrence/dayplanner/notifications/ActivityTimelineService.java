package com.nicklawrence.dayplanner.notifications;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.os.Binder;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import com.nicklawrence.dayplanner.R;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

public class ActivityTimelineService extends RemoteViewsService {
    private static final ExecutorService initialLoads = Executors.newSingleThreadExecutor();

    @Override public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new TimelineFactory(getApplicationContext(), intent);
    }

    private static final class TimelineFactory implements RemoteViewsFactory {
        private final Context context;
        private final int widgetId;
        private final int width;
        private final boolean dark;
        private volatile JSONObject model;
        private volatile String status = "Loading today’s activities…";
        private volatile boolean destroyed;
        private final Object loading = new Object();
        private String modelConnection;

        TimelineFactory(Context context, Intent intent) {
            this.context = context;
            widgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
            width = intent.getIntExtra(ActivityTimelineWidget.WIDTH, 276);
            dark = intent.getBooleanExtra(ActivityTimelineWidget.DARK, false);
        }

        @Override public void onCreate() {
            // onCreate can run on the UI thread; shared JavaScript needs that thread too.
            initialLoads.execute(() -> {
                reload();
                if (!destroyed) AppWidgetManager.getInstance(context).notifyAppWidgetViewDataChanged(widgetId, R.id.widget_hours);
            });
        }

        @Override public void onDataSetChanged() {
            // Use this app's persisted vault grant, not the launcher's Binder identity.
            long identity = Binder.clearCallingIdentity();
            try { reload(); }
            finally { Binder.restoreCallingIdentity(identity); }
        }

        private void reload() {
            synchronized (loading) {
                if (destroyed) return;
                long refresh = ActivityTimelineWidget.beginRefresh(context, widgetId);
                String refreshError = null;
                try {
                    VaultFiles vault = new VaultFiles(context);
                    String connection = vault.connectionId();
                    if (!connection.equals(modelConnection)) model = null;
                    WidgetActivitySnapshot snapshot = WidgetActivitySnapshot.read(context);
                    if (destroyed) return;
                    long now = System.currentTimeMillis();
                    String day = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(new Date(now));
                    JSONObject next = WidgetTimelineEngine.build(context, snapshot.files, day, now, dark);
                    if (destroyed) return;
                    snapshot.assertCurrent(context);
                    model = next;
                    modelConnection = snapshot.connection;
                    int count = next.getJSONArray("blocks").length();
                    status = (count == 0 ? "No activities recorded today" : count + " activity logs")
                        + " · Updated " + new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date(now));
                } catch (Exception error) {
                    refreshError = context.getString(R.string.widget_refresh_failed);
                    android.util.Log.e("DayPlannerWidget", "Unable to load activity timeline", error);
                    status = !new VaultFiles(context).connected() ? "Open Day Planner and choose your vault folder."
                        : (model == null ? "" : "Showing " + model.optString("title") + " from the last refresh. ")
                            + "Refresh failed. Tap ↻ to retry or open Day Planner.";
                } finally {
                    ActivityTimelineWidget.finishRefresh(context, widgetId, refresh, refreshError);
                }
            }
        }

        @Override public void onDestroy() { destroyed = true; model = null; }
        @Override public int getCount() { JSONObject current = model; return current == null ? 1 : current.optJSONArray("hours").length() + 1; }
        @Override public int getViewTypeCount() { return 2; }
        @Override public boolean hasStableIds() { return true; }
        @Override public long getItemId(int position) { return position; }
        @Override public RemoteViews getLoadingView() { return statusView(context.getString(R.string.widget_loading)); }

        private RemoteViews statusView(String text) {
            RemoteViews view = new RemoteViews(context.getPackageName(), R.layout.activity_timeline_status);
            view.setTextViewText(R.id.widget_status, text);
            view.setOnClickFillInIntent(R.id.widget_status, new Intent());
            return view;
        }

        @Override public RemoteViews getViewAt(int position) {
            JSONObject current = model;
            if (position == 0 || current == null) return statusView(status);
            try {
                int hour = position - 1;
                RemoteViews view = new RemoteViews(context.getPackageName(), R.layout.activity_timeline_hour);
                view.setImageViewBitmap(R.id.widget_hour, WidgetTimelineRenderer.render(context, current, hour, width));
                view.setContentDescription(R.id.widget_hour, WidgetTimelineRenderer.describe(current, hour));
                view.setOnClickFillInIntent(R.id.widget_hour, new Intent());
                return view;
            } catch (Exception error) { return statusView("Unable to draw this hour. Tap refresh to retry."); }
        }
    }
}
