package com.nicklawrence.dayplanner.notifications;

import static org.junit.Assert.*;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.Chronometer;
import android.widget.FrameLayout;
import android.widget.GridView;
import android.widget.ImageView;
import android.widget.RemoteViews;
import androidx.test.platform.app.InstrumentationRegistry;
import com.nicklawrence.dayplanner.R;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

public class WidgetActiveClocksTest {
    @Test public void coldNotificationUsesAsyncSharedRepositoryAndRejectsMultipleOpenLogs() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        String path = "_Planner/activities/2026/2026-W41.yaml";
        String yaml = "activities:\n  - activity: walk\n    log: [{start: '2026-10-07 10:00:00'}]\n";
        String id = "[\"" + path + "\",\"walk\",[\"2026-10-07 10:00:00\"]]";
        JSONArray files = new JSONArray().put(new JSONArray().put(path).put(yaml));
        JSONObject command = new JSONObject().put("type", "appendNote").put("id", id).put("note", "From notification");
        JSONObject plan = WidgetTimelineEngine.activityCommand(context, files, command);
        assertEquals(id, plan.getString("activityId"));
        assertEquals(yaml, plan.getJSONArray("writes").getJSONObject(0).getString("expected"));
        assertTrue(plan.getJSONArray("writes").getJSONObject(0).getString("contents").contains("From notification"));
        String invalid = yaml.replace("}]", "}, {start: '2026-10-07 11:00:00'}]");
        JSONArray bad = new JSONArray().put(new JSONArray().put(path).put(invalid));
        try { WidgetTimelineEngine.activityCommand(context, bad, command); fail("Two open logs must be rejected"); }
        catch (java.io.IOException error) { assertTrue(error.getMessage().contains("at most one open clock")); }
    }
    @Test public void sharedClocksRenderBesideEachOtherWithLiveTimersAndAnImageButton() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        String yaml = "activities:\n  - activity: walk\n    log: [{start: '2026-09-29 09:00:00'}]\n"
            + "  - activity: read\n    read: {book: 'Requested book'}\n    log: [{start: '2026-10-07 11:00:00'}]\n";
        JSONArray files = new JSONArray().put(new JSONArray().put("_Planner/activities/2026/2026-W41.yaml").put(yaml));
        JSONArray clocks = WidgetTimelineEngine.activeClocks(context, files, false).getJSONArray("clocks");
        assertEquals(2, clocks.length());
        assertEquals("09:00", clocks.getJSONObject(0).getString("startLabel"));
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            View root = new RemoteViews(context.getPackageName(), R.layout.activity_clocks_widget).apply(context, new FrameLayout(context));
            GridView grid = root.findViewById(R.id.clocks_grid);
            grid.setNumColumns(2);
            grid.setAdapter(new BaseAdapter() {
                @Override public int getCount() { return clocks.length(); }
                @Override public Object getItem(int position) { return clocks.optJSONObject(position); }
                @Override public long getItemId(int position) { return position; }
                @Override public View getView(int position, View recycled, ViewGroup parent) {
                    try { return WidgetClockRenderer.render(context, clocks.getJSONObject(position), "fixture-vault", 200).apply(context, parent); }
                    catch (Exception error) { throw new RuntimeException(error); }
                }
            });
            grid.measure(View.MeasureSpec.makeMeasureSpec(900, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(600, View.MeasureSpec.EXACTLY));
            grid.layout(0, 0, 900, 600);
            assertEquals(2, grid.getChildCount());
            assertEquals(grid.getChildAt(0).getTop(), grid.getChildAt(1).getTop());
            assertTrue(grid.getChildAt(1).getLeft() > grid.getChildAt(0).getLeft());
            View card = grid.getChildAt(1);
            ImageView out = card.findViewById(R.id.clock_out);
            assertNotNull(out.getDrawable());
            assertTrue(out.getContentDescription().toString().contains("Requested book"));
            Chronometer timer = card.findViewById(R.id.clock_elapsed);
            long expectedElapsed = Math.max(0, System.currentTimeMillis() - clocks.optJSONObject(1).optLong("startedAt"));
            assertEquals(expectedElapsed, SystemClock.elapsedRealtime() - timer.getBase(), 2_000);
        });
    }

    @Test public void clockOutPointerSurvivesColdSelectionAndRejectsOtherVaults() throws Exception {
        // Instrumentation package preferences are isolated from the real app/vault.
        Context context = InstrumentationRegistry.getInstrumentation().getContext();
        SharedPreferences vault = context.getSharedPreferences("vault_connection", Context.MODE_PRIVATE);
        SharedPreferences selection = context.getSharedPreferences("activity_selection", Context.MODE_PRIVATE);
        vault.edit().clear().putString("tree_uri", "fixture-vault").commit();
        selection.edit().clear().commit();
        try {
            String requested = "[\"_Planner/activities/2026/2026-W41.yaml\",\"walk\",[\"2026-10-07 10:00:00\"]]";
            ActiveActivityStore store = new ActiveActivityStore(context);
            store.requestFinishFor(requested, "fixture-vault");
            JSONObject cold = new ActiveActivityStore(context).toJson();
            assertFalse(cold.getBoolean("active"));
            assertEquals(requested, cold.getString("finishId"));
            store.requestFinishFor(requested, "wrong-vault");
            assertEquals(requested, store.toJson().getString("finishId"));
            store.cancelFinish("another-activity");
            store.clearSelection();
            assertEquals(requested, store.toJson().getString("finishId"));
            store.requestFinishFor(requested, "fixture-vault", "2026-10-07 10:00:00");
            store.cancelFinish(requested, "2026-10-07 09:00:00");
            assertEquals("2026-10-07 10:00:00", store.toJson().getString("finishLogStart"));
            vault.edit().putString("tree_uri", "other-vault").commit();
            assertFalse(store.toJson().has("finishId"));
            store.requestFinish(false);
            assertFalse(selection.contains("finish_id"));
        } finally { selection.edit().clear().commit(); vault.edit().clear().commit(); }
    }
}
