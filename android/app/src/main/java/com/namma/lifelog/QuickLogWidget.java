package com.namma.lifelog;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

/** Home-screen widget: only for logging. Mic button opens voice quick-log, keyboard button opens typing quick-log. */
public class QuickLogWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_log);
            views.setOnClickPendingIntent(R.id.widget_voice, quickIntent(context, "voice", 11));
            views.setOnClickPendingIntent(R.id.widget_type, quickIntent(context, "type", 12));
            views.setOnClickPendingIntent(R.id.widget_title, quickIntent(context, "voice", 13));
            manager.updateAppWidget(id, views);
        }
    }

    private static PendingIntent quickIntent(Context context, String mode, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("nammalifelog://quick?mode=" + mode));
        intent.setClass(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(context, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
