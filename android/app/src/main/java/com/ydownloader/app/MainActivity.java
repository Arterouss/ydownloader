package com.ydownloader.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MainActivity extends BridgeActivity {
    private static final Pattern URL_PATTERN = Pattern.compile("https?://[a-zA-Z0-9.-]+(?:/[^\\s]*)?");
    private static final int MAX_URL_LENGTH = 2048;
    private String pendingSharedUrl = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                boolean isDebuggable = (0 != (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE));
                WebView.setWebContentsDebuggingEnabled(isDebuggable);
                webView.addJavascriptInterface(new SecureDownloaderBridge(this), "AndroidDownloader");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        handleIncomingIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingIntent(intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (pendingSharedUrl != null) {
            sendUrlToWebView(pendingSharedUrl);
        }
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        String type = intent.getType();

        try {
            if (Intent.ACTION_SEND.equals(action) && type != null) {
                String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
                if (sharedText != null && sharedText.length() < 8192) {
                    String extracted = extractUrl(sharedText);
                    if (extracted != null) {
                        pendingSharedUrl = extracted;
                        sendUrlToWebView(extracted);
                    }
                }
            } else if (Intent.ACTION_VIEW.equals(action)) {
                Uri data = intent.getData();
                if (data != null) {
                    String urlStr = data.toString();
                    if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
                        pendingSharedUrl = urlStr;
                        sendUrlToWebView(urlStr);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String extractUrl(String text) {
        if (text == null) return null;
        Matcher matcher = URL_PATTERN.matcher(text);
        if (matcher.find()) {
            String found = matcher.group(0);
            if (found != null && found.length() <= MAX_URL_LENGTH) {
                return found;
            }
        }
        return null;
    }

    private void sendUrlToWebView(String url) {
        if (url == null || url.trim().isEmpty() || url.length() > MAX_URL_LENGTH) return;

        final String jsonQuotedUrl = JSONObject.quote(url.trim());

        runOnUiThread(() -> {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView wv = getBridge().getWebView();
                    final String script = String.format(
                        "window.__INITIAL_SHARED_URL__ = %s;" +
                        "window.dispatchEvent(new CustomEvent('appSharedUrl', { detail: { url: %s } }));",
                        jsonQuotedUrl, jsonQuotedUrl
                    );
                    wv.evaluateJavascript(script, null);

                    // Re-dispatch after 1.2s to guarantee delivery even if remote page is still loading
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        try {
                            if (getBridge() != null && getBridge().getWebView() != null) {
                                getBridge().getWebView().evaluateJavascript(script, null);
                            }
                        } catch (Exception ignored) {}
                    }, 1200);

                    Toast.makeText(MainActivity.this, "Shared link verified and loaded!", Toast.LENGTH_SHORT).show();
                    pendingSharedUrl = null;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    public static class SecureDownloaderBridge {
        private final Context context;

        public SecureDownloaderBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public boolean isFloatingWidgetActive() {
            return FloatingWidgetService.isServiceRunning();
        }

        @JavascriptInterface
        public void toggleFloatingWidget() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
                    Intent intent = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + context.getPackageName())
                    );
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                    Toast.makeText(context, "Aktifkan izin 'Tampilkan di atas aplikasi lain' untuk YDownloader", Toast.LENGTH_LONG).show();
                    return;
                }

                if (FloatingWidgetService.isServiceRunning()) {
                    Intent intent = new Intent(context, FloatingWidgetService.class);
                    context.stopService(intent);
                    Toast.makeText(context, "Tombol mengambang dinonaktifkan", Toast.LENGTH_SHORT).show();
                } else {
                    Intent intent = new Intent(context, FloatingWidgetService.class);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(intent);
                    } else {
                        context.startService(intent);
                    }
                    Toast.makeText(context, "Tombol mengambang aktif di samping layar!", Toast.LENGTH_LONG).show();
                }
            } catch (Exception e) {
                e.printStackTrace();
                Toast.makeText(context, "Error floating widget: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        }

        @JavascriptInterface
        public void downloadFile(String fileUrl, String fileName, String title) {
            try {
                if (fileUrl == null || fileUrl.trim().isEmpty()) return;
                String trimmedUrl = fileUrl.trim();
                if (!trimmedUrl.startsWith("https://") && !trimmedUrl.startsWith("http://")) {
                    Toast.makeText(context, "Blocked: Insecure or invalid protocol.", Toast.LENGTH_SHORT).show();
                    return;
                }

                String safeName = fileName;
                if (safeName == null || safeName.trim().isEmpty()) {
                    safeName = "media_" + System.currentTimeMillis() + ".mp4";
                }

                safeName = safeName.replace("..", "_");
                safeName = safeName.replaceAll("[\\\\/:*?\"<>|]", "_").trim();

                String lowerName = safeName.toLowerCase(Locale.ROOT);
                boolean isAllowedExt = lowerName.endsWith(".mp4") ||
                                       lowerName.endsWith(".mp3") ||
                                       lowerName.endsWith(".m4a") ||
                                       lowerName.endsWith(".webm") ||
                                       lowerName.endsWith(".jpg") ||
                                       lowerName.endsWith(".jpeg") ||
                                       lowerName.endsWith(".png") ||
                                       lowerName.endsWith(".webp");

                if (!isAllowedExt) {
                    safeName = safeName + ".mp4";
                }

                if (safeName.length() > 100) {
                    String ext = safeName.substring(safeName.lastIndexOf("."));
                    safeName = safeName.substring(0, 90) + ext;
                }

                String safeTitle = (title != null && !title.trim().isEmpty())
                    ? title.replaceAll("[\\r\\n]", " ").trim()
                    : "Downloading Media";
                if (safeTitle.length() > 60) {
                    safeTitle = safeTitle.substring(0, 57) + "…";
                }

                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(trimmedUrl));
                request.setTitle(safeTitle);
                request.setDescription("Saving: " + safeName);
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, safeName);
                request.setAllowedOverMetered(true);
                request.setAllowedOverRoaming(true);

                DownloadManager manager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
                if (manager != null) {
                    manager.enqueue(request);
                    Toast.makeText(context, "Secure download started: " + safeName, Toast.LENGTH_LONG).show();
                }
            } catch (Exception e) {
                e.printStackTrace();
                Toast.makeText(context, "Download error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        }
    }
}
