package com.santi020k.lumen

import android.view.KeyEvent
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.platform.view.inspector.WindowInspectorCompat

/** Wait for native popup window focus before injecting a real system Back event. */
internal fun pressBackOnFocusedPopup(
    rule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity>,
) {
    rule.waitUntil(timeoutMillis = 5_000) {
        rule.runOnUiThread {
            val activityView = rule.activity.window.decorView
            WindowInspectorCompat.getGlobalWindowViews().any { view ->
                view !== activityView && view.isAttachedToWindow && view.hasWindowFocus()
            }
        }
    }
    InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK)
}
