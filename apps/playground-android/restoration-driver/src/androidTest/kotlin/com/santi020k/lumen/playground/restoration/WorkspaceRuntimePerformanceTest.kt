// cspell:words performancequalification framestats gfxinfo
package com.santi020k.lumen.playground.restoration

import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.shell.Shell
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Direction
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** Samples local release behavior; emulator timings do not qualify physical devices. */
class WorkspaceRuntimePerformanceTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val device = UiDevice.getInstance(instrumentation)
    private val target = "com.santi020k.lumen.playground.compose.performancequalification"
    private val timeoutMs = 15_000L

    @Test
    fun collectsColdLaunchesAndScrollingFrames() {
        require(InstrumentationRegistry.getArguments().getString("targetPackage") == target) {
            "Select only the isolated benchmark installation."
        }
        assertTrue("Install the benchmark target first", device.executeShellCommand("pm path $target").startsWith("package:"))
        val output = "/data/local/tmp/lumen-workspace-runtime-${System.currentTimeMillis()}"
        device.executeShellCommand("mkdir -p $output")
        repeat(5) { iteration ->
            device.executeShellCommand("am force-stop $target")
            assertTrue("Cold launch must start without an existing process", device.executeShellCommand("pidof $target").isBlank())
            capture("am start -W -f 0x10008000 -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -n $target/com.santi020k.lumen.playground.compose.MainActivity", "$output/launch-$iteration.txt")
            val launch = device.executeShellCommand("cat $output/launch-$iteration.txt")
            assertTrue("Expected a process-cold successful launch: $launch", launch.contains("Status: ok") && launch.contains("LaunchState: COLD"))
            element("Examples")
        }
        element("Examples").click()
        element("Workspace").click()
        device.waitForIdle()
        val list = requireNotNull(device.wait(Until.findObject(By.pkg(target).scrollable(true)), timeoutMs)) {
            "Missing workspace scrolling container"
        }
        val before = recordRange()
        println("Lumen runtime records before: $before")
        device.executeShellCommand("dumpsys gfxinfo $target reset")
        repeat(6) { iteration ->
            list.scroll(Direction.DOWN, 0.8f)
            device.waitForIdle()
            capture("dumpsys gfxinfo $target framestats", "$output/frames-$iteration.txt")
        }
        capture("cat /proc/uptime", "$output/uptime.txt")
        val after = recordRange()
        println("Lumen runtime records after: $after")
        assertNotEquals("Measured scrolling must move the actual record list", before, after)
        assertTrue("Measured list must contain records", before.isNotEmpty() && after.isNotEmpty())
        println("Lumen runtime sample files: $output")
    }

    // Commands and paths come exclusively from fixed qualification fixtures.
    private fun capture(command: String, path: String) {
        val result = Shell.command("$command > $path")
        result.stdOut
        assertTrue("Diagnostic capture failed: ${result.stdErr}", result.stdErr.isBlank())
    }

    private fun recordRange(): List<Int> = device.findObjects(By.pkg(target).textStartsWith("Lumen "))
        .map { it.text }
        .filter { it.matches(Regex("Lumen [0-9]{3}")) }
        .map { it.removePrefix("Lumen ").toInt() }

    private fun element(text: String): UiObject2 = requireNotNull(device.wait(Until.findObject(By.pkg(target).text(text)), timeoutMs)) {
        "Missing benchmark element: $text"
    }
}
