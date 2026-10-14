package com.nicklawrence.dayplanner.notifications;

import android.Manifest;
import android.os.Build;
import android.content.Intent;
import android.app.Activity;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import org.json.JSONArray;
import org.json.JSONObject;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "ActivityNotifications", permissions = @Permission(
    alias = ActivityNotificationsPlugin.NOTIFICATIONS, strings = Manifest.permission.POST_NOTIFICATIONS))
public class ActivityNotificationsPlugin extends Plugin {
    static final String NOTIFICATIONS = "notifications";
    private final ExecutorService resourceScanExecutor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || getPermissionState(NOTIFICATIONS) == PermissionState.GRANTED) {
            resolvePermission(call, true);
            return;
        }
        requestPermissionForAlias(NOTIFICATIONS, call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) { resolvePermission(call, getPermissionState(NOTIFICATIONS) == PermissionState.GRANTED); }

    @Override
    public void load() { handleFinishIntent(getActivity().getIntent()); }

    @Override
    protected void handleOnDestroy() { resourceScanExecutor.shutdownNow(); }

    @Override
    protected void handleOnNewIntent(Intent intent) { handleFinishIntent(intent); }

    private void handleFinishIntent(Intent intent) {
        if (intent == null) return;
        if (ActivityClocksWidget.CLOCK_OUT.equals(intent.getAction())) {
            try {
                new ActiveActivityStore(getContext()).requestFinishFor(
                    intent.getStringExtra("activity_id"), intent.getStringExtra("vault_uri"), intent.getStringExtra("log_start"));
                notifyListeners("finishRequested", new JSObject());
            } catch (Exception error) { android.util.Log.w("DayPlanner", "Invalid clock-out request", error); }
            intent.setAction(null);
            return;
        }
        if (!ActivityNotificationManager.ACTION_END.equals(intent.getAction())) return;
        ActiveActivityStore store = new ActiveActivityStore(getContext());
        if (store.isActive() && store.id().equals(intent.getStringExtra("activity_id")) &&
            store.connectionId().equals(intent.getStringExtra("vault_uri"))) {
            store.requestFinish(true);
            notifyListeners("finishRequested", new JSObject());
        }
        intent.setAction(null);
    }

    @PluginMethod
    public void getConnection(PluginCall call) {
        resolveConnection(call);
        ActivityTimelineWidget.refreshAll(getContext());
        ActivityClocksWidget.refreshAll(getContext());
    }

    @PluginMethod
    public void chooseVault(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        startActivityForResult(call, intent, "vaultResult");
    }

    @ActivityCallback
    private void vaultResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            resolveConnection(call);
            return;
        }
        try {
            Uri tree = data.getData();
            int grants = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            if ((grants & Intent.FLAG_GRANT_WRITE_URI_PERMISSION) == 0) throw new java.io.IOException("Choose a writable vault folder");
            getContext().getContentResolver().takePersistableUriPermission(tree,
                (grants & Intent.FLAG_GRANT_READ_URI_PERMISSION) != 0
                    ? Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                    : Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            synchronized (VaultFiles.LOCK) {
                new VaultFiles(getContext()).connect(tree);
                new ActiveActivityStore(getContext()).clear();
                ActivityNotificationManager.cancel(getContext());
            }
            ActivityTimelineWidget.refreshAll(getContext());
            ActivityClocksWidget.refreshAll(getContext());
            resolveConnection(call);
        } catch (Exception error) { call.reject(error.getMessage(), error); }
    }

    @PluginMethod
    public void listFiles(PluginCall call) {
        // Capacitor serializes plugin calls. A full resource scan must not hold up
        // saves, notification actions, or the much smaller activity history scan.
        if (call.getString("folder", "").isEmpty()) {
            resourceScanExecutor.execute(() -> resolveFiles(call));
        } else resolveFiles(call);
    }

    private void resolveFiles(PluginCall call) {
        try {
            JSObject result = new JSObject();
            result.put("paths", new JSONArray(new VaultFiles(getContext()).listFiles(
                call.getString("folder", ""), call.getString("extension", null))));
            call.resolve(result);
        } catch (Exception error) { call.reject(error.getMessage(), error); }
    }

    @PluginMethod
    public void readFile(PluginCall call) {
        try {
            JSObject result = new JSObject();
            String contents = new VaultFiles(getContext()).readFile(call.getString("path", ""));
            result.put("contents", contents == null ? JSONObject.NULL : contents);
            call.resolve(result);
        } catch (Exception error) { call.reject(error.getMessage(), error); }
    }

    @PluginMethod
    public void writeFile(PluginCall call) {
        try {
            if (!call.getData().has("expected")) { call.reject("Expected file contents are required"); return; }
            new VaultFiles(getContext()).writeFile(call.getString("path", ""), call.getString("contents", ""), call.getString("expected", null));
            ActivityTimelineWidget.refreshAll(getContext());
            ActivityClocksWidget.refreshAll(getContext());
            call.resolve();
        } catch (Exception error) { call.reject(error.getMessage(), error); }
    }

    @PluginMethod
    public void getActiveActivity(PluginCall call) {
        try { call.resolve(JSObject.fromJSONObject(new ActiveActivityStore(getContext()).toJson())); }
        catch (Exception error) { call.reject(error.getMessage(), error); }
    }

    @PluginMethod
    public void selectActivity(PluginCall call) {
        try {
            ActiveActivityStore store = new ActiveActivityStore(getContext());
            store.select(call.getString("id", ""), call.getString("label", "Activity"), call.getLong("startedAt", System.currentTimeMillis()));
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || getPermissionState(NOTIFICATIONS) == PermissionState.GRANTED)
                ActivityNotificationManager.show(getContext(), store, null);
            call.resolve();
        } catch (Exception error) { call.reject(error.getMessage(), error); }
    }

    @PluginMethod
    public void clearSelection(PluginCall call) {
        new ActiveActivityStore(getContext()).clearSelection();
        ActivityNotificationManager.cancel(getContext());
        call.resolve();
    }

    @PluginMethod
    public void cancelFinish(PluginCall call) {
        new ActiveActivityStore(getContext()).cancelFinish(call.getString("id", null), call.getString("logStart", null));
        call.resolve();
    }

    private void resolveConnection(PluginCall call) {
        VaultFiles files = new VaultFiles(getContext());
        JSObject result = new JSObject();
        result.put("connected", files.connected());
        result.put("name", files.name());
        call.resolve(result);
    }

    private void resolvePermission(PluginCall call, boolean granted) {
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }
}
