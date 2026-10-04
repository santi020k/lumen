// cspell:words keyboardqualification
package com.santi020k.lumen.playground.restoration

import android.os.SystemClock
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.BySelector
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayOutputStream

/** A separate target keeps instrumentation alive when the playground process dies. */
class WorkspaceProcessDeathTest {
    private val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
    private val timeoutMs = 15_000L
    private val note = "A long keyboard-edited note. ".repeat(40)

    @Test
    fun stoppedProcessRestoresUnsavedDraftAndSavedRecord() {
        val target = requireNotNull(InstrumentationRegistry.getArguments().getString("targetPackage")) {
            "Pass targetPackage for an isolated qualification installation."
        }
        require(target == "com.santi020k.lumen.playground.compose.keyboardqualification") {
            "This destructive process test only accepts the isolated qualification application."
        }
        val component = "$target/com.santi020k.lumen.playground.compose.MainActivity"

        assertTrue("Install the isolated playground before running the driver", device.executeShellCommand("pm path $target").startsWith("package:"))

        // Start a fresh task without clearing application storage or touching the public app.
        launch(component, fresh = true)
        click("Examples")
        click("Workspace")
        element(By.clazz("android.widget.EditText")).text = "Lumen 200"
        element(By.text("Lumen 200").clazz("android.widget.TextView")).click()
        device.waitForIdle()
        click("Edit record")
        element(By.clazz("android.widget.EditText").text("Lumen 200")).text = "Retained draft"
        val fields = device.findObjects(By.clazz("android.widget.EditText"))
        val notes = fields.single { it.text != "Retained draft" }
        notes.text = note
        assertEquals(note, element(By.clazz("android.widget.EditText").text(note)).text)

        killStoppedProcessAndResume(target, component)
        assertEquals("Retained draft", element(By.clazz("android.widget.EditText").text("Retained draft")).text)
        assertEquals(note, element(By.clazz("android.widget.EditText").text(note)).text)
        click("Save")
        element(By.text("Changes saved locally"))

        killStoppedProcessAndResume(target, component)
        element(By.text("Retained draft"))
        element(By.text("Changes saved locally"))
        click("Edit record")
        assertEquals(note, element(By.clazz("android.widget.EditText").text(note)).text)
    }

    private fun killStoppedProcessAndResume(target: String, component: String) {
        val before = device.executeShellCommand("pidof $target").trim()
        assertTrue("Target process must be alive before the test", before.isNotEmpty())
        device.pressHome()
        assertTrue("Playground must leave the foreground before killing", device.wait(Until.gone(By.pkg(target)), timeoutMs))
        device.waitForIdle()
        device.executeShellCommand("am kill $target")
        val deadline = SystemClock.uptimeMillis() + timeoutMs
        while (device.executeShellCommand("pidof $target").trim().isNotEmpty() && SystemClock.uptimeMillis() < deadline) {
            SystemClock.sleep(100)
        }
        assertEquals("Target process must actually terminate", "", device.executeShellCommand("pidof $target").trim())
        launch(component, fresh = false)
        element(By.pkg(target))
        val after = device.executeShellCommand("pidof $target").trim()
        assertTrue("Restored activity must have a process", after.isNotEmpty())
        assertNotEquals("Restoration must run in a new process", before, after)
        println("Lumen process restoration: $before -> $after")
    }

    private fun launch(component: String, fresh: Boolean) {
        val flags = if (fresh) "-f 0x10008000" else "-f 0x10200000"
        val result = device.executeShellCommand("am start -W $flags -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -n $component")
        assertTrue("Playground launch failed: $result", result.contains("Status: ok"))
    }

    private fun element(selector: BySelector): UiObject2 {
        val found = device.wait(Until.findObject(selector), timeoutMs)
        if (found != null) return found
        val hierarchy = ByteArrayOutputStream()
        device.dumpWindowHierarchy(hierarchy)
        error("Missing qualification element: $selector\n${hierarchy.toString(Charsets.UTF_8.name())}")
    }

    private fun click(text: String) {
        element(By.text(text)).click()
        device.waitForIdle()
    }
}
