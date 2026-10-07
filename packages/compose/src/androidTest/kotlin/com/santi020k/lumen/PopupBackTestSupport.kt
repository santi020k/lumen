// cspell:words accessibilityservice
package com.santi020k.lumen

import android.accessibilityservice.AccessibilityServiceInfo
import android.view.KeyEvent
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.platform.app.InstrumentationRegistry

/** Wait for native popup window focus before injecting a real system Back event. */
internal fun pressBackOnFocusedPopup(
    rule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity>,
) {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    val automation = instrumentation.uiAutomation
    val packageName = instrumentation.targetContext.packageName
    val originalFlags = automation.serviceInfo.flags
    val configuration = automation.serviceInfo
    configuration.flags = originalFlags or AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
    automation.serviceInfo = configuration
    try {
        rule.waitUntil(timeoutMillis = 5_000) {
            val activityWindowId = rule.runOnUiThread {
                rule.activity.window.decorView.createAccessibilityNodeInfo().windowId
            }
            activityWindowId >= 0 && automation.windows.any { window ->
                window.isFocused && window.id != activityWindowId && window.root?.packageName == packageName
            }
        }
        instrumentation.sendKeyDownUpSync(KeyEvent.KEYCODE_BACK)
    } finally {
        configuration.flags = originalFlags
        automation.serviceInfo = configuration
    }
}
