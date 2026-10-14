package com.nicklawrence.dayplanner.notifications;

import static org.junit.Assert.*;
import android.content.Context;
import android.graphics.Bitmap;
import android.widget.ImageView;
import android.widget.FrameLayout;
import android.widget.RemoteViews;
import android.widget.ListView;
import android.widget.BaseAdapter;
import android.widget.TextView;
import android.view.View;
import android.view.ViewGroup;
import androidx.test.platform.app.InstrumentationRegistry;
import com.nicklawrence.dayplanner.R;
import java.util.Calendar;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

/** Runs the shared JS in a real Android WebView with no Capacitor activity open. */
public class WidgetTimelineEngineTest {
    @Test public void coldEngineParsesVaultYamlAndCreatesScrollableHourRows() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        String yaml = "activities:\n  - activity: read\n    read: {book: 'Shared book'}\n    notes: 'From Obsidian'\n"
            + "    quality: 8\n    log: [{start: '2026-10-07 09:30:00', end: '2026-10-07 11:00:00'}]\n";
        JSONArray files = new JSONArray().put(new JSONArray().put("_Planner/activities/2026/2026-W41.yaml").put(yaml));
        Calendar now = Calendar.getInstance(); now.set(2026, Calendar.OCTOBER, 7, 12, 0, 0);
        JSONObject model = WidgetTimelineEngine.build(context, files, "2026-10-07", now.getTimeInMillis(), true);
        assertEquals(24, model.getJSONArray("hours").length());
        JSONObject block = model.getJSONArray("blocks").getJSONObject(0);
        assertEquals(570, block.getInt("startMinute"));
        assertEquals(660, block.getInt("endMinute"));
        assertEquals("1h 30m", block.getString("durationLabel"));
        assertTrue(block.getString("title").contains("Read - Shared book"));
        assertTrue(WidgetTimelineRenderer.describe(model, 10).contains("From Obsidian"));
        assertFalse(WidgetTimelineRenderer.describe(model, 11).contains("Shared book"));
        Bitmap row = WidgetTimelineRenderer.render(context, model, 10, 276);
        assertTrue(row.getWidth() <= 700);
        assertTrue(row.getAllocationByteCount() < 500_000);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.activity_timeline_hour);
            views.setImageViewBitmap(R.id.widget_hour, row);
            ImageView image = (ImageView) views.apply(context, new FrameLayout(context));
            assertNotNull(image.getDrawable());
        });
    }

    @Test public void remoteViewsLayoutScrollsFromMidnightToEndOfDayAndBack() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        JSONObject model = WidgetTimelineEngine.build(context, new JSONArray(), "2026-10-07", System.currentTimeMillis(), false);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            RemoteViews widget = new RemoteViews(context.getPackageName(), R.layout.activity_timeline_widget);
            View root = widget.apply(context, new FrameLayout(context));
            ListView list = root.findViewById(R.id.widget_hours);
            list.setAdapter(new BaseAdapter() {
                @Override public int getCount() { return model.optJSONArray("hours").length(); }
                @Override public Object getItem(int position) { return position; }
                @Override public long getItemId(int position) { return position; }
                @Override public View getView(int position, View recycled, ViewGroup parent) {
                    try {
                        RemoteViews hour = new RemoteViews(context.getPackageName(), R.layout.activity_timeline_hour);
                        hour.setImageViewBitmap(R.id.widget_hour, WidgetTimelineRenderer.render(context, model, position, 276));
                        return hour.apply(context, parent);
                    } catch (Exception error) { throw new RuntimeException(error); }
                }
            });
            int width = View.MeasureSpec.makeMeasureSpec(600, View.MeasureSpec.EXACTLY);
            int height = View.MeasureSpec.makeMeasureSpec(400, View.MeasureSpec.EXACTLY);
            list.measure(width, height); list.layout(0, 0, 600, 400);
            assertEquals(0, list.getFirstVisiblePosition());
            list.setSelection(23); list.forceLayout(); list.measure(width, height); list.layout(0, 0, 600, 400);
            assertEquals(23, list.getLastVisiblePosition());
            RemoteViews progress = new RemoteViews(context.getPackageName(), R.layout.activity_timeline_widget);
            ActivityTimelineWidget.applyRefreshState(context, progress, true, null);
            progress.reapply(context, root);
            assertSame(list, root.findViewById(R.id.widget_hours));
            assertEquals(23, list.getLastVisiblePosition());
            assertEquals(View.VISIBLE, root.findViewById(R.id.widget_refresh_progress).getVisibility());
            assertFalse(root.findViewById(R.id.widget_now).isEnabled());
            ActivityTimelineWidget.applyRefreshState(context, progress, false, context.getString(R.string.widget_refresh_failed));
            progress.reapply(context, root);
            assertEquals(View.GONE, root.findViewById(R.id.widget_refresh_progress).getVisibility());
            assertEquals(View.VISIBLE, root.findViewById(R.id.widget_refresh).getVisibility());
            assertTrue(root.findViewById(R.id.widget_now).isEnabled());
            assertEquals(context.getString(R.string.widget_refresh_failed),
                ((TextView) root.findViewById(R.id.widget_date)).getText().toString());
            assertEquals(23, list.getLastVisiblePosition());
            ActivityTimelineWidget.applyRefreshState(context, progress, false, null);
            progress.reapply(context, root);
            assertNotEquals(context.getString(R.string.widget_refresh_failed),
                ((TextView) root.findViewById(R.id.widget_date)).getText().toString());
            list.setSelection(0); list.forceLayout(); list.measure(width, height); list.layout(0, 0, 600, 400);
            assertEquals(0, list.getFirstVisiblePosition());
        });
    }

    @Test public void incompleteSyncReturnsAnErrorWithoutAFalseEmptyDay() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        JSONArray files = new JSONArray().put(new JSONArray().put("_Planner/activities/2026/2026-W41.yaml").put("activities: [unfinished"));
        try {
            WidgetTimelineEngine.build(context, files, "2026-10-07", System.currentTimeMillis(), false);
            fail("Incomplete YAML must not be shown as an empty day");
        } catch (java.io.IOException expected) { assertNotNull(expected.getMessage()); }
    }
}
