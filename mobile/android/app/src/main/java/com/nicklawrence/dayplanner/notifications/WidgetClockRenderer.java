package com.nicklawrence.dayplanner.notifications;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;
import com.nicklawrence.dayplanner.R;
import org.json.JSONObject;

final class WidgetClockRenderer {
    static RemoteViews render(Context context, JSONObject clock, String connection, int width) throws Exception {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.activity_clock_card);
        views.setTextViewText(R.id.clock_title, clock.getString("title"));
        views.setTextViewText(R.id.clock_notes, clock.optString("notes"));
        views.setViewVisibility(R.id.clock_notes, clock.optString("notes").isEmpty() ? View.GONE : View.VISIBLE);
        views.setTextViewText(R.id.clock_quality, clock.optString("qualityLabel"));
        views.setViewVisibility(R.id.clock_quality, clock.optString("qualityLabel").isEmpty() ? View.GONE : View.VISIBLE);
        views.setTextViewText(R.id.clock_start, "↗ " + clock.getString("startLabel"));
        long elapsed = Math.max(0, System.currentTimeMillis() - clock.getLong("startedAt"));
        views.setChronometer(R.id.clock_elapsed, SystemClock.elapsedRealtime() - elapsed, "◷ %s", true);
        views.setContentDescription(R.id.clock_out, context.getString(R.string.clock_out_description, clock.getString("title")));
        views.setOnClickFillInIntent(R.id.clock_out, new Intent()
            .putExtra("activity_id", clock.getString("id")).putExtra("vault_uri", connection)
            .putExtra("log_start", clock.getString("logStart")));
        Bitmap background = Bitmap.createBitmap(Math.max(1, Math.min(400, width)), 96, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(background);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        RectF bounds = new RectF(0.5f, 0.5f, background.getWidth() - 0.5f, 95.5f);
        paint.setColor(Color.parseColor(clock.getString("background")));
        canvas.drawRoundRect(bounds, 5, 5, paint);
        paint.setStyle(Paint.Style.STROKE); paint.setStrokeWidth(1);
        paint.setColor(Color.parseColor(clock.getString("border")));
        canvas.drawRoundRect(bounds, 5, 5, paint);
        views.setImageViewBitmap(R.id.clock_background, background);
        return views;
    }
}
