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
import org.json.JSONArray;
import org.json.JSONObject;

public class ActivityClocksService extends RemoteViewsService {
    private static final ExecutorService initialLoads = Executors.newSingleThreadExecutor();
    @Override public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new ClockFactory(getApplicationContext(), intent);
    }

    private static final class ClockFactory implements RemoteViewsFactory {
        private final Context context;
        private final int id;
        private final int width;
        private final int capacity;
        private final boolean dark;
        private volatile JSONArray visible = new JSONArray();
        private JSONObject model;
        private String connection;
        private String status;
        private long loadedRequest = -1;
        private volatile boolean destroyed;
        private final Object loading = new Object();

        ClockFactory(Context context, Intent intent) {
            this.context = context;
            id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
            width = intent.getIntExtra(ActivityTimelineWidget.WIDTH, 344);
            capacity = ActivityClocksWidget.capacity(width);
            dark = intent.getBooleanExtra(ActivityTimelineWidget.DARK, false);
            status = context.getString(R.string.widget_loading);
        }

        @Override public void onCreate() {
            initialLoads.execute(() -> {
                update();
                if (!destroyed) AppWidgetManager.getInstance(context).notifyAppWidgetViewDataChanged(id, R.id.clocks_grid);
            });
        }
        @Override public void onDataSetChanged() {
            long identity = Binder.clearCallingIdentity();
            try { update(); } finally { Binder.restoreCallingIdentity(identity); }
        }
        private void update() {
            synchronized (loading) {
                if (destroyed) return;
                long request = ActivityClocksWidget.request(id);
                String currentConnection = new VaultFiles(context).connectionId();
                if (!currentConnection.equals(connection)) { model = null; visible = new JSONArray(); }
                // Page navigation uses the last good projection; refresh re-reads the vault.
                if (request != loadedRequest || model == null) {
                    ActivityClocksWidget.publish(context, id, request, model == null ? 0 : model.optJSONArray("clocks").length(),
                        capacity, true, status);
                    try {
                        WidgetActivitySnapshot snapshot = WidgetActivitySnapshot.read(context);
                        JSONObject next = WidgetTimelineEngine.activeClocks(context, snapshot.files, dark);
                        snapshot.assertCurrent(context);
                        if (destroyed) return;
                        model = next;
                        connection = snapshot.connection;
                        loadedRequest = request;
                        int count = next.getJSONArray("clocks").length();
                        status = count == 0 ? context.getString(R.string.clocks_none)
                            : context.getResources().getQuantityString(R.plurals.clocks_count, count, count) + " · "
                                + new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date());
                    } catch (Exception error) {
                        android.util.Log.e("DayPlannerClocks", "Unable to load active clocks", error);
                        status = !new VaultFiles(context).connected() ? context.getString(R.string.clocks_connect)
                            : context.getString(R.string.widget_refresh_failed);
                    }
                }
                if (destroyed) return;
                JSONArray clocks = model == null ? new JSONArray() : model.optJSONArray("clocks");
                ActivityClocksWidget.publish(context, id, request, clocks.length(), capacity, false, status);
                int start = ActivityClocksWidget.page(id) * capacity;
                JSONArray page = new JSONArray();
                for (int i = start; i < Math.min(start + capacity, clocks.length()); i++) page.put(clocks.optJSONObject(i));
                visible = page;
            }
        }
        @Override public void onDestroy() { destroyed = true; visible = new JSONArray(); }
        @Override public int getCount() { return visible.length(); }
        @Override public int getViewTypeCount() { return 2; }
        @Override public boolean hasStableIds() { return false; }
        @Override public long getItemId(int position) { return position; }
        @Override public RemoteViews getLoadingView() {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.activity_timeline_status);
            views.setTextViewText(R.id.widget_status, context.getString(R.string.widget_loading));
            return views;
        }
        @Override public RemoteViews getViewAt(int position) {
            JSONObject clock = visible.optJSONObject(position);
            if (clock == null) return getLoadingView();
            try { return WidgetClockRenderer.render(context, clock, connection, Math.max(1, width / Math.max(1, visible.length()) - 6)); }
            catch (Exception error) {
                android.util.Log.e("DayPlannerClocks", "Unable to draw clock", error);
                return getLoadingView();
            }
        }
    }
}
