package com.focusapp.blocker

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class BlockerModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
    override fun getName() = "Blocker"

    @ReactMethod
    fun setBlocking(enabled: Boolean, packages: ReadableArray) {
        BlockerState.packages = (0 until packages.size()).mapNotNull { packages.getString(it) }.toSet()
        BlockerState.enabled = enabled
    }

    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        val cn = ComponentName(ctx, FocusAccessibilityService::class.java)
        val enabled = Settings.Secure.getString(
            ctx.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: ""
        val on = enabled.split(':').any {
            it.equals(cn.flattenToString(), true) || it.equals(cn.flattenToShortString(), true)
        }
        promise.resolve(on)
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        ctx.startActivity(
            Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
    }
}
