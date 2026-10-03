package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.painter.Painter
import com.santi020k.lumen.rememberLumenTooltipState
import com.santi020k.lumen.LocalLumenTheme
import com.santi020k.lumen.LumenControlSize
import com.santi020k.lumen.LumenButton
import com.santi020k.lumen.LumenIconButton
import com.santi020k.lumen.LumenIconName
import com.santi020k.lumen.LumenImageComparison
import com.santi020k.lumen.LumenInputOTP
import com.santi020k.lumen.LumenPasswordField
import com.santi020k.lumen.LumenSegmentedControl
import com.santi020k.lumen.LumenSelectionOption
import com.santi020k.lumen.LumenSpacing
import com.santi020k.lumen.LumenText
import com.santi020k.lumen.LumenTooltip
import java.util.Locale
import kotlinx.coroutines.launch

internal val secureFormNames = setOf("Password field", "Input OTP")

/** Synthetic credentials are never persisted or sent anywhere. */
@Composable
internal fun SecureFormsExample(component: String = "") {
    var language by remember { mutableStateOf("en") }
    var password by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var complete by remember { mutableStateOf(false) }
    val spanish = language == "es"
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
        LanguagePicker(language) { language = it }
        if (component.isEmpty() || component == "Password field") {
            LumenPasswordField(
                if (spanish) "Contraseña" else "Password", password, { password = it },
                modifier = Modifier.fillMaxWidth(),
                description = if (spanish) "Ejemplo local sin cuenta real" else "Local example without a real account",
                showLabel = if (spanish) "Mostrar contraseña" else "Show password",
                hideLabel = if (spanish) "Ocultar contraseña" else "Hide password", newPassword = true
            )
            LumenPasswordField(
                if (spanish) "Solo lectura" else "Read only", "sample-only", {}, modifier = Modifier.fillMaxWidth(), readOnly = true
            )
        }
        if (component.isEmpty() || component == "Input OTP") {
            LumenInputOTP(
                if (spanish) "Código" else "Code", code, { code = it; complete = false },
                modifier = Modifier.fillMaxWidth(), onComplete = { complete = true },
                description = if (spanish) "Introduce o pega seis dígitos" else "Enter or paste six digits"
            )
            LumenText(if (complete) (if (spanish) "Código completo" else "Code complete") else (if (spanish) "Esperando código" else "Waiting for code"))
            LumenInputOTP(if (spanish) "Código oculto" else "Masked code", "123456", {}, modifier = Modifier.fillMaxWidth(), masked = true, readOnly = true)
        }
    }
}

@Composable
internal fun TooltipExample() {
    var language by remember { mutableStateOf("en") }
    val spanish = language == "es"
    val state = rememberLumenTooltipState(isPersistent = true)
    val scope = rememberCoroutineScope()
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
        LanguagePicker(language) { language = it }
        LumenText(if (spanish) "Mantén pulsado el icono para mostrar ayuda" else "Long press the icon to show help")
        LumenTooltip(if (spanish) "Guardar este proyecto" else "Save this project", state = state) {
            LumenIconButton(LumenIconName.Bookmark, if (spanish) "Guardar" else "Save", onClick = {}, size = LumenControlSize.Lg)
        }
        LumenButton(onClick = { scope.launch { state.show() } }) {
            LumenText(if (spanish) "Mostrar ayuda" else "Show help")
        }
        LumenButton(onClick = { state.dismiss() }) {
            LumenText(if (spanish) "Cerrar ayuda" else "Dismiss help")
        }
    }
}

private class ComparisonExamplePainter(private val sky: Color, private val landscape: Color) : Painter() {
    override val intrinsicSize = Size(640f, 360f)
    override fun DrawScope.onDraw() {
        drawRect(sky)
        drawCircle(landscape, radius = size.minDimension * 0.13f, center = Offset(size.width * 0.75f, size.height * 0.25f))
        drawRect(landscape, topLeft = Offset(0f, size.height * 0.7f), size = Size(size.width, size.height * 0.3f))
    }
}

@Composable
internal fun ImageComparisonExample() {
    var language by remember { mutableStateOf("en") }
    var value by remember { mutableStateOf(0.5f) }
    val spanish = language == "es"
    val colors = LocalLumenTheme.current.colors
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
        LanguagePicker(language) { language = it }
        LumenImageComparison(
            label = if (spanish) "Comparar imágenes" else "Compare images",
            before = ComparisonExamplePainter(colors.surfaceMuted, colors.inkMuted),
            after = ComparisonExamplePainter(colors.brandSoft, colors.brand),
            value = value, onValueChange = { value = it },
            beforeLabel = if (spanish) "Antes" else "Before", afterLabel = if (spanish) "Después" else "After",
            locale = if (spanish) Locale.forLanguageTag("es") else Locale.ENGLISH
        )
        LumenText(if (spanish) "Ajusta el control para comparar ambas imágenes" else "Adjust the slider to compare both images")
    }
}

@Composable
private fun LanguagePicker(value: String, onValueChange: (String) -> Unit) {
    LumenSegmentedControl(label = "Language / Idioma", value = value, onValueChange = onValueChange,
        options = listOf(LumenSelectionOption("en", "English"), LumenSelectionOption("es", "Español")))
}
