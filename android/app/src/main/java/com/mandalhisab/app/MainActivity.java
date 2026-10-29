package com.mandalhisab.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // app-only plugins must be registered before the bridge starts
        registerPlugin(WebPrintPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
