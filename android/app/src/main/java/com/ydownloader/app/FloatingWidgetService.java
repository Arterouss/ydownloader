package com.ydownloader.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.os.Build;
import android.os.IBinder;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Toast;
import androidx.core.app.NotificationCompat;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FloatingWidgetService extends Service {
    private static final String CHANNEL_ID = "ydownloader_floating_channel";
    private static final int NOTIFICATION_ID = 2026;
    private static final Pattern URL_PATTERN = Pattern.compile("https?://[a-zA-Z0-9.-]+(?:/[^\\s]*)?");

    private WindowManager windowManager;
    private View floatingView;
    private WindowManager.LayoutParams params;
    private static boolean isRunning = false;

    public static boolean isServiceRunning() {
        return isRunning;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        isRunning = true;
        createNotificationChannel();

        Intent stopIntent = new Intent(this, FloatingWidgetService.class);
        stopIntent.setAction("ACTION_STOP");
        PendingIntent pStopIntent = PendingIntent.getService(
            this, 0, stopIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("YDownloader Floating Button Aktif")
            .setContentText("Ketuk tombol di samping layar untuk download video sosmed")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Matikan Tombol", pStopIntent)
            .build();

        startForeground(NOTIFICATION_ID, notification);

        initFloatingWidget();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "ACTION_STOP".equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        return START_STICKY;
    }

    private void initFloatingWidget() {
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        LayoutInflater inflater = (LayoutInflater) getSystemService(LAYOUT_INFLATER_SERVICE);
        floatingView = inflater.inflate(R.layout.layout_floating_widget, null);

        int layoutType;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutType = WindowManager.LayoutParams.TYPE_PHONE;
        }

        params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 0;
        params.y = 350;

        try {
            windowManager.addView(floatingView, params);
        } catch (Exception e) {
            e.printStackTrace();
            stopSelf();
            return;
        }

        setupTouchListener();
    }

    private void setupTouchListener() {
        View widgetBody = floatingView.findViewById(R.id.floating_widget_body);
        if (widgetBody == null) return;

        widgetBody.setOnTouchListener(new View.OnTouchListener() {
            private int initialX, initialY;
            private float initialTouchX, initialTouchY;
            private long downTime;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        downTime = System.currentTimeMillis();
                        v.animate().scaleX(1.1f).scaleY(1.1f).setDuration(100).start();
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        params.x = initialX + (int) (event.getRawX() - initialTouchX);
                        params.y = initialY + (int) (event.getRawY() - initialTouchY);
                        windowManager.updateViewLayout(floatingView, params);
                        return true;

                    case MotionEvent.ACTION_UP:
                        v.animate().scaleX(1.0f).scaleY(1.0f).setDuration(100).start();
                        int deltaX = (int) Math.abs(event.getRawX() - initialTouchX);
                        int deltaY = (int) Math.abs(event.getRawY() - initialTouchY);
                        long elapsed = System.currentTimeMillis() - downTime;

                        if (deltaX < 15 && deltaY < 15 && elapsed < 400) {
                            // CLICK / TAP EVENT!
                            handleWidgetClick();
                        } else {
                            // DRAG EVENT: Snap to nearest screen edge (left or right)
                            snapToEdge();
                        }
                        return true;
                }
                return false;
            }
        });
    }

    private void snapToEdge() {
        try {
            DisplayMetrics metrics = new DisplayMetrics();
            windowManager.getDefaultDisplay().getMetrics(metrics);
            int screenWidth = metrics.widthPixels;

            if (params.x < (screenWidth / 2)) {
                params.x = 0; // Snap to left edge
            } else {
                params.x = screenWidth - floatingView.getWidth(); // Snap to right edge
            }
            windowManager.updateViewLayout(floatingView, params);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void handleWidgetClick() {
        // 1. Check Clipboard for social media link
        String copiedUrl = getCopiedUrlFromClipboard();

        Intent appIntent = new Intent(this, MainActivity.class);
        appIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        if (copiedUrl != null && !copiedUrl.isEmpty()) {
            appIntent.setAction(Intent.ACTION_SEND);
            appIntent.setType("text/plain");
            appIntent.putExtra(Intent.EXTRA_TEXT, copiedUrl);
            Toast.makeText(this, "Membuka link dari Clipboard!", Toast.LENGTH_SHORT).show();
        } else {
            Toast.makeText(this, "YDownloader aktif! Salin link video untuk download cepat", Toast.LENGTH_SHORT).show();
        }

        startActivity(appIntent);
    }

    private String getCopiedUrlFromClipboard() {
        try {
            ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (clipboard != null && clipboard.hasPrimaryClip()) {
                ClipData clipData = clipboard.getPrimaryClip();
                if (clipData != null && clipData.getItemCount() > 0) {
                    CharSequence text = clipData.getItemAt(0).getText();
                    if (text != null) {
                        Matcher matcher = URL_PATTERN.matcher(text.toString());
                        if (matcher.find()) {
                            return matcher.group(0);
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Tombol Mengambang YDownloader",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Menampilkan status tombol mengambang YDownloader");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isRunning = false;
        if (floatingView != null && windowManager != null) {
            try {
                windowManager.removeView(floatingView);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}

