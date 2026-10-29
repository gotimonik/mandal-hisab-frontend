package com.mandalhisab.app;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Print / Save as PDF for the app. Android's WebView ignores window.print(), so the page asks
 * for this instead: it opens the system print screen (which has "Save as PDF") for the current page.
 */
@CapacitorPlugin(name = "WebPrint")
public class WebPrintPlugin extends Plugin {

    @PluginMethod
    public void print(PluginCall call) {
        final String title = call.getString("title", "MandalHisab");
        getActivity().runOnUiThread(() -> {
            try {
                PrintManager printManager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
                WebView webView = getBridge().getWebView();
                PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(title);
                PrintAttributes attributes = new PrintAttributes.Builder()
                    .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                    .build();
                printManager.print(title, adapter, attributes);
                call.resolve();
            } catch (Exception e) {
                call.reject("Printing isn't available on this phone", e);
            }
        });
    }
}
