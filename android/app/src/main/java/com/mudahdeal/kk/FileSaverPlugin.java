package com.mudahdeal.kk;

import android.Manifest;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

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

/**
 * Saves an exported file straight into the device's public Downloads folder.
 *
 * @capacitor/filesystem cannot do this: it writes through the raw File API, and
 * scoped storage blocks that for public directories from Android 10 onward. Its
 * usual workaround is to drop the file in the app cache and open a share sheet,
 * which makes exporting feel like sending a message rather than saving a file.
 *
 * Two routes, picked by OS version:
 *
 *   Android 10+ — MediaStore. No permission exists to ask for; the platform lets
 *   an app add its own files to Downloads by design. Asking anyway would show
 *   the user nothing, because WRITE_EXTERNAL_STORAGE is no longer a runtime
 *   permission there.
 *
 *   Android 9 and below — the legacy File API, which genuinely does need
 *   WRITE_EXTERNAL_STORAGE, so the permission is requested before writing.
 */
@CapacitorPlugin(
    name = "FileSaver",
    permissions = {
        @Permission(strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }, alias = FileSaverPlugin.STORAGE)
    }
)
public class FileSaverPlugin extends Plugin {

    static final String STORAGE = "storage";

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
            String location = needsLegacyPermission()
                ? saveLegacy(fileName, bytes)
                : saveWithMediaStore(fileName, mimeType, bytes);

            JSObject result = new JSObject();
            result.put("uri", location);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Gagal menyimpan berkas: " + e.getMessage(), e);
        }
    }

    private String saveWithMediaStore(String fileName, String mimeType, byte[] bytes) throws Exception {
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
        values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
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
        }

        values.clear();
        values.put(MediaStore.Downloads.IS_PENDING, 0);
        getContext().getContentResolver().update(item, values, null, null);

        return item.toString();
    }

    private String saveLegacy(String fileName, byte[] bytes) throws Exception {
        File downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        if (!downloads.exists() && !downloads.mkdirs()) {
            throw new IllegalStateException("Folder Download tidak bisa dibuat");
        }

        File target = new File(downloads, fileName);
        try (FileOutputStream out = new FileOutputStream(target)) {
            out.write(bytes);
        }
        return target.getAbsolutePath();
    }
}
