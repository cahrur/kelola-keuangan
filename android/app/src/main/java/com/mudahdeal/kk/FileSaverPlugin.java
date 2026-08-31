package com.mudahdeal.kk;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Saves an exported file straight into the public Downloads folder and announces
 * it with a notification the user can tap to open.
 *
 * @capacitor/filesystem cannot do the saving part: it writes through the raw
 * File API, and scoped storage blocks that for public directories from Android
 * 10 onward. Its usual workaround is to drop the file in the app cache and open
 * a share sheet, which makes exporting feel like sending a message rather than
 * saving a file.
 *
 * Two save routes, picked by OS version:
 *
 *   Android 10+ — MediaStore. No permission exists to ask for; the platform lets
 *   an app add its own files to Downloads by design. Asking anyway would show
 *   the user nothing, because WRITE_EXTERNAL_STORAGE is no longer a runtime
 *   permission there.
 *
 *   Android 9 and below — the legacy File API, which genuinely does need
 *   WRITE_EXTERNAL_STORAGE, so the permission is requested before writing.
 *
 * The notification matters more than it looks. A file written through MediaStore
 * lands in a shared collection with no visible trace inside the app, so without
 * it the user is told the export succeeded and then has to go hunting for the
 * file in a file manager.
 */
@CapacitorPlugin(
    name = "FileSaver",
    permissions = {
        @Permission(strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }, alias = FileSaverPlugin.STORAGE)
    }
)
public class FileSaverPlugin extends Plugin {

    static final String STORAGE = "storage";

    private static final String CHANNEL_ID = "ekspor_berkas";
    private static final AtomicInteger notificationIds = new AtomicInteger(4100);

    private static boolean needsLegacyPermission() {
        return Build.VERSION.SDK_INT <= Build.VERSION_CODES.P;
    }

    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        if (needsLegacyPermission() && getPermissionState(STORAGE) != PermissionState.GRANTED) {
            requestPermissionForAlias(STORAGE, call, "storagePermissionCallback");
            return;
        }
        performSave(call);
    }

    @PermissionCallback
    private void storagePermissionCallback(PluginCall call) {
        if (getPermissionState(STORAGE) == PermissionState.GRANTED) {
            performSave(call);
        } else {
            call.reject("Izin penyimpanan ditolak");
        }
    }

    private void performSave(PluginCall call) {
        String fileName = call.getString("fileName");
        String base64 = call.getString("data");
        String mimeType = call.getString("mimeType", "application/octet-stream");

        if (fileName == null || base64 == null) {
            call.reject("fileName dan data wajib diisi");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            if (bytes.length == 0) {
                // Better to fail loudly than to write a zero-byte file and report
                // success, which is exactly how an export bug hides.
                call.reject("Isi berkas kosong");
                return;
            }

            Uri uri = needsLegacyPermission()
                ? saveLegacy(fileName, bytes)
                : saveWithMediaStore(fileName, mimeType, bytes);

            boolean notified = notifySaved(uri, fileName, mimeType);

            JSObject result = new JSObject();
            result.put("uri", uri.toString());
            result.put("bytes", bytes.length);
            result.put("notified", notified);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Gagal menyimpan berkas: " + e.getMessage(), e);
        }
    }

    private Uri saveWithMediaStore(String fileName, String mimeType, byte[] bytes) throws Exception {
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
        values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
        // Stated explicitly rather than left to the default. Some OEM builds put
        // the file somewhere unexpected without it, which reads to the user as
        // the export never having happened.
        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
        // IS_PENDING hides the entry until the bytes are flushed, so nothing can
        // read a half-written export.
        values.put(MediaStore.Downloads.IS_PENDING, 1);

        Uri item = getContext().getContentResolver()
            .insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (item == null) {
            throw new IllegalStateException("MediaStore menolak membuat entri");
        }

        try (OutputStream out = getContext().getContentResolver().openOutputStream(item)) {
            if (out == null) {
                throw new IllegalStateException("Tidak bisa membuka aliran tulis");
            }
            out.write(bytes);
            out.flush();
        }

        values.clear();
        values.put(MediaStore.Downloads.IS_PENDING, 0);
        getContext().getContentResolver().update(item, values, null, null);

        return item;
    }

    private Uri saveLegacy(String fileName, byte[] bytes) throws Exception {
        File downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        if (!downloads.exists() && !downloads.mkdirs()) {
            throw new IllegalStateException("Folder Download tidak bisa dibuat");
        }

        File target = new File(downloads, fileName);
        try (FileOutputStream out = new FileOutputStream(target)) {
            out.write(bytes);
            out.flush();
        }

        // A file:// Uri would trip FileUriExposedException the moment another app
        // is handed it, so the notification carries a FileProvider Uri instead.
        return FileProvider.getUriForFile(
            getContext(), getContext().getPackageName() + ".fileprovider", target);
    }

    /**
     * @return whether a notification was actually posted. It is skipped when the
     * user has notifications turned off, and the web layer is told so it can
     * word its own confirmation accordingly instead of promising a notification
     * that will never arrive.
     */
    private boolean notifySaved(Uri uri, String fileName, String mimeType) {
        Context context = getContext();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) {
            return false;
        }

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) {
            return false;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            && manager.getNotificationChannel(CHANNEL_ID) == null) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "Ekspor berkas", NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("Pemberitahuan saat berkas ekspor selesai disimpan");
            manager.createNotificationChannel(channel);
        }

        Intent view = new Intent(Intent.ACTION_VIEW)
            .setDataAndType(uri, mimeType)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        // Wrapped in a chooser so the tap always leads somewhere. Plenty of
        // phones ship with nothing that opens a .csv or .xlsx, and a bare
        // ACTION_VIEW resolving to nothing would make the notification dead.
        Intent chooser = Intent.createChooser(view, "Buka " + fileName)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);

        int id = notificationIds.incrementAndGet();
        PendingIntent pending = PendingIntent.getActivity(
            context, id, chooser, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        manager.notify(id, new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_reminder)
            .setColor(0xFF3B987B)
            .setContentTitle("Ekspor selesai")
            .setContentText(fileName)
            .setStyle(new NotificationCompat.BigTextStyle()
                .bigText(fileName + "\nTersimpan di folder Download. Ketuk untuk membuka."))
            .setContentIntent(pending)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build());

        return true;
    }
}
