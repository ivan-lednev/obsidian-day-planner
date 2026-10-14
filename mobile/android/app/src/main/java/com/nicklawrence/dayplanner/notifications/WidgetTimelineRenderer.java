package com.nicklawrence.dayplanner.notifications;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.text.TextUtils;
import org.json.JSONArray;
import org.json.JSONObject;

/** Native drawing only. All labels, colors, times and overlap positions come from TS. */
final class WidgetTimelineRenderer {
    private static final float HOUR_HEIGHT = 96f;
    private static final float AXIS_WIDTH = 48f;

    static Bitmap render(Context context, JSONObject model, int index, int widthDp) throws Exception {
        JSONObject hour = model.getJSONArray("hours").getJSONObject(index);
        double start = hour.getDouble("startMinute"), end = hour.getDouble("endMinute");
        float height = (float) (HOUR_HEIGHT * (end - start) / 60);
        // Keep each collection row comfortably below Android's Binder bitmap limit.
        float scale = Math.min(1.5f, 700f / widthDp);
        Bitmap image = Bitmap.createBitmap(Math.max(1, Math.round(widthDp * scale)),
            Math.max(1, Math.round(height * scale)), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(image);
        canvas.scale(scale, scale);
        boolean dark = model.getBoolean("dark");
        int background = dark ? Color.rgb(30, 30, 30) : Color.WHITE;
        int text = dark ? Color.rgb(218, 218, 218) : Color.rgb(34, 34, 34);
        int muted = dark ? Color.rgb(171, 171, 171) : Color.rgb(102, 102, 102);
        canvas.drawColor(background);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setColor(dark ? Color.rgb(60, 60, 60) : Color.rgb(225, 225, 225));
        paint.setStrokeWidth(0.7f);
        canvas.drawLine(AXIS_WIDTH, 0.5f, widthDp, 0.5f, paint);
        paint.setPathEffect(new DashPathEffect(new float[] { 2, 4 }, 0));
        if (height > HOUR_HEIGHT / 2) canvas.drawLine(AXIS_WIDTH, HOUR_HEIGHT / 2, widthDp, HOUR_HEIGHT / 2, paint);
        paint.setPathEffect(null);
        float fontScale = context.getResources().getConfiguration().fontScale;
        TextPaint label = textPaint(muted, 11 * fontScale, false);
        canvas.drawText(hour.getString("label"), 0, 14 * fontScale, label);
        JSONArray blocks = model.getJSONArray("blocks");
        for (int i = 0; i < blocks.length(); i++) {
            JSONObject block = blocks.getJSONObject(i);
            double from = block.getDouble("startMinute"), to = block.getDouble("endMinute");
            if (from >= end || (to <= start && to > from)) continue;
            JSONObject placing = block.getJSONObject("placing");
            float available = widthDp - AXIS_WIDTH;
            float left = AXIS_WIDTH + (float) (available * placing.getDouble("offsetPercent") / 100);
            float right = left + Math.max(2, (float) (available * placing.getDouble("spanPercent") / 100) - 4);
            float top = (float) ((from - start) * HOUR_HEIGHT / 60);
            float bottom = Math.max(top + 8, (float) ((to - start) * HOUR_HEIGHT / 60));
            RectF rectangle = new RectF(left, top + 1, right, bottom - 1);
            canvas.save();
            canvas.clipRect(AXIS_WIDTH, 0, widthDp, height);
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(Color.parseColor(block.getString("background")));
            canvas.drawRoundRect(rectangle, 4, 4, paint);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(1);
            paint.setColor(Color.parseColor(block.getString("border")));
            canvas.drawRoundRect(rectangle, 4, 4, paint);
            paint.setStyle(Paint.Style.FILL);
            canvas.clipRect(rectangle);
            int contentWidth = Math.max(1, Math.round(right - left - 10));
            // Every hour is a clipped slice of the same activity. Keep its content
            // anchored to the actual start, including when that start is above this row.
            float y = top + 5;
            TextPaint title = textPaint(text, 12 * fontScale, true);
            String quality = block.optString("qualityLabel", "");
            TextPaint qualityPaint = textPaint(muted, 10 * fontScale, false);
            int qualityWidth = quality.isEmpty() ? 0 : Math.max(1, Math.min(contentWidth / 2,
                (int) Math.ceil(qualityPaint.measureText(quality))));
            int titleWidth = Math.max(1, contentWidth - (qualityWidth > 0 ? qualityWidth + 5 : 0));
            String titleText = (block.getBoolean("active") ? "● " : "") + block.getString("title");
            int titleHeight = paragraph(canvas, titleText, title, left + 5, y, titleWidth, 2);
            int qualityHeight = qualityWidth == 0 ? 0 : paragraph(canvas, quality, qualityPaint,
                right - 5 - qualityWidth, y, qualityWidth, 1, Layout.Alignment.ALIGN_OPPOSITE);
            y += Math.max(titleHeight, qualityHeight);
            String notes = block.optString("notes", "");
            int lines = Math.min(3, (int) ((bottom - y - 18 * fontScale) / (14 * fontScale)));
            if (!notes.isEmpty() && lines > 0)
                paragraph(canvas, notes, textPaint(muted, 11 * fontScale, false), left + 5, y + 3, contentWidth, lines);
            if (!block.getBoolean("active") && bottom - top > 32 * fontScale) {
                String duration = block.getString("durationLabel");
                TextPaint durationPaint = textPaint(muted, 10 * fontScale, false);
                paint.setColor(Color.parseColor(block.getString("background")));
                float badgeWidth = durationPaint.measureText(duration) + 8;
                canvas.drawRect(left + 1, bottom - 14 * fontScale, left + badgeWidth, bottom - 1, paint);
                canvas.drawText(duration, left + 4, bottom - 3, durationPaint);
            }
            canvas.restore();
        }
        if (!model.isNull("nowMinute")) {
            double now = model.getDouble("nowMinute");
            if (now >= start && now < end) {
                float y = (float) ((now - start) * HOUR_HEIGHT / 60);
                paint.setColor(Color.rgb(239, 68, 68));
                paint.setStrokeWidth(1.5f);
                canvas.drawLine(AXIS_WIDTH - 4, y, widthDp, y, paint);
                canvas.drawCircle(AXIS_WIDTH - 4, y, 3, paint);
            }
        }
        return image;
    }

    private static TextPaint textPaint(int color, float size, boolean bold) {
        TextPaint result = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        result.setColor(color); result.setTextSize(size);
        result.setTypeface(bold ? Typeface.create(Typeface.DEFAULT, Typeface.BOLD) : Typeface.DEFAULT);
        return result;
    }

    private static int paragraph(Canvas canvas, String text, TextPaint paint, float left, float top, int width, int lines) {
        return paragraph(canvas, text, paint, left, top, width, lines, Layout.Alignment.ALIGN_NORMAL);
    }

    private static int paragraph(Canvas canvas, String text, TextPaint paint, float left, float top, int width, int lines,
            Layout.Alignment alignment) {
        StaticLayout layout = StaticLayout.Builder.obtain(text, 0, text.length(), paint, width)
            .setAlignment(alignment).setIncludePad(false)
            .setMaxLines(lines).setEllipsize(TextUtils.TruncateAt.END).build();
        canvas.save(); canvas.translate(left, top); layout.draw(canvas); canvas.restore();
        return layout.getHeight();
    }

    static String describe(JSONObject model, int index) throws Exception {
        JSONObject hour = model.getJSONArray("hours").getJSONObject(index);
        double start = hour.getDouble("startMinute"), end = hour.getDouble("endMinute");
        StringBuilder result = new StringBuilder(hour.getString("label"));
        JSONArray blocks = model.getJSONArray("blocks");
        for (int i = 0; i < blocks.length(); i++) {
            JSONObject block = blocks.getJSONObject(i);
            double from = block.getDouble("startMinute"), to = block.getDouble("endMinute");
            if (from >= end || (to <= start && to > from)) continue;
            result.append(". ").append(block.getString("title")).append(", ").append(block.getString("timeLabel"));
            if (!block.getBoolean("active")) result.append(", ").append(block.getString("durationLabel"));
            if (block.has("qualityLabel")) result.append(", ").append(block.getString("qualityLabel"));
            if (!block.optString("notes", "").isEmpty()) result.append(". ").append(block.getString("notes"));
        }
        return result.toString();
    }
}
