package com.mudahdeal.kk;

import android.os.Bundle;
import android.view.View;

import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Didaftarkan sebelum super.onCreate() supaya tersedia saat bridge dibuat.
        registerPlugin(FileSaverPlugin.class);
        super.onCreate(savedInstanceState);
        keepWebViewOutOfSystemBars();
    }

    /**
     * Android 15+ forces edge-to-edge, which would draw the WebView underneath the
     * status and navigation bars. Padding the WebView container by the system-bar
     * insets keeps the web layout pixel-identical to the browser/PWA build, and
     * painting that container with the app's own surface colour makes the exposed
     * strips blend into the page instead of showing the splash drawable.
     *
     * The IME inset is folded into the bottom padding so inputs still resize above
     * the on-screen keyboard on devices where the window itself is not resized.
     */
    private void keepWebViewOutOfSystemBars() {
        View container = (View) getBridge().getWebView().getParent();
        container.setBackgroundColor(ContextCompat.getColor(this, R.color.systemBarSurface));

        ViewCompat.setOnApplyWindowInsetsListener(container, (view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            int imeBottom = windowInsets.getInsets(WindowInsetsCompat.Type.ime()).bottom;

            view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, imeBottom));
            return windowInsets;
        });
    }
}
