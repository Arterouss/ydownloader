package com.ydownloader.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MainActivity extends BridgeActivity {
    private static final Pattern URL_PATTERN = Pattern.compile("https?://[a-zA-Z0-9.-]+(?:/[^\\s]*)?");
    private String pendingSharedUrl = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register Native Downloader JavaScript Interface
        try {
            WebView webView = getBridge().getWebView();
            webView.addJavascriptInterface(new DownloaderBridge(this), "AndroidDownloader");
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

        if (Intent.ACTION_SEND.equals(action) && type != null) {
            String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (sharedText != null) {
                String extracted = extractUrl(sharedText);
                if (extracted != null) {
                    pendingSharedUrl = extracted;
                    sendUrlToWebView(extracted);
                }
            }
        } else if (Intent.ACTION_VIEW.equals(action)) {
            Uri data = intent.getData();
            if (data != null) {
                pendingSharedUrl = data.toString();
                sendUrlToWebView(data.toString());
            }
        }
    }

    private String extractUrl(String text) {
        Matcher matcher = URL_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group(0);
        }
        return text.trim();
    }

    private void sendUrlToWebView(String url) {
        if (url == null || url.isEmpty()) return;
        final String safeUrl = url.replace("'", "\\'");

        runOnUiThread(() -> {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView wv = getBridge().getWebView();
                    String script = String.format(
                        "window.__INITIAL_SHARED_URL__ = '%s';" +
                        "window.dispatchEvent(new CustomEvent('appSharedUrl', { detail: { url: '%s' } }));",
                        safeUrl, safeUrl
                    );
                    wv.evaluateJavascript(script, null);
                    Toast.makeText(MainActivity.this, "Link detected from social media!", Toast.LENGTH_SHORT).show();
                    pendingSharedUrl = null;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    public static class DownloaderBridge {
        private final Context context;

        public DownloaderBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void downloadFile(String fileUrl, String fileName, String title) {
            try {
                if (fileUrl == null || fileUrl.isEmpty()) return;

                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(fileUrl));
                request.setTitle(title != null && !title.isEmpty() ? title : "Downloading media");
                request.setDescription("Saving " + fileName);
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
                request.setAllowedOverMetered(true);
                request.setAllowedOverRoaming(true);

                DownloadManager manager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
                if (manager != null) {
                    manager.enqueue(request);
                    Toast.makeText(context, "Downloading to Gallery/Downloads: " + fileName, Toast.LENGTH_LONG).show();
                }
            } catch (Exception e) {
                e.printStackTrace();
                Toast.makeText(context, "Download error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        }
    }
}
