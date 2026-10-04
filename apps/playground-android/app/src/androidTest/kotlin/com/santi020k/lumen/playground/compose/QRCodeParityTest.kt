package com.santi020k.lumen.playground.compose

import android.graphics.Bitmap
import androidx.activity.ComponentActivity
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.test.platform.app.InstrumentationRegistry
import com.santi020k.lumen.LumenTheme
import com.santi020k.lumen.LumenSurface
import java.io.File
import org.junit.Rule
import org.junit.Test

class QRCodeParityTest {
    @get:Rule val composeRule = createAndroidComposeRule<ComponentActivity>()

    @Test fun rendersUnicodeLocalizedErrorsAndControlledRecoveryInBothSchemes() {
        val dark = mutableStateOf(false)
        composeRule.setContent { LumenTheme(darkTheme = dark.value) { LumenSurface { QRCodeParityExample() } } }
        for (scheme in listOf("light", "dark")) {
            composeRule.runOnIdle { dark.value = scheme == "dark" }
            val value = "https://lumen.santi020k.com"
            val english = "Example QR code: $value"
            val spanish = "Código QR de ejemplo: $value"
            if (scheme == "dark") composeRule.onNodeWithText("English / Español").performClick()
            composeRule.onNodeWithContentDescription(english).assertIsDisplayed()
            capture("$scheme-ready")
            composeRule.onNodeWithText("Unicode").performClick()
            composeRule.onNodeWithContentDescription("Example QR code: https://lumen.santi020k.com/日本語?name=Molina🌞").assertIsDisplayed()
            capture("$scheme-unicode")
            composeRule.onNodeWithText("English / Español").performClick()
            composeRule.onNodeWithText("Vacío").performClick()
            composeRule.onNodeWithText("No se pudo generar el código QR").assertIsDisplayed()
            composeRule.onNodeWithContentDescription(spanish).assertDoesNotExist()
            capture("$scheme-empty-es")
            composeRule.onNodeWithText("Exceso").performClick()
            composeRule.onNodeWithText("No se pudo generar el código QR").assertIsDisplayed()
            capture("$scheme-oversize-es")
            composeRule.onNodeWithText("Restaurar").performClick()
            composeRule.onNodeWithContentDescription(spanish).assertIsDisplayed()
            capture("$scheme-restored-es")
        }
    }

    private fun capture(state: String) {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val width = context.resources.configuration.screenWidthDp
        val directory = File(context.getExternalFilesDir(null), "qrcode-evidence")
        directory.mkdirs()
        File(directory, "compose-$width-$state.png").outputStream().use { output ->
            composeRule.onRoot().captureToImage().asAndroidBitmap().compress(Bitmap.CompressFormat.PNG, 100, output)
        }
    }
}
